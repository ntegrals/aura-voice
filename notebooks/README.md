# HyperGen Notebooks

Interactive Jupyter notebooks demonstrating HyperGen's capabilities.

## Available Notebooks

### ⚡ [Minimal Example](minimal_example.ipynb)

**5-minute quickstart** - The fastest way to see HyperGen in action.

**Perfect for:**
- First-time users who want to see it work immediately
- Quick experimentation
- Understanding the basic workflow

**Time:** ~5 minutes | **GPU:** 12GB+ VRAM

---

### 📓 [LoRA Training Quickstart](train_lora_quickstart.ipynb)

**Complete end-to-end tutorial** for training a LoRA on a diffusion model.

**What you'll learn:**
- How to download datasets from HuggingFace
- Train a LoRA in just 5 lines of code
- Generate images with your trained model
- Compare base model vs LoRA-enhanced results
- Best practices for training and inference

**Time:** ~15-20 minutes | **GPU:** 12GB+ VRAM

## Running Notebooks

### Local Setup

1. Install dependencies:
```bash
pip install jupyter torch torchvision diffusers transformers accelerate peft pillow datasets tqdm
```

2. Install HyperGen:
```bash
cd ..
pip install -e .
```

3. Launch Jupyter:
```bash
jupyter notebook
```

### Google Colab

Click the "Open in Colab" badge in the README or directly open the notebook in Colab.

## Troubleshooting

**Out of memory errors:**
- Reduce `batch_size` to 1
- Reduce `resolution` to 256 or 384
- Use a smaller model like `stabilityai/sdxl-turbo`

**Slow training:**
- Ensure you're using a GPU runtime
- Check CUDA is available with `torch.cuda.is_available()`

**Dataset errors:**
- Make sure you have internet connection to download from HuggingFace
- Check that the dataset directory was created properly

## Contributing

Have an idea for a notebook? Open an issue or submit a PR!
