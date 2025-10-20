"""OpenAI-compatible API endpoints."""

import base64
import io
import logging
import time
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from hypergen.serve.queue import GenerationRequest, RequestQueue

logger = logging.getLogger(__name__)


# Request/Response Models (OpenAI-compatible)
class ImageGenerationRequest(BaseModel):
    """OpenAI-compatible image generation request."""

    prompt: str = Field(..., description="Text prompt for generation")
    model: Optional[str] = Field(None, description="Model to use (optional)")
    n: int = Field(1, description="Number of images to generate", ge=1, le=10)
    size: str = Field("1024x1024", description="Image size (e.g., '1024x1024')")
    quality: str = Field("standard", description="Quality (standard or hd)")
    response_format: str = Field("url", description="Response format (url or b64_json)")

    # HyperGen-specific extensions
    negative_prompt: Optional[str] = Field(None, description="Negative prompt")
    num_inference_steps: int = Field(50, description="Number of inference steps", ge=1, le=150)
    guidance_scale: float = Field(7.5, description="Guidance scale", ge=1.0, le=20.0)
    seed: Optional[int] = Field(None, description="Random seed for reproducibility")
    lora_path: Optional[str] = Field(None, description="Path to LoRA weights")
    lora_scale: float = Field(1.0, description="LoRA scaling factor", ge=0.0, le=2.0)


class ImageObject(BaseModel):
    """Image object in response."""

    b64_json: Optional[str] = None
    url: Optional[str] = None
    revised_prompt: Optional[str] = None


class ImageGenerationResponse(BaseModel):
    """OpenAI-compatible image generation response."""

    created: int = Field(..., description="Unix timestamp")
    data: list[ImageObject] = Field(..., description="Generated images")


class ModelInfo(BaseModel):
    """Model information."""

    id: str
    object: str = "model"
    created: int
    owned_by: str = "hypergen"


class ModelsResponse(BaseModel):
    """List of available models."""

    object: str = "list"
    data: list[ModelInfo]


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    model: str
    queue_size: int
    device: str


def create_app(
    queue: RequestQueue,
    model_id: str,
    device: str,
    api_key: Optional[str] = None,
) -> FastAPI:
    """
    Create FastAPI application with OpenAI-compatible endpoints.

    Args:
        queue: Request queue
        model_id: Model identifier
        device: Device model is running on
        api_key: Optional API key for authentication

    Returns:
        FastAPI application
    """
    app = FastAPI(
        title="HyperGen API",
        description="OpenAI-compatible API for diffusion models",
        version="0.1.0",
    )

    # Authentication dependency
    async def verify_api_key(authorization: Optional[str] = Header(None)) -> None:
        """Verify API key if configured."""
        if api_key is None:
            return

        if authorization is None:
            raise HTTPException(status_code=401, detail="Missing authorization header")

        # Support both "Bearer token" and just "token"
        token = authorization.replace("Bearer ", "")

        if token != api_key:
            raise HTTPException(status_code=401, detail="Invalid API key")

    @app.get("/health")
    async def health() -> HealthResponse:
        """Health check endpoint."""
        return HealthResponse(
            status="healthy",
            model=model_id,
            queue_size=queue.qsize(),
            device=device,
        )

    @app.get("/v1/models")
    async def list_models(auth: None = Depends(verify_api_key)) -> ModelsResponse:
        """List available models (OpenAI-compatible)."""
        return ModelsResponse(
            object="list",
            data=[
                ModelInfo(
                    id=model_id,
                    created=int(time.time()),
                )
            ],
        )

    @app.post("/v1/images/generations")
    async def generate_images(
        request: ImageGenerationRequest,
        auth: None = Depends(verify_api_key),
    ) -> ImageGenerationResponse:
        """
        Generate images (OpenAI-compatible endpoint).

        This endpoint is compatible with OpenAI's image generation API.
        """
        # Parse size
        try:
            width, height = map(int, request.size.split("x"))
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid size format: {request.size}. Use format like '1024x1024'"
            )

        # Create generation request
        gen_request = GenerationRequest(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
            width=width,
            height=height,
            num_images=request.n,
            seed=request.seed,
            lora_path=request.lora_path,
            lora_scale=request.lora_scale,
        )

        # Add to queue
        await queue.put(gen_request)

        logger.info(f"Request {gen_request.request_id} queued (queue size: {queue.qsize()})")

        # Wait for result
        try:
            images = await gen_request.future
        except Exception as e:
            logger.error(f"Generation failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

        # Format response
        image_objects = []

        for image in images:
            if request.response_format == "b64_json":
                # Convert PIL image to base64
                buffer = io.BytesIO()
                image.save(buffer, format="PNG")
                b64_string = base64.b64encode(buffer.getvalue()).decode()

                image_objects.append(
                    ImageObject(b64_json=b64_string, revised_prompt=request.prompt)
                )
            else:
                # URL format not implemented yet
                # In production, you'd upload to storage and return URL
                image_objects.append(
                    ImageObject(url=None, revised_prompt=request.prompt)
                )

        return ImageGenerationResponse(
            created=int(time.time()),
            data=image_objects,
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        """Handle unexpected errors."""
        logger.error(f"Unhandled error: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": {"message": str(exc), "type": "internal_error"}},
        )

    return app
