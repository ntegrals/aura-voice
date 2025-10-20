"""Request queue management for batching and processing."""

import asyncio
import time
from dataclasses import dataclass, field
from typing import Any, Optional
from uuid import uuid4


@dataclass
class GenerationRequest:
    """A single generation request."""

    request_id: str = field(default_factory=lambda: str(uuid4()))
    prompt: str | list[str] = ""
    negative_prompt: Optional[str] = None
    num_inference_steps: int = 50
    guidance_scale: float = 7.5
    width: int = 1024
    height: int = 1024
    num_images: int = 1
    seed: Optional[int] = None
    lora_path: Optional[str] = None
    lora_scale: float = 1.0

    # Internal state
    created_at: float = field(default_factory=time.time)
    future: Optional[asyncio.Future] = field(default=None, init=False)

    def __post_init__(self):
        """Initialize the future for async result handling."""
        if self.future is None:
            self.future = asyncio.Future()


class RequestQueue:
    """
    Queue for managing generation requests with batching support.

    Features:
    - FIFO ordering
    - Async/await interface
    - Batching for efficiency
    - Max queue size limits
    """

    def __init__(self, max_size: int = 100):
        """
        Initialize the request queue.

        Args:
            max_size: Maximum number of requests allowed in queue
        """
        self.max_size = max_size
        self._queue: list[GenerationRequest] = []
        self._lock = asyncio.Lock()
        self._not_empty = asyncio.Condition(self._lock)
        self._not_full = asyncio.Condition(self._lock)

    async def put(self, request: GenerationRequest) -> None:
        """
        Add a request to the queue.

        Args:
            request: The generation request to queue

        Raises:
            asyncio.QueueFull: If queue is at max capacity
        """
        async with self._not_full:
            # Wait if queue is full
            while len(self._queue) >= self.max_size:
                await self._not_full.wait()

            self._queue.append(request)
            self._not_empty.notify()

    async def get(self, max_batch_size: int = 1) -> list[GenerationRequest]:
        """
        Get a batch of requests from the queue.

        Args:
            max_batch_size: Maximum number of requests to return

        Returns:
            List of requests (up to max_batch_size)
        """
        async with self._not_empty:
            # Wait for at least one request
            while len(self._queue) == 0:
                await self._not_empty.wait()

            # Get up to max_batch_size requests
            batch_size = min(len(self._queue), max_batch_size)
            batch = self._queue[:batch_size]
            self._queue = self._queue[batch_size:]

            # Notify that queue has space
            self._not_full.notify()

            return batch

    async def size(self) -> int:
        """Get current queue size."""
        async with self._lock:
            return len(self._queue)

    def qsize(self) -> int:
        """Get current queue size (sync version)."""
        return len(self._queue)
