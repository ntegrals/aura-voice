"""Base model class for diffusion models."""

from __future__ import annotations
from typing import TYPE_CHECKING, Any, Optional

if TYPE_CHECKING:
    from diffusers import DiffusionPipeline


class Model:
    """
    Wrapper around diffusion models with automatic optimization.

    Example:
        >>> from hypergen import model
        >>> m = model.load("stabilityai/stable-diffusion-xl-base-1.0")
        >>> m.to("cuda")
        >>> image = m.generate("A cat holding a sign")
    """

    def __init__(self, pipeline: DiffusionPipeline):
        """
        Initialize model with a diffusers pipeline.

        Args:
            pipeline: A HuggingFace diffusers pipeline
        """
        self.pipeline = pipeline
        self._device: Optional[str] = None

    @classmethod
    def load(
        cls,
        model_id: str,
        torch_dtype: Optional[str] = "float16",
        **kwargs: Any
    ) -> Model:
        """
        Load a diffusion model from HuggingFace or local path.

        Args:
            model_id: HuggingFace model ID (e.g. "stabilityai/stable-diffusion-xl-base-1.0")
                     or local path to model
            torch_dtype: Data type for model weights. Options: "float16", "bfloat16", "float32"
            **kwargs: Additional arguments passed to DiffusionPipeline.from_pretrained()

        Returns:
            Model instance with the loaded pipeline

        Example:
            >>> from hypergen import model
            >>> m = model.load("stabilityai/stable-diffusion-xl-base-1.0")
        """
        # Lazy import to avoid loading heavy dependencies on import
        from diffusers import DiffusionPipeline
        import torch

        # Map string dtype to torch dtype
        dtype_map = {
            "float16": torch.float16,
            "bfloat16": torch.bfloat16,
            "float32": torch.float32,
            "fp16": torch.float16,
            "bf16": torch.bfloat16,
            "fp32": torch.float32,
        }

        if torch_dtype is not None:
            torch_dtype = dtype_map.get(torch_dtype, torch.float16)

        # Load the pipeline with optimizations
        # Use 'dtype' for newer diffusers, fallback to 'torch_dtype' for compatibility
        try:
            pipeline = DiffusionPipeline.from_pretrained(
                model_id,
                dtype=torch_dtype,
                use_safetensors=True,
                **kwargs
            )
        except TypeError:
            # Fallback for older diffusers versions
            pipeline = DiffusionPipeline.from_pretrained(
                model_id,
                torch_dtype=torch_dtype,
                use_safetensors=True,
                **kwargs
            )

        return cls(pipeline)

    def to(self, device: str) -> Model:
        """
        Move model to specified device.

        Args:
            device: Device to move model to (e.g. "cuda", "cpu", "mps")

        Returns:
            Self for method chaining

        Example:
            >>> m = model.load("stabilityai/sdxl-turbo").to("cuda")
        """
        self.pipeline = self.pipeline.to(device)
        self._device = device
        return self

    def generate(
        self,
        prompt: str | list[str],
        **kwargs: Any
    ) -> Any:
        """
        Generate images from text prompt(s).

        Args:
            prompt: Text prompt or list of prompts
            **kwargs: Additional arguments passed to the pipeline

        Returns:
            Generated image(s)

        Example:
            >>> m = model.load("stabilityai/sdxl-turbo").to("cuda")
            >>> image = m.generate("A cat holding a sign")
        """
        result = self.pipeline(prompt, **kwargs)
        return result.images if hasattr(result, 'images') else result

    def train_lora(
        self,
        dataset: Any,
        steps: int = 1000,
        learning_rate: float | str = 1e-4,
        rank: int = 16,
        alpha: int = 32,
        **kwargs: Any
    ) -> Any:
        """
        Train a LoRA adapter on the provided dataset.

        This is the simple, high-level interface for LoRA training.
        Just pass a dataset and it handles everything automatically.

        Args:
            dataset: Dataset to train on (from dataset.load())
            steps: Number of training steps
            learning_rate: Learning rate or "auto" for automatic
            rank: LoRA rank (lower = fewer parameters)
            alpha: LoRA alpha scaling factor
            **kwargs: Additional training arguments (batch_size, output_dir, etc.)

        Returns:
            Trained LoRA weights

        Example:
            >>> from hypergen import model, dataset
            >>> m = model.load("stabilityai/stable-diffusion-xl-base-1.0")
            >>> m.to("cuda")
            >>> ds = dataset.load("./my_images")
            >>> lora = m.train_lora(ds, steps=1000)
        """
        from hypergen.training import LoRATrainer

        trainer = LoRATrainer(
            self,
            rank=rank,
            alpha=alpha,
        )

        return trainer.train(
            dataset,
            steps=steps,
            learning_rate=learning_rate,
            **kwargs
        )


# Create singleton-style module-level function
def load(model_id: str, **kwargs: Any) -> Model:
    """
    Load a diffusion model from HuggingFace or local path.

    This is a convenience function that creates a Model instance.

    Args:
        model_id: HuggingFace model ID or local path
        **kwargs: Additional arguments passed to Model.load()

    Returns:
        Model instance

    Example:
        >>> from hypergen import model
        >>> m = model.load("stabilityai/stable-diffusion-xl-base-1.0")
        >>> m.to("cuda")
        >>> image = m.generate("A cat")
    """
    return Model.load(model_id, **kwargs)


# Module-level interface
model = type('model', (), {
    'load': staticmethod(load),
})()
