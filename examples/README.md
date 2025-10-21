# HyperGen Examples

Example scripts demonstrating HyperGen's features.

## Quick Start Examples

### [quickstart.py](quickstart.py)

**Minimal 5-line example** for training a LoRA.

```bash
python examples/quickstart.py
```

**What it does:**
- Loads SDXL model
- Loads a local dataset
- Trains a LoRA in 1000 steps
- Generates a test image

---

### [complete_example.py](complete_example.py)

**Comprehensive example** showing all HyperGen features.

```bash
python examples/complete_example.py
```

**What it covers:**
- Loading different models (SDXL, SD3, FLUX)
- Dataset preparation with captions
- Advanced training options
- Image generation
- Saving and loading checkpoints

---

## API Server Examples

### Starting the Server

Start a HyperGen API server:

```bash
# Basic server
hypergen serve stabilityai/sdxl-turbo

# With options
hypergen serve stabilityai/stable-diffusion-xl-base-1.0 \
  --port 8000 \
  --api-key your-secret-key \
  --lora ./my_lora
```

---

### [serve_client.py](serve_client.py)

**OpenAI-compatible client** for the HyperGen API.

```bash
# Start server first
hypergen serve stabilityai/sdxl-turbo --port 8000

# Then run client
python examples/serve_client.py
```

**What it demonstrates:**
- Using OpenAI Python client with HyperGen
- Generating images via API
- Handling responses
- Error handling

---

### [test_endpoint.py](test_endpoint.py)

**Comprehensive endpoint testing** script.

```bash
# Start server first
hypergen serve stabilityai/sdxl-turbo --port 8000

# Run tests
python examples/test_endpoint.py
```

**What it tests:**
- ✓ Health check endpoint (`/health`)
- ✓ Model listing endpoint (`/v1/models`)
- ✓ Image generation with base64 response
- ✓ Image generation with URL response
- ✓ Error handling
- ✓ Timeout handling

**Features:**
- Automatic image saving
- Pretty-printed test results
- Summary report
- Exit codes for CI/CD integration

---

## Dataset Examples

### Local Dataset with Captions

Create a dataset directory:

```
my_dataset/
├── image1.jpg
├── image1.txt    # "a beautiful sunset"
├── image2.jpg
├── image2.txt    # "a mountain landscape"
└── ...
```

Load and use:

```python
from hypergen import dataset

ds = dataset.load("./my_dataset")
print(f"Loaded {len(ds)} images with captions")
```

---

### HuggingFace Dataset

See the [Jupyter notebooks](../notebooks/) for examples using HuggingFace datasets:
- [minimal_example.ipynb](../notebooks/minimal_example.ipynb)
- [train_lora_quickstart.ipynb](../notebooks/train_lora_quickstart.ipynb)

---

## Advanced Usage

### Custom Training Configuration

```python
from hypergen import model, dataset

m = model.load("stabilityai/stable-diffusion-xl-base-1.0")
m.to("cuda")
ds = dataset.load("./my_images")

lora = m.train_lora(
    ds,
    steps=2000,
    learning_rate=5e-5,
    rank=32,
    alpha=64,
    batch_size=2,
    gradient_accumulation_steps=4,
    save_steps=500,
    output_dir="./checkpoints",
    resolution=1024,  # Train at higher resolution
)
```

### Loading a Trained LoRA

```python
from peft import PeftModel

# Load base model
m = model.load("stabilityai/stable-diffusion-xl-base-1.0")
m.to("cuda")

# Load LoRA weights
checkpoint_path = "./checkpoints/checkpoint-2000"
m.pipeline.unet = PeftModel.from_pretrained(
    m.pipeline.unet,
    checkpoint_path
)

# Generate with LoRA
image = m.generate("your prompt here")
```

---

## Testing Tips

### Quick Server Test

```bash
# Terminal 1: Start server
hypergen serve stabilityai/sdxl-turbo

# Terminal 2: Test with curl
curl http://localhost:8000/health
```

### Performance Testing

```bash
# Install Apache Bench
brew install httpd  # macOS
sudo apt-get install apache2-utils  # Linux

# Run load test
ab -n 100 -c 10 http://localhost:8000/health
```

---

## Common Issues

### Out of Memory

**Solution:** Reduce batch size or resolution
```python
lora = m.train_lora(
    ds,
    batch_size=1,        # Reduce from 2 to 1
    resolution=512,      # Reduce from 1024 to 512
)
```

### Slow Training

**Solutions:**
- Use a turbo model: `stabilityai/sdxl-turbo`
- Reduce training steps
- Enable mixed precision (coming in Phase 2)

### Server Port Already in Use

**Solution:** Use a different port
```bash
hypergen serve model-name --port 8001
```

---

## Contributing

Have a great example? Submit a PR!

**Guidelines:**
- Include a docstring explaining what it does
- Keep it simple and focused
- Add comments for complex parts
- Test before submitting
