"""
HyperGen Quickstart - Train a LoRA in 5 lines
"""

from hypergen import model, dataset

# 1. Load model
m = model.load("stabilityai/stable-diffusion-xl-base-1.0")
m.to("cuda")

# 2. Load dataset
ds = dataset.load("./my_training_images")

# 3. Train LoRA - that's it!
lora = m.train_lora(ds, steps=1000)

# 4. Use the trained LoRA
image = m.generate(
    "A photo in my style",
    # LoRA usage will be implemented in phase 2
)
