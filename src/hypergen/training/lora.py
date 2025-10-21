"""LoRA training implementation."""

from __future__ import annotations
from typing import TYPE_CHECKING, Any, Optional

if TYPE_CHECKING:
    from hypergen.model.base import Model
    from hypergen.dataset.base import Dataset


class LoRATrainer:
    """
    Trainer for LoRA (Low-Rank Adaptation) fine-tuning.

    Example:
        >>> from hypergen import model, dataset
        >>> from hypergen.training import LoRATrainer
        >>> m = model.load("stabilityai/stable-diffusion-xl-base-1.0")
        >>> ds = dataset.load("./my_images")
        >>> trainer = LoRATrainer(m)
        >>> lora_weights = trainer.train(ds, steps=1000)
    """

    def __init__(
        self,
        model: Model,
        rank: int = 16,
        alpha: int = 32,
        target_modules: Optional[list[str]] = None,
        dropout: float = 0.1,
    ):
        """
        Initialize LoRA trainer.

        Args:
            model: Model to train
            rank: LoRA rank (lower = fewer parameters, faster training)
            alpha: LoRA alpha parameter (scaling factor)
            target_modules: Which modules to apply LoRA to (None = auto-detect)
            dropout: Dropout probability for LoRA layers
        """
        self.model = model
        self.rank = rank
        self.alpha = alpha
        self.target_modules = target_modules
        self.dropout = dropout
        self._lora_config = None
        self._peft_model = None

    def _create_lora_config(self) -> Any:
        """Create PEFT LoRA configuration."""
        from peft import LoraConfig

        # Auto-detect target modules if not specified
        if self.target_modules is None:
            # Default targets for UNet attention layers
            self.target_modules = ["to_q", "to_k", "to_v", "to_out.0"]

        # Note: We don't specify task_type for diffusion models (UNet)
        # PEFT will handle it correctly without task_type
        config = LoraConfig(
            r=self.rank,
            lora_alpha=self.alpha,
            target_modules=self.target_modules,
            lora_dropout=self.dropout,
            bias="none",
        )

        return config

    def _prepare_model(self) -> None:
        """Prepare model for LoRA training."""
        from peft import get_peft_model

        # Get the UNet from the pipeline
        unet = self.model.pipeline.unet

        # Create LoRA config if not already done
        if self._lora_config is None:
            self._lora_config = self._create_lora_config()

        # Wrap UNet with PEFT
        self._peft_model = get_peft_model(unet, self._lora_config)

        # Print trainable parameters
        trainable_params = sum(
            p.numel() for p in self._peft_model.parameters() if p.requires_grad
        )
        total_params = sum(p.numel() for p in self._peft_model.parameters())
        print(
            f"LoRA trainable parameters: {trainable_params:,} / {total_params:,} "
            f"({100 * trainable_params / total_params:.2f}%)"
        )

    def train(
        self,
        dataset: Dataset,
        steps: int = 1000,
        learning_rate: float | str = 1e-4,
        batch_size: int | str = 1,
        gradient_accumulation_steps: int = 1,
        save_steps: Optional[int] = None,
        output_dir: Optional[str] = None,
        resolution: int = 512,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """
        Train LoRA on the provided dataset.

        Args:
            dataset: Dataset to train on
            steps: Number of training steps
            learning_rate: Learning rate or "auto" for automatic scheduling
            batch_size: Batch size or "auto" for automatic sizing
            gradient_accumulation_steps: Number of steps to accumulate gradients
            save_steps: Save checkpoint every N steps (None = only save at end)
            output_dir: Directory to save checkpoints (None = no saving)
            resolution: Image resolution for training (default: 512)
            **kwargs: Additional training arguments

        Returns:
            Dictionary containing trained LoRA weights

        Example:
            >>> trainer = LoRATrainer(model)
            >>> lora_weights = trainer.train(dataset, steps=1000, learning_rate=1e-4)
        """
        import torch
        from tqdm import tqdm
        from torchvision import transforms

        # Prepare model for training
        self._prepare_model()

        # Handle "auto" configurations
        if learning_rate == "auto":
            learning_rate = 1e-4  # TODO: Implement auto learning rate
        if batch_size == "auto":
            batch_size = 1  # TODO: Implement auto batch size

        # Setup optimizer
        optimizer = torch.optim.AdamW(
            self._peft_model.parameters(),
            lr=learning_rate,
            betas=(0.9, 0.999),
            weight_decay=0.01,
            eps=1e-8,
        )

        # Get components from pipeline
        vae = self.model.pipeline.vae
        noise_scheduler = self.model.pipeline.scheduler
        tokenizer = getattr(self.model.pipeline, "tokenizer", None)
        text_encoder = getattr(self.model.pipeline, "text_encoder", None)

        # Freeze VAE and text encoder
        vae.requires_grad_(False)
        if text_encoder is not None:
            text_encoder.requires_grad_(False)

        # Move to device
        device = self._peft_model.device
        vae = vae.to(device)
        if text_encoder is not None:
            text_encoder = text_encoder.to(device)

        # Image preprocessing
        image_transforms = transforms.Compose([
            transforms.Resize(resolution, interpolation=transforms.InterpolationMode.BILINEAR),
            transforms.CenterCrop(resolution),
            transforms.ToTensor(),
            transforms.Normalize([0.5], [0.5]),
        ])

        # Training loop
        self._peft_model.train()
        vae.eval()
        if text_encoder is not None:
            text_encoder.eval()

        global_step = 0
        accumulated_loss = 0.0

        print(f"\nStarting LoRA training:")
        print(f"  Total steps: {steps}")
        print(f"  Learning rate: {learning_rate}")
        print(f"  Batch size: {batch_size}")
        print(f"  Gradient accumulation: {gradient_accumulation_steps}")
        print(f"  Resolution: {resolution}x{resolution}")
        print()

        progress_bar = tqdm(total=steps, desc="Training")

        try:
            while global_step < steps:
                for batch in dataset.batch(batch_size):
                    # Extract images and captions from batch
                    images = []
                    captions = []

                    for img, caption in batch:
                        # Convert to RGB if needed
                        if img.mode != "RGB":
                            img = img.convert("RGB")
                        images.append(image_transforms(img))
                        captions.append(caption if caption else "")

                    # Stack images into batch
                    pixel_values = torch.stack(images).to(device)

                    # Encode images to latent space
                    with torch.no_grad():
                        latents = vae.encode(pixel_values).latent_dist.sample()
                        latents = latents * vae.config.scaling_factor

                    # Sample noise
                    noise = torch.randn_like(latents)
                    bsz = latents.shape[0]

                    # Sample random timestep for each image
                    timesteps = torch.randint(
                        0, noise_scheduler.config.num_train_timesteps, (bsz,),
                        device=device
                    ).long()

                    # Add noise to latents according to noise scheduler
                    noisy_latents = noise_scheduler.add_noise(latents, noise, timesteps)

                    # Encode text prompts if available
                    encoder_hidden_states = None
                    if text_encoder is not None and tokenizer is not None:
                        text_inputs = tokenizer(
                            captions,
                            padding="max_length",
                            max_length=tokenizer.model_max_length,
                            truncation=True,
                            return_tensors="pt",
                        )
                        with torch.no_grad():
                            encoder_hidden_states = text_encoder(
                                text_inputs.input_ids.to(device)
                            )[0]

                    # Predict noise with UNet
                    model_pred = self._peft_model(
                        noisy_latents,
                        timesteps,
                        encoder_hidden_states,
                    ).sample

                    # Calculate loss (simple MSE between predicted and actual noise)
                    loss = torch.nn.functional.mse_loss(model_pred.float(), noise.float(), reduction="mean")

                    # Backward pass
                    loss.backward()
                    accumulated_loss += loss.item()

                    # Optimizer step (with gradient accumulation)
                    if (global_step + 1) % gradient_accumulation_steps == 0:
                        optimizer.step()
                        optimizer.zero_grad()

                    global_step += 1

                    # Update progress bar with loss
                    avg_loss = accumulated_loss / global_step
                    progress_bar.set_postfix({"loss": f"{avg_loss:.4f}"})
                    progress_bar.update(1)

                    if global_step >= steps:
                        break

                    # Save checkpoint if requested
                    if save_steps and global_step % save_steps == 0:
                        if output_dir:
                            self._save_checkpoint(output_dir, global_step)

        finally:
            progress_bar.close()

        print(f"\nTraining complete! Final average loss: {accumulated_loss / global_step:.4f}")

        # Extract and return LoRA weights
        lora_state_dict = self._peft_model.get_peft_model_state_dict()

        # Save final checkpoint if output_dir specified
        if output_dir:
            self._save_checkpoint(output_dir, global_step)

        return lora_state_dict

    def _save_checkpoint(self, output_dir: str, step: int) -> None:
        """Save LoRA checkpoint."""
        from pathlib import Path

        output_path = Path(output_dir) / f"checkpoint-{step}"
        output_path.mkdir(parents=True, exist_ok=True)

        # Save LoRA weights
        self._peft_model.save_pretrained(str(output_path))

        print(f"Saved checkpoint to {output_path}")


def train_lora(
    model: Model,
    dataset: Dataset,
    **kwargs: Any,
) -> dict[str, Any]:
    """
    Convenience function to train LoRA.

    Args:
        model: Model to train
        dataset: Dataset to train on
        **kwargs: Additional arguments passed to LoRATrainer.train()

    Returns:
        Dictionary containing trained LoRA weights

    Example:
        >>> from hypergen import model, dataset
        >>> from hypergen.training import train_lora
        >>> m = model.load("stabilityai/sdxl-turbo")
        >>> ds = dataset.load("./images")
        >>> lora = train_lora(m, ds, steps=500)
    """
    trainer = LoRATrainer(model)
    return trainer.train(dataset, **kwargs)
