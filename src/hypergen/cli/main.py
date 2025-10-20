"""Main CLI entry point for HyperGen."""

import argparse
import sys
from typing import Optional


def create_parser() -> argparse.ArgumentParser:
    """Create the main argument parser."""
    parser = argparse.ArgumentParser(
        prog="hypergen",
        description="HyperGen - Optimized diffusion model serving and training",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        "--version",
        action="version",
        version="%(prog)s 0.1.0",
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Serve command
    serve_parser = subparsers.add_parser(
        "serve",
        help="Start an OpenAI-compatible API server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        description="""
Start an HTTP server that serves diffusion models with an OpenAI-compatible API.

Examples:
  # Serve SDXL
  hypergen serve stabilityai/stable-diffusion-xl-base-1.0

  # Serve with LoRA
  hypergen serve stabilityai/stable-diffusion-xl-base-1.0 \\
    --lora ./my_lora

  # Serve on custom port with API key
  hypergen serve black-forest-labs/FLUX.1-dev \\
    --port 8000 \\
    --api-key token-abc123 \\
    --dtype bfloat16
        """,
    )

    serve_parser.add_argument(
        "model",
        type=str,
        help="HuggingFace model ID or local path",
    )

    serve_parser.add_argument(
        "--lora",
        type=str,
        default=None,
        help="Path to LoRA weights to load (optional)",
    )

    serve_parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="Host to bind the server to (default: 0.0.0.0)",
    )

    serve_parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to bind the server to (default: 8000)",
    )

    serve_parser.add_argument(
        "--api-key",
        type=str,
        default=None,
        help="API key for authentication (optional)",
    )

    serve_parser.add_argument(
        "--dtype",
        type=str,
        default="float16",
        choices=["float16", "bfloat16", "float32", "fp16", "bf16", "fp32"],
        help="Data type for model weights (default: float16)",
    )

    serve_parser.add_argument(
        "--device",
        type=str,
        default="cuda",
        help="Device to run the model on (default: cuda)",
    )

    serve_parser.add_argument(
        "--max-queue-size",
        type=int,
        default=100,
        help="Maximum number of requests in queue (default: 100)",
    )

    serve_parser.add_argument(
        "--max-batch-size",
        type=int,
        default=1,
        help="Maximum batch size for processing (default: 1)",
    )

    serve_parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable auto-reload on code changes (development only)",
    )

    return parser


def main(args: Optional[list[str]] = None) -> int:
    """Main entry point for the CLI."""
    parser = create_parser()
    parsed_args = parser.parse_args(args)

    if parsed_args.command is None:
        parser.print_help()
        return 0

    if parsed_args.command == "serve":
        from hypergen.serve.server import run_server
        return run_server(parsed_args)

    parser.print_help()
    return 1


def cli_entrypoint() -> None:
    """Entry point for the installed CLI command."""
    sys.exit(main())


if __name__ == "__main__":
    cli_entrypoint()
