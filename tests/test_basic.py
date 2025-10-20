"""Basic integration tests for hypergen."""

import tempfile
from pathlib import Path

import pytest
from PIL import Image


def test_imports():
    """Test that basic imports work."""
    from hypergen import model, dataset
    assert model is not None
    assert dataset is not None


def test_dataset_load():
    """Test loading a dataset from a folder."""
    from hypergen import dataset

    # Create temporary directory with test images
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)

        # Create some dummy images
        for i in range(5):
            img = Image.new('RGB', (256, 256), color=(i * 50, i * 50, i * 50))
            img.save(tmpdir / f"image_{i}.jpg")

        # Load dataset
        ds = dataset.load(tmpdir)

        # Verify
        assert len(ds) == 5

        # Test iteration
        for img, caption in ds:
            assert isinstance(img, Image.Image)
            assert img.size == (256, 256)


def test_dataset_with_captions():
    """Test loading a dataset with caption files."""
    from hypergen import dataset

    # Create temporary directory with test images and captions
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)

        # Create images and captions
        for i in range(3):
            img = Image.new('RGB', (256, 256), color=(i * 80, i * 80, i * 80))
            img.save(tmpdir / f"image_{i}.jpg")

            # Create caption file
            caption_text = f"This is image number {i}"
            (tmpdir / f"image_{i}.txt").write_text(caption_text)

        # Load dataset
        ds = dataset.load(tmpdir)

        # Verify
        assert len(ds) == 3

        # Check captions
        for i, (img, caption) in enumerate(ds):
            assert caption == f"This is image number {i}"


def test_dataset_batch():
    """Test batching dataset."""
    from hypergen import dataset

    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)

        # Create 10 dummy images
        for i in range(10):
            img = Image.new('RGB', (128, 128), color=(i * 25, i * 25, i * 25))
            img.save(tmpdir / f"image_{i}.jpg")

        # Load dataset
        ds = dataset.load(tmpdir)

        # Test batching
        batches = list(ds.batch(3))

        assert len(batches) == 4  # 3 + 3 + 3 + 1
        assert len(batches[0]) == 3
        assert len(batches[1]) == 3
        assert len(batches[2]) == 3
        assert len(batches[3]) == 1  # Last batch has remainder


@pytest.mark.skip(reason="Requires GPU and model download - run manually")
def test_model_load():
    """Test loading a model (requires GPU and downloads model)."""
    from hypergen import model

    # This test is skipped by default as it:
    # 1. Downloads a large model
    # 2. Requires GPU/CUDA
    #
    # To run manually:
    # pytest tests/test_basic.py::test_model_load -v -s

    m = model.load("hf-internal-testing/tiny-stable-diffusion-torch")
    assert m is not None
    assert m.pipeline is not None


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
