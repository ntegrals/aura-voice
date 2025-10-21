# HyperGen Installation Guide

## Quick Install

### From PyPI (Recommended)

```bash
pip install hypergen
```

This installs both the Python library and the `hypergen` CLI command.

### From Source

```bash
git clone https://github.com/ntegrals/hypergen.git
cd hypergen
pip install -e .
```

## Verify Installation

After installation, verify everything works:

```bash
# Check CLI is available
hypergen --version
hypergen --help

# Test Python import
python -c "from hypergen import model, dataset; print('✓ HyperGen installed successfully')"
```

## CLI Commands

### Serve Command

Start an OpenAI-compatible API server:

```bash
# Basic usage
hypergen serve stabilityai/stable-diffusion-xl-base-1.0

# With options
hypergen serve stabilityai/sdxl-turbo \
  --port 8000 \
  --api-key your-secret-key \
  --dtype float16
```

**All options:**
```bash
hypergen serve --help
```

## For Developers

### Building from Source

```bash
# Install build tools
pip install build twine hatchling

# Build the package
python -m build

# Install locally
pip install dist/*.whl

# Or install in editable mode
pip install -e .
```

### Publishing to PyPI

```bash
# Build
python -m build

# Upload to PyPI
python -m twine upload dist/*
```

## Troubleshooting

### CLI Command Not Found

If `hypergen` command is not found after installation:

1. **Check Python scripts directory is in PATH:**
   ```bash
   python -m site --user-base
   ```
   Add `<site-base>/bin` to your PATH.

2. **Reinstall:**
   ```bash
   pip install --force-reinstall hypergen
   ```

3. **For editable installs:**
   ```bash
   # Make sure you're in the project root
   cd hypergen
   pip install -e .
   ```

4. **Verify entry point:**
   ```bash
   python -m hypergen.cli.main --help
   ```

### Import Errors

If you get import errors:

```bash
# Make sure you're not in the source directory
cd ~

# Try importing
python -c "from hypergen import model"
```

### Dependencies Issues

Install all dependencies manually:

```bash
pip install torch diffusers transformers peft accelerate \
  fastapi uvicorn pillow numpy safetensors
```

## Requirements

- Python 3.10 or higher
- CUDA-capable GPU (for training/inference)
- 12GB+ VRAM recommended for training

## Optional Dependencies

### Flash Attention
```bash
pip install hypergen[flash]
```

### xFormers
```bash
pip install hypergen[xformers]
```

### DeepSpeed
```bash
pip install hypergen[deepspeed]
```

### All Optional Dependencies
```bash
pip install hypergen[all]
```

## Getting Help

- [GitHub Issues](https://github.com/ntegrals/hypergen/issues)
- [Documentation](https://github.com/ntegrals/hypergen)
- [Examples](examples/)
