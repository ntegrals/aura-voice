"""
Complete HyperGen Example - All Features
"""

from hypergen import model, dataset

# ==============================================================================
# Example 1: Basic LoRA Training
# ==============================================================================

print("=" * 80)
print("Example 1: Basic LoRA Training")
print("=" * 80)

# Load model
m = model.load("stabilityai/stable-diffusion-xl-base-1.0")
m.to("cuda")

# Load dataset (images + optional captions)
# Directory structure:
#   my_images/
#     image1.jpg
#     image1.txt  (optional caption)
#     image2.jpg
#     image2.txt  (optional caption)
#     ...
ds = dataset.load("./my_images")
print(f"Loaded {len(ds)} images")

# Train LoRA with defaults
lora = m.train_lora(ds, steps=1000)
print("Training complete!")


# ==============================================================================
# Example 2: Advanced LoRA Training with Custom Settings
# ==============================================================================

print("\n" + "=" * 80)
print("Example 2: Advanced LoRA Training")
print("=" * 80)

# Load a different model
m = model.load("black-forest-labs/FLUX.1-dev", torch_dtype="bfloat16")
m.to("cuda")

# Load dataset
ds = dataset.load("./photos")

# Train with custom settings
lora = m.train_lora(
    ds,
    steps=2000,
    learning_rate=5e-5,
    rank=32,              # Higher rank = more capacity
    alpha=64,             # Scaling factor
    batch_size=2,         # Process 2 images at once
    gradient_accumulation_steps=4,  # Effective batch size = 2 * 4 = 8
    save_steps=500,       # Save checkpoint every 500 steps
    output_dir="./lora_checkpoints"
)


# ==============================================================================
# Example 3: Auto Configuration (Let HyperGen decide)
# ==============================================================================

print("\n" + "=" * 80)
print("Example 3: Auto Configuration")
print("=" * 80)

m = model.load("runwayml/stable-diffusion-v1-5")
m.to("cuda")

ds = dataset.load("./dataset")

# Use "auto" for automatic optimization
lora = m.train_lora(
    ds,
    steps=1000,
    learning_rate="auto",  # Auto learning rate
    batch_size="auto",     # Auto batch size based on VRAM
)


# ==============================================================================
# Example 4: Dataset Features
# ==============================================================================

print("\n" + "=" * 80)
print("Example 4: Dataset Iteration and Batching")
print("=" * 80)

ds = dataset.load("./images")

# Iterate over individual items
for i, (image, caption) in enumerate(ds):
    print(f"Image {i}: size={image.size}, caption={caption}")
    if i >= 2:  # Just show first 3
        break

# Iterate in batches
print(f"\nProcessing dataset in batches...")
for batch_idx, batch in enumerate(ds.batch(batch_size=4)):
    print(f"Batch {batch_idx}: {len(batch)} images")
    if batch_idx >= 2:  # Just show first 3 batches
        break


# ==============================================================================
# Example 5: Different Model Types
# ==============================================================================

print("\n" + "=" * 80)
print("Example 5: Different Model Types")
print("=" * 80)

# SDXL
m_sdxl = model.load("stabilityai/stable-diffusion-xl-base-1.0")

# FLUX.1
m_flux = model.load("black-forest-labs/FLUX.1-dev")

# Stable Diffusion 3
m_sd3 = model.load("stabilityai/stable-diffusion-3-medium-diffusers")

# Video model (CogVideoX)
m_video = model.load("THUDM/CogVideoX-5b")

# They all have the same interface!
# ds = dataset.load("./data")
# lora = m_sdxl.train_lora(ds, steps=1000)
# lora = m_flux.train_lora(ds, steps=1000)
# etc.


# ==============================================================================
# Example 6: Using LoRATrainer Directly (Advanced)
# ==============================================================================

print("\n" + "=" * 80)
print("Example 6: Direct LoRATrainer Usage")
print("=" * 80)

from hypergen.training import LoRATrainer

m = model.load("stabilityai/sdxl-turbo")
m.to("cuda")

ds = dataset.load("./images")

# Create trainer with custom configuration
trainer = LoRATrainer(
    m,
    rank=16,
    alpha=32,
    target_modules=["to_q", "to_k", "to_v", "to_out.0"],  # Customize targets
    dropout=0.1,
)

# Train
lora = trainer.train(
    ds,
    steps=1000,
    learning_rate=1e-4,
)

print("\nAll examples complete!")
