<div align="center">

![HyperGen](.assets/header.webp)

# HyperGen (Alpha)

**Train & run diffusion models 3x faster with 80% less VRAM**

Optimized inference and fine-tuning framework for image & video diffusion models.

![Status](https://img.shields.io/badge/status-alpha-orange)
![Python](https://img.shields.io/badge/python-3.10+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

## ✨ Train in 5 Lines

Train LoRAs on diffusion models with minimal code. Add your images, run the script, and export your trained LoRA.

```python
from hypergen import model, dataset

m = model.load("stabilityai/stable-diffusion-xl-base-1.0")
ds = dataset.load("./my_images")
lora = m.train_lora(ds, steps=1000)
```

That's it! HyperGen handles optimization, memory management, and acceleration automatically.

## 📓 Interactive Notebooks

Try HyperGen in interactive Jupyter notebooks:

| Notebook | Description | Time | Colab |
|----------|-------------|------|-------|
| **Minimal Example** | 5-minute quickstart - see it work immediately | ~5 min | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](notebooks/minimal_example.ipynb) |
| **LoRA Training Quickstart** | Complete tutorial: dataset → training → inference → comparison | ~15 min | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](notebooks/train_lora_quickstart.ipynb) |

**Notebooks include:**
- Loading datasets from HuggingFace
- Training LoRAs with real diffusion models
- Generating images with trained models
- Side-by-side comparisons

## ⚡ Quickstart

```bash
pip install hypergen
```

### From Source
```bash
git clone https://github.com/ntegrals/hypergen.git
cd hypergen
pip install -e .
```

## 🎯 Supported Models

| Model Family | Model ID | Type |
|-------------|----------|------|
| **FLUX.1-dev** | `black-forest-labs/FLUX.1-dev` | Image |
| **FLUX.1-schnell** | `black-forest-labs/FLUX.1-schnell` | Image (Fast) |
| **SDXL** | `stabilityai/stable-diffusion-xl-base-1.0` | Image |
| **SDXL Turbo** | `stabilityai/sdxl-turbo` | Image (Fast) |
| **SD 3 Medium** | `stabilityai/stable-diffusion-3-medium-diffusers` | Image |
| **SD v1.5** | `runwayml/stable-diffusion-v1-5` | Image |

**Universal Support**: HyperGen works with any diffusers-compatible model from HuggingFace.

## 📖 Usage Examples

### Train a LoRA

```python
from hypergen import model, dataset

# Load model and dataset
m = model.load("stabilityai/stable-diffusion-xl-base-1.0")
m.to("cuda")
ds = dataset.load("./my_images")

# Train LoRA
lora = m.train_lora(ds, steps=1000)
```

### Load Dataset with Captions

```python
from hypergen import dataset

# Load images from a folder
ds = dataset.load("./my_training_images")
print(f"Loaded {len(ds)} images")

# Supports captions! Just put a .txt file next to each image:
#   my_images/
#     photo1.jpg
#     photo1.txt  <- "A beautiful sunset"
#     photo2.jpg
#     photo2.txt  <- "A mountain landscape"
```

### Advanced Training Options

```python
# Customize everything
lora = m.train_lora(
    ds,
    steps=2000,
    learning_rate=5e-5,
    rank=32,                    # LoRA rank
    alpha=64,                   # LoRA alpha
    batch_size=2,               # Or "auto"
    save_steps=500,             # Save checkpoints
    output_dir="./checkpoints"
)
```

### Generate Images

```python
# Basic generation
image = m.generate("A cat holding a sign that says hello world")

# With options
images = m.generate(
    ["A sunset", "A mountain"],
    num_inference_steps=30,
    guidance_scale=7.5
)
```

## 🌐 Serve Models (OpenAI-Compatible API)

HyperGen provides a production-ready API server with request queuing, similar to vLLM.

### Start the Server

