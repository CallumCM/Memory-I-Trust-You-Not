from PIL import Image
import os

def convert_to_webp(source, destination):
    """Convert image to WebP.

    Args:
        source (pathlib.Path): Path to source image

    Returns:
        pathlib.Path: path to new image
    """
    image = Image.open(source)
    image.save(destination, format="webp")
    os.remove(source)
    return destination