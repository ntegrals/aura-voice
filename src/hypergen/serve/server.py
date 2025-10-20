"""Server runner that orchestrates the API server and model worker."""

import asyncio
import logging
import sys
from argparse import Namespace

import uvicorn

from hypergen.serve.api import create_app
from hypergen.serve.queue import RequestQueue
from hypergen.serve.worker import ModelWorker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger(__name__)


class Server:
    """
    Main server that manages the API and model worker.

    Features:
    - Async API server (FastAPI + uvicorn)
    - Background model worker for processing
    - Request queue for batching
    - Graceful shutdown
    """

    def __init__(
        self,
        model_id: str,
        host: str = "0.0.0.0",
        port: int = 8000,
        device: str = "cuda",
        dtype: str = "float16",
        lora_path: str = None,
        api_key: str = None,
        max_queue_size: int = 100,
        max_batch_size: int = 1,
    ):
        """
        Initialize the server.

        Args:
            model_id: HuggingFace model ID or local path
            host: Host to bind to
            port: Port to bind to
            device: Device to run on
            dtype: Model data type
            lora_path: Optional LoRA weights path
            api_key: Optional API key for auth
            max_queue_size: Maximum queue size
            max_batch_size: Maximum batch size
        """
        self.model_id = model_id
        self.host = host
        self.port = port
        self.device = device
        self.dtype = dtype
        self.lora_path = lora_path
        self.api_key = api_key
        self.max_queue_size = max_queue_size
        self.max_batch_size = max_batch_size

        # Components
        self.queue = RequestQueue(max_size=max_queue_size)
        self.worker = ModelWorker(
            model_id=model_id,
            device=device,
            dtype=dtype,
            lora_path=lora_path,
        )
        self.app = None
        self.worker_task = None

    async def start(self) -> None:
        """Start the server and worker."""
        logger.info("Starting HyperGen server...")
        logger.info(f"  Model: {self.model_id}")
        logger.info(f"  Device: {self.device}")
        logger.info(f"  Host: {self.host}")
        logger.info(f"  Port: {self.port}")
        logger.info(f"  Max queue size: {self.max_queue_size}")
        logger.info(f"  Max batch size: {self.max_batch_size}")

        if self.lora_path:
            logger.info(f"  LoRA: {self.lora_path}")

        if self.api_key:
            logger.info("  Authentication: Enabled")

        # Initialize model worker
        logger.info("Initializing model worker...")
        await self.worker.initialize()

        # Start worker task
        logger.info("Starting worker task...")
        self.worker_task = asyncio.create_task(
            self.worker.start(self.queue, self.max_batch_size)
        )

        # Create FastAPI app
        self.app = create_app(
            queue=self.queue,
            model_id=self.model_id,
            device=self.device,
            api_key=self.api_key,
        )

        logger.info("Server ready!")

    async def stop(self) -> None:
        """Stop the server gracefully."""
        logger.info("Stopping server...")

        # Stop worker
        if self.worker_task:
            self.worker.stop()
            self.worker_task.cancel()
            try:
                await self.worker_task
            except asyncio.CancelledError:
                pass

        logger.info("Server stopped")


def run_server(args: Namespace) -> int:
    """
    Run the server with given arguments.

    Args:
        args: Parsed command-line arguments

    Returns:
        Exit code
    """
    # Create server
    server = Server(
        model_id=args.model,
        host=args.host,
        port=args.port,
        device=args.device,
        dtype=args.dtype,
        lora_path=args.lora,
        api_key=args.api_key,
        max_queue_size=args.max_queue_size,
        max_batch_size=args.max_batch_size,
    )

    # Start server in async context
    async def run():
        await server.start()

        # Configure uvicorn
        config = uvicorn.Config(
            app=server.app,
            host=args.host,
            port=args.port,
            log_level="info",
            reload=args.reload,
        )

        # Run server
        server_instance = uvicorn.Server(config)

        try:
            await server_instance.serve()
        except KeyboardInterrupt:
            logger.info("Received interrupt signal")
        finally:
            await server.stop()

    # Run
    try:
        asyncio.run(run())
        return 0
    except Exception as e:
        logger.error(f"Server error: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    # For testing
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("model", type=str)
    parser.add_argument("--host", type=str, default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--device", type=str, default="cuda")
    parser.add_argument("--dtype", type=str, default="float16")
    parser.add_argument("--lora", type=str, default=None)
    parser.add_argument("--api-key", type=str, default=None)
    parser.add_argument("--max-queue-size", type=int, default=100)
    parser.add_argument("--max-batch-size", type=int, default=1)
    parser.add_argument("--reload", action="store_true")

    args = parser.parse_args()
    sys.exit(run_server(args))
