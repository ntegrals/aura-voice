"""Example client for HyperGen API server."""

import base64
import io
from pathlib import Path

from openai import OpenAI
from PIL import Image


def save_image_from_b64(b64_string: str, output_path: str) -> None:
    """Save base64-encoded image to file."""
    image_data = base64.b64decode(b64_string)
    image = Image.open(io.BytesIO(image_data))
    image.save(output_path)
    print(f"Saved image to {output_path}")


# Example 1: Using OpenAI client (recommended)
def example_openai_client():
    """Use the official OpenAI client."""
    # Create client pointing to your HyperGen server
    client = OpenAI(
        api_key="token-abc123",  # Your API key from --api-key
        base_url="http://localhost:8000/v1",  # Your server URL
    )

    print("Generating images with OpenAI client...")

    # Generate images (OpenAI-compatible API)
    response = client.images.generate(
        model="sdxl",  # Model name (informational)
        prompt="A cat holding a sign that says hello world",
        n=2,  # Number of images
        size="1024x1024",
        response_format="b64_json",  # or "url"
    )

    # Save images
    output_dir = Path("./outputs")
    output_dir.mkdir(exist_ok=True)

    for i, image_data in enumerate(response.data):
        output_path = output_dir / f"image_{i}.png"
        save_image_from_b64(image_data.b64_json, str(output_path))


# Example 2: Using requests directly
def example_requests():
    """Use requests library directly."""
    import requests

    print("\nGenerating images with requests...")

    # API endpoint
    url = "http://localhost:8000/v1/images/generations"

    # Request payload
    payload = {
        "prompt": "A serene mountain landscape at sunset",
        "n": 1,
        "size": "1024x1024",
        "response_format": "b64_json",
        # HyperGen-specific parameters
        "num_inference_steps": 30,
        "guidance_scale": 7.5,
        "seed": 42,
    }

    # Headers
    headers = {
        "Authorization": "Bearer token-abc123",
        "Content-Type": "application/json",
    }

    # Make request
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()

    # Get result
    result = response.json()

    # Save images
    output_dir = Path("./outputs")
    output_dir.mkdir(exist_ok=True)

    for i, image_obj in enumerate(result["data"]):
        output_path = output_dir / f"landscape_{i}.png"
        save_image_from_b64(image_obj["b64_json"], str(output_path))


# Example 3: Using LoRA
def example_with_lora():
    """Generate with custom LoRA."""
    client = OpenAI(
        api_key="token-abc123",
        base_url="http://localhost:8000/v1",
    )

    print("\nGenerating images with LoRA...")

    # This uses HyperGen-specific extension fields
    response = client.images.generate(
        model="sdxl",
        prompt="A photo in my style",
        n=1,
        size="1024x1024",
        response_format="b64_json",
        # HyperGen extensions (passed as extra_body if using OpenAI SDK)
    )

    # To use LoRA with requests:
    import requests

    payload = {
        "prompt": "A photo in my style",
        "n": 1,
        "size": "1024x1024",
        "response_format": "b64_json",
        "lora_path": "./path/to/lora",  # HyperGen extension
        "lora_scale": 0.8,  # HyperGen extension
    }

    response = requests.post(
        "http://localhost:8000/v1/images/generations",
        json=payload,
        headers={"Authorization": "Bearer token-abc123"},
    )

    result = response.json()

    output_dir = Path("./outputs")
    output_dir.mkdir(exist_ok=True)

    for i, image_obj in enumerate(result["data"]):
        output_path = output_dir / f"lora_image_{i}.png"
        save_image_from_b64(image_obj["b64_json"], str(output_path))


# Example 4: Check server health
def example_health_check():
    """Check server health."""
    import requests

    print("\nChecking server health...")

    response = requests.get("http://localhost:8000/health")
    health = response.json()

    print(f"  Status: {health['status']}")
    print(f"  Model: {health['model']}")
    print(f"  Queue size: {health['queue_size']}")
    print(f"  Device: {health['device']}")


if __name__ == "__main__":
    # Run examples
    print("HyperGen API Client Examples")
    print("=" * 50)

    # Make sure server is running first!
    # hypergen serve stabilityai/stable-diffusion-xl-base-1.0 --api-key token-abc123

    try:
        example_health_check()
        example_openai_client()
        example_requests()
        # example_with_lora()  # Uncomment if you have a LoRA to test

    except Exception as e:
        print(f"\nError: {e}")
        print("\nMake sure the server is running:")
        print("  hypergen serve stabilityai/stable-diffusion-xl-base-1.0 --api-key token-abc123")
