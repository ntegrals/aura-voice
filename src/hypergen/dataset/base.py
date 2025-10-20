"""Base dataset class for loading and managing training data."""

from __future__ import annotations
from pathlib import Path
from typing import Any, Iterator, Optional

from PIL import Image


class Dataset:
    """
    Dataset wrapper for images and videos.

    Example:
        >>> from hypergen import dataset
        >>> ds = dataset.load("./my_images")
        >>> print(len(ds))
        100
    """

    def __init__(self, image_paths: list[Path], captions: Optional[list[str]] = None):
        """
        Initialize dataset with image paths.

        Args:
            image_paths: List of paths to image files
            captions: Optional list of captions corresponding to images
        """
        self.image_paths = image_paths
        self.captions = captions or [None] * len(image_paths)

        if len(self.image_paths) != len(self.captions):
            raise ValueError(
                f"Number of images ({len(self.image_paths)}) must match "
                f"number of captions ({len(self.captions)})"
            )

    @classmethod
    def load(
        cls,
        path: str | Path,
        extensions: Optional[list[str]] = None,
        **kwargs: Any
    ) -> Dataset:
        """
        Load dataset from a folder of images.

        Args:
            path: Path to folder containing images
            extensions: List of file extensions to include (default: common image formats)
            **kwargs: Additional arguments (reserved for future use)

        Returns:
            Dataset instance

        Example:
            >>> from hypergen import dataset
            >>> ds = dataset.load("./training_images")
            >>> print(f"Loaded {len(ds)} images")
        """
        path = Path(path)

        if not path.exists():
            raise FileNotFoundError(f"Dataset path does not exist: {path}")

        if not path.is_dir():
            raise ValueError(f"Dataset path must be a directory: {path}")

        # Default image extensions
        if extensions is None:
            extensions = [".jpg", ".jpeg", ".png", ".webp", ".bmp"]

        # Find all images
        image_paths = []
        for ext in extensions:
            # Case-insensitive matching
            image_paths.extend(path.glob(f"*{ext}"))
            image_paths.extend(path.glob(f"*{ext.upper()}"))

        # Sort for consistent ordering
        image_paths = sorted(set(image_paths))

        if len(image_paths) == 0:
            raise ValueError(
                f"No images found in {path} with extensions {extensions}"
            )

        # Look for caption files
        captions = cls._load_captions(path, image_paths)

        return cls(image_paths, captions)

    @staticmethod
    def _load_captions(
        base_path: Path,
        image_paths: list[Path]
    ) -> Optional[list[str]]:
        """
        Load captions from text files matching image names.

        For each image (e.g., "cat.jpg"), looks for "cat.txt" with caption.

        Args:
            base_path: Base directory path
            image_paths: List of image paths

        Returns:
            List of captions or None if no caption files found
        """
        captions = []
        found_any = False

        for img_path in image_paths:
            caption_path = img_path.with_suffix(".txt")
            if caption_path.exists():
                with open(caption_path, "r", encoding="utf-8") as f:
                    captions.append(f.read().strip())
                found_any = True
            else:
                captions.append(None)

        return captions if found_any else None

    def __len__(self) -> int:
        """Return number of items in dataset."""
        return len(self.image_paths)

    def __getitem__(self, idx: int) -> tuple[Image.Image, Optional[str]]:
        """
        Get image and caption at index.

        Args:
            idx: Index of item to retrieve

        Returns:
            Tuple of (image, caption)
        """
        image = Image.open(self.image_paths[idx])
        caption = self.captions[idx]
        return image, caption

    def __iter__(self) -> Iterator[tuple[Image.Image, Optional[str]]]:
        """Iterate over dataset items."""
        for i in range(len(self)):
            yield self[i]

    def batch(self, batch_size: int) -> Iterator[list[tuple[Image.Image, Optional[str]]]]:
        """
        Iterate over dataset in batches.

        Args:
            batch_size: Number of items per batch

        Yields:
            Batches of (image, caption) tuples

        Example:
            >>> ds = dataset.load("./images")
            >>> for batch in ds.batch(32):
            ...     # Process batch
            ...     pass
        """
        batch = []
        for item in self:
            batch.append(item)
            if len(batch) == batch_size:
                yield batch
                batch = []

        # Yield remaining items
        if batch:
            yield batch


# Create module-level interface
def load(path: str | Path, **kwargs: Any) -> Dataset:
    """
    Load dataset from a folder of images.

    This is a convenience function that creates a Dataset instance.

    Args:
        path: Path to folder containing images
        **kwargs: Additional arguments passed to Dataset.load()

    Returns:
        Dataset instance

    Example:
        >>> from hypergen import dataset
        >>> ds = dataset.load("./my_images")
        >>> for image, caption in ds:
        ...     print(f"Image: {image.size}, Caption: {caption}")
    """
    return Dataset.load(path, **kwargs)


# Module-level interface
dataset = type('dataset', (), {
    'load': staticmethod(load),
})()
