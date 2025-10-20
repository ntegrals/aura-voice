"""Model worker for processing generation requests."""

import asyncio
import logging
from typing import Any, Optional

from hypergen.model import model
from hypergen.serve.queue import GenerationRequest, RequestQueue

logger = logging.getLogger(__name__)


class ModelWorker:
    """
    Worker that processes generation requests from the queue.

    Features:
    - Loads and manages the model
    - Processes requests in batches
    - Supports LoRA loading and switching
    - Handles errors gracefully
    """

    def __init__(
        self,
        model_id: str,
        device: str = "cuda",
        dtype: str = "float16",
        lora_path: Optional[str] = None,
    ):
        """
        Initialize the model worker.

        Args:
            model_id: HuggingFace model ID or local path
            device: Device to run on (cuda, cpu, mps)
            dtype: Data type for model weights
            lora_path: Optional path to LoRA weights
        """
        self.model_id = model_id
        self.device = device
        self.dtype = dtype
        self.default_lora_path = lora_path

        self._model = None
        self._current_lora = None
        self._running = False

    async def initialize(self) -> None:
        """Load the model and LoRA if specified."""
        logger.info(f"Loading model: {self.model_id}")

        # Load model in a thread to avoid blocking
        loop = asyncio.get_event_loop()
        self._model = await loop.run_in_executor(
            None,
            lambda: model.load(self.model_id, torch_dtype=self.dtype).to(self.device)
        )

        logger.info(f"Model loaded on {self.device}")

        # Load default LoRA if specified
        if self.default_lora_path:
            await self.load_lora(self.default_lora_path)

    async def load_lora(self, lora_path: str) -> None:
        """
        Load LoRA weights.

        Args:
            lora_path: Path to LoRA weights

        TODO: Implement LoRA loading
        """
        logger.info(f"Loading LoRA from: {lora_path}")
        self._current_lora = lora_path
        # TODO: Implement actual LoRA loading
        # self._model.load_lora(lora_path)

    async def process_batch(self, requests: list[GenerationRequest]) -> None:
        """
        Process a batch of generation requests.

        Args:
            requests: List of requests to process
        """
        if not requests:
            return

        logger.info(f"Processing batch of {len(requests)} requests")

        for request in requests:
            try:
                # Switch LoRA if needed
                if request.lora_path and request.lora_path != self._current_lora:
                    await self.load_lora(request.lora_path)

                # Generate image(s)
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(
                    None,
                    lambda: self._generate(request)
                )

                # Set result
                if not request.future.done():
                    request.future.set_result(result)

            except Exception as e:
                logger.error(f"Error processing request {request.request_id}: {e}")
                if not request.future.done():
                    request.future.set_exception(e)

    def _generate(self, request: GenerationRequest) -> Any:
        """
        Synchronous generation (runs in thread pool).

        Args:
            request: The generation request

        Returns:
            Generated images
        """
        # Build generation kwargs
        kwargs = {
            "num_inference_steps": request.num_inference_steps,
            "guidance_scale": request.guidance_scale,
            "width": request.width,
            "height": request.height,
            "num_images_per_prompt": request.num_images,
        }

        if request.negative_prompt:
            kwargs["negative_prompt"] = request.negative_prompt

        if request.seed is not None:
            import torch
            kwargs["generator"] = torch.Generator(device=self.device).manual_seed(
                request.seed
            )

        # Generate
        images = self._model.generate(request.prompt, **kwargs)

        return images

    async def start(self, queue: RequestQueue, max_batch_size: int = 1) -> None:
        """
        Start processing requests from the queue.

        Args:
            queue: Request queue to process
            max_batch_size: Maximum batch size
        """
        self._running = True
        logger.info("Model worker started")

        try:
            while self._running:
                # Get batch from queue
                batch = await queue.get(max_batch_size)

                # Process batch
                await self.process_batch(batch)

        except asyncio.CancelledError:
            logger.info("Model worker stopped")
            raise

    def stop(self) -> None:
        """Stop the worker."""
        self._running = False
