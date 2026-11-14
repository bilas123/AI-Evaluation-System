import uuid
from pathlib import Path
from PIL import Image, ImageOps, UnidentifiedImageError
from fastapi import HTTPException, status, UploadFile

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

def process_and_save_image(file: UploadFile) -> str:
    # Read raw content and validate size
    content = file.file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 5 MB limit"
        )
    
    import io
    try:
        image = Image.open(io.BytesIO(content))
    except (UnidentifiedImageError, Exception):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image file. Please upload a valid JPEG or PNG image"
        )

    # Validate image format
    if image.format not in ("JPEG", "PNG", "JPG"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported format. Only JPEG and PNG images are allowed"
        )

    # Fix EXIF rotation from mobile cameras
    image = ImageOps.exif_transpose(image)
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Downscale so the longest side is <= 2000px
    max_dim = 2000
    width, height = image.size
    if max(width, height) > max_dim:
        scale = max_dim / max(width, height)
        new_size = (int(width * scale), int(height * scale))
        image = image.resize(new_size, Image.Resampling.LANCZOS)

    # Save to uploads with a unique UUID filename
    filename = f"{uuid.uuid4().hex}.jpg"
    dest_path = UPLOAD_DIR / filename
    image.save(dest_path, "JPEG", quality=90)

    return str(dest_path)