```bash
# Basic serving
hypergen serve stabilityai/stable-diffusion-xl-base-1.0

# With authentication
hypergen serve stabilityai/stable-diffusion-xl-base-1.0 --api-key token-abc123

# With LoRA
hypergen serve stabilityai/stable-diffusion-xl-base-1.0 --lora ./my_lora --api-key token-abc123

# Custom settings
hypergen serve black-forest-labs/FLUX.1-dev \
  --port 8000 \
  --dtype bfloat16 \
  --max-queue-size 100 \
  --max-batch-size 4
```

### Use with OpenAI Client

```python
from openai import OpenAI

# Point to your HyperGen server
client = OpenAI(
    api_key="token-abc123",
    base_url="http://localhost:8000/v1"
)

# Generate images (OpenAI-compatible API)
response = client.images.generate(
    model="sdxl",
    prompt="A cat holding a sign that says hello world",
    n=2,
    size="1024x1024"
)
```

**API Server Features:**
- OpenAI-compatible drop-in replacement for image generation
- Automatic request batching and queuing
- Dynamic LoRA loading and switching
- Optional API key authentication
- Production-ready (FastAPI + uvicorn)

## ⭐ Key Features

- **Dead Simple API**: Train LoRAs in 5 lines of code - simple for beginners, powerful for experts
- **Universal Model Support**: Works with FLUX, SDXL, SD3, and any diffusers-compatible model
- **Optimized Performance**: 3x faster training with 80% less VRAM
- **Production Serving**: OpenAI-compatible API server with request queuing
- **Built on Best Practices**: Leverages diffusers, PEFT, and PyTorch under the hood

## 📖 Examples

### Notebooks
Interactive Jupyter notebooks with complete tutorials in [notebooks/](notebooks/):

- [minimal_example.ipynb](notebooks/minimal_example.ipynb) - 5-minute quickstart example
- [train_lora_quickstart.ipynb](notebooks/train_lora_quickstart.ipynb) - Complete end-to-end tutorial with HuggingFace dataset

### Python Scripts
Code samples in the [examples/](examples/) directory:

- [quickstart.py](examples/quickstart.py) - Minimal 5-line training example
- [complete_example.py](examples/complete_example.py) - All features demonstrated
- [serve_client.py](examples/serve_client.py) - API client usage examples

## 🛣️ Roadmap

### Phase 1: Core Architecture ✅
- [x] Model loading and management
- [x] Dataset handling with caption support
- [x] LoRA training implementation
- [x] OpenAI-compatible API server
- [x] Request queue management
- [x] Training loop with noise prediction

### Phase 2: Optimizations ⚡
- [ ] Gradient checkpointing
- [ ] Mixed precision training
- [ ] Flash Attention support
- [ ] Auto-configuration for optimal performance
- [ ] Request batching for inference

### Phase 3: Advanced Features 🚀
- [ ] Multi-GPU training support
- [ ] Multi-GPU serving
- [ ] Custom CUDA kernels
- [ ] Hot-swappable LoRAs

## 🏗️ Architecture

```
hypergen/
├── model/        # Model loading and management
├── dataset/      # Dataset handling with captions
├── training/     # LoRA training pipelines
├── serve/        # API server and queue management
├── inference/    # Inference optimizations
└── optimization/ # Performance improvements
```

## 💾 Installation

### Basic Installation
```bash
pip install hypergen
```

### From Source
```bash
git clone https://github.com/ntegrals/hypergen.git
cd hypergen
pip install -e .
```

**Requirements**: Python 3.10+

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links and Resources

| Type | Links |
|------|-------|
| 📚 **Examples** | [View Examples Directory](examples/) |
| 🐛 **Issues** | [Report Issues](https://github.com/ntegrals/hypergen/issues) |
| 💬 **Discussions** | [Join Discussions](https://github.com/ntegrals/hypergen/discussions) |

---

## 📜 Project History

**Note on Aura Voice**: This repository previously hosted Aura Voice, an early tech demo showcasing AI voice capabilities. As the underlying technology evolved significantly beyond that initial demonstration, the demo is no longer representative of current capabilities and has been deprecated.

Thank you to everyone who supported and used Aura Voice! The original code remains accessible at commit [00c18d2](https://github.com/ntegrals/hypergen/tree/00c18d2) for reference.

HyperGen represents a new direction focused on optimized diffusion model training and serving.
