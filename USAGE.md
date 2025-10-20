# HyperGen Usage Guide

## Installation

```bash
pip install -e .
```

## Training LoRAs

### Basic Usage

```python
from hypergen import model, dataset

# Load model
m = model.load("stabilityai/stable-diffusion-xl-base-1.0")
m.to("cuda")

# Load dataset
ds = dataset.load("./my_images")

# Train
lora = m.train_lora(ds, steps=1000)
```

### Advanced Usage

```python
lora = m.train_lora(
    ds,
    steps=2000,
    learning_rate=5e-5,
    rank=32,
    alpha=64,
    batch_size=2,
    save_steps=500,
    output_dir="./lora_output"
)
```

## Serving Models

### Start Server

```bash
# Basic
hypergen serve stabilityai/stable-diffusion-xl-base-1.0

# With authentication and LoRA
hypergen serve stabilityai/stable-diffusion-xl-base-1.0 \
  --api-key token-abc123 \
  --lora ./my_lora \
  --port 8000 \
  --dtype bfloat16 \
  --max-batch-size 4
```

### Server Options

| Option | Default | Description |
|--------|---------|-------------|
| `--host` | `0.0.0.0` | Host to bind to |
| `--port` | `8000` | Port to bind to |
| `--api-key` | None | API key for authentication |
| `--dtype` | `float16` | Model data type |
| `--device` | `cuda` | Device (cuda/cpu/mps) |
| `--lora` | None | Path to LoRA weights |
| `--max-queue-size` | `100` | Max requests in queue |
| `--max-batch-size` | `1` | Max batch size |
| `--reload` | False | Auto-reload (dev only) |

### Use API

#### With OpenAI Client

```python
from openai import OpenAI

client = OpenAI(
    api_key="token-abc123",
    base_url="http://localhost:8000/v1"
)

response = client.images.generate(
    model="sdxl",
    prompt="A cat holding a sign",
    n=2,
    size="1024x1024"
)
```

#### With Requests

```python
import requests

response = requests.post(
    "http://localhost:8000/v1/images/generations",
    json={
        "prompt": "A mountain landscape",
        "n": 1,
        "size": "1024x1024",
        "response_format": "b64_json",
        "num_inference_steps": 30,
        "guidance_scale": 7.5,
        "seed": 42
    },
    headers={"Authorization": "Bearer token-abc123"}
)
```

## API Endpoints

### Health Check

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "model": "stabilityai/stable-diffusion-xl-base-1.0",
  "queue_size": 0,
  "device": "cuda"
}
```

### List Models

```bash
curl -H "Authorization: Bearer token-abc123" \
  http://localhost:8000/v1/models
```

### Generate Images

```bash
curl -X POST http://localhost:8000/v1/images/generations \
  -H "Authorization: Bearer token-abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cat holding a sign that says hello world",
    "n": 1,
    "size": "1024x1024",
    "response_format": "b64_json"
  }'
```

## Request Parameters

### Standard (OpenAI-Compatible)

- `prompt` (string, required): Text prompt
- `model` (string, optional): Model identifier
- `n` (int, default: 1): Number of images (1-10)
- `size` (string, default: "1024x1024"): Image size
- `quality` (string, default: "standard"): Quality level
- `response_format` (string, default: "url"): "url" or "b64_json"

### HyperGen Extensions

- `negative_prompt` (string, optional): Negative prompt
- `num_inference_steps` (int, default: 50): Inference steps (1-150)
- `guidance_scale` (float, default: 7.5): Guidance scale (1.0-20.0)
- `seed` (int, optional): Random seed for reproducibility
- `lora_path` (string, optional): Path to LoRA weights
- `lora_scale` (float, default: 1.0): LoRA scaling (0.0-2.0)

## Examples

See the [examples/](examples/) directory:

- **quickstart.py** - Minimal training example
- **complete_example.py** - All training features
- **serve_client.py** - API client examples

## Troubleshooting

### Server won't start

Check that:
1. Port is not already in use: `lsof -i :8000`
2. Model can be loaded: Test with Python first
3. CUDA is available: `torch.cuda.is_available()`

### Out of memory

Try:
- Reduce `max_batch_size`
- Use `--dtype float16` or `bfloat16`
- Reduce image size in requests

### Authentication errors

Make sure you're passing the API key:
- Header: `Authorization: Bearer <your-key>`
- OpenAI client: `api_key="<your-key>"`
