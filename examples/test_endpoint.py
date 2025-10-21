#!/usr/bin/env python3
"""
Quick test of the HyperGen serve endpoint.

Prerequisites:
1. Start the server first:
   hypergen serve stabilityai/sdxl-turbo --port 8000

2. Install requests:
   pip install requests

Usage:
   python examples/test_endpoint.py
"""
import requests
import base64
from pathlib import Path
import sys

# Configuration
BASE_URL = "http://localhost:8000"
API_KEY = None  # Set this if your server requires authentication

# Setup headers
headers = {}
if API_KEY:
    headers["Authorization"] = f"Bearer {API_KEY}"


def test_health():
    """Test the health check endpoint."""
    print("=" * 60)
    print("Testing /health endpoint...")
    print("=" * 60)

    try:
        response = requests.get(f"{BASE_URL}/health", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")

        if response.status_code == 200:
            print("✓ Health check passed\n")
            return True
        else:
            print("✗ Health check failed\n")
            return False
    except Exception as e:
        print(f"✗ Error: {e}\n")
        return False


def test_list_models():
    """Test the list models endpoint."""
    print("=" * 60)
    print("Testing /v1/models endpoint...")
    print("=" * 60)

    try:
        response = requests.get(f"{BASE_URL}/v1/models", headers=headers)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {data}")

        if response.status_code == 200:
            print(f"✓ Found {len(data.get('data', []))} model(s)\n")
            return True
        else:
            print("✗ List models failed\n")
            return False
    except Exception as e:
        print(f"✗ Error: {e}\n")
        return False


def test_generate_image(prompt="a cute cat", save_path="test_output.png"):
    """Test the image generation endpoint."""
    print("=" * 60)
    print("Testing /v1/images/generations endpoint...")
    print("=" * 60)
    print(f"Prompt: '{prompt}'")
    print(f"Output: {save_path}")

    try:
        response = requests.post(
            f"{BASE_URL}/v1/images/generations",
            headers=headers,
            json={
                "prompt": prompt,
                "n": 1,
                "size": "512x512",
                "num_inference_steps": 4,  # Fast for SDXL-turbo
                "guidance_scale": 0.0,      # SDXL-turbo doesn't use guidance
                "response_format": "b64_json"
            },
            timeout=120  # 2 minute timeout for generation
        )

        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"Created: {data.get('created', 'N/A')}")
            print(f"Number of images: {len(data.get('data', []))}")

            # Save the first image
            if data.get('data'):
                b64_data = data['data'][0]['b64_json']
                image_bytes = base64.b64decode(b64_data)

                output_path = Path(save_path)
                output_path.write_bytes(image_bytes)

                print(f"✓ Image saved to: {output_path}")
                print(f"✓ Image size: {len(image_bytes):,} bytes")
                print("✓ Image generation successful\n")
                return True
            else:
                print("✗ No image data in response\n")
                return False
        else:
            print(f"✗ Error: {response.text}\n")
            return False

    except requests.exceptions.Timeout:
        print("✗ Request timed out (image generation took too long)\n")
        return False
    except Exception as e:
        print(f"✗ Error: {e}\n")
        return False


def test_generate_with_url_format(prompt="a happy dog", save_path="test_output_url.png"):
    """Test image generation with URL response format."""
    print("=" * 60)
    print("Testing /v1/images/generations with URL format...")
    print("=" * 60)
    print(f"Prompt: '{prompt}'")

    try:
        response = requests.post(
            f"{BASE_URL}/v1/images/generations",
            headers=headers,
            json={
                "prompt": prompt,
                "n": 1,
                "size": "512x512",
                "num_inference_steps": 4,
                "guidance_scale": 0.0,
                "response_format": "url"  # URL format instead of base64
            },
            timeout=120
        )

        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"Number of images: {len(data.get('data', []))}")

            if data.get('data'):
                image_url = data['data'][0]['url']
                print(f"✓ Image URL: {image_url}")

                # Try to download the image
                img_response = requests.get(image_url)
                if img_response.status_code == 200:
                    output_path = Path(save_path)
                    output_path.write_bytes(img_response.content)
                    print(f"✓ Image downloaded to: {output_path}")
                    print(f"✓ Image size: {len(img_response.content):,} bytes\n")
                    return True
                else:
                    print(f"✗ Failed to download image from URL\n")
                    return False
            else:
                print("✗ No image data in response\n")
                return False
        else:
            print(f"✗ Error: {response.text}\n")
            return False

    except Exception as e:
        print(f"✗ Error: {e}\n")
        return False


def main():
    """Run all tests."""
    print("\n")
    print("╔" + "═" * 58 + "╗")
    print("║" + " " * 15 + "HyperGen Endpoint Test" + " " * 21 + "║")
    print("╚" + "═" * 58 + "╝")
    print()
    print(f"Server: {BASE_URL}")
    print(f"API Key: {'Set' if API_KEY else 'Not set'}")
    print()

    results = {
        "Health Check": test_health(),
        "List Models": test_list_models(),
        "Generate Image (base64)": test_generate_image(),
        "Generate Image (url)": test_generate_with_url_format(),
    }

    # Summary
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)

    passed = sum(results.values())
    total = len(results)

    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{test_name:.<40} {status}")

    print()
    print(f"Results: {passed}/{total} tests passed")

    if passed == total:
        print("\n✓ All tests passed!")
        return 0
    else:
        print(f"\n✗ {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        sys.exit(1)
