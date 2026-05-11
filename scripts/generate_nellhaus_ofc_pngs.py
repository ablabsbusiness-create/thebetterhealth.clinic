from __future__ import annotations

from pathlib import Path
from urllib.request import urlretrieve

import fitz
from PIL import Image, ImageEnhance, ImageOps


PDF_URL = "https://depts.washington.edu/fasdpn/pdfs/guide2004.pdf"
PDF_PATH = Path("tmp_fasd_guide2004.pdf")
OUTPUT_DIR = Path("app/assets/nellhaus-official-png")

SPECS = {
    "girls-ofc-5-18-nellhaus.png": {
        "page_index": 96,
        "crop": (165, 440, 1078, 1285),
    },
    "boys-ofc-5-18-nellhaus.png": {
        "page_index": 97,
        "crop": (132, 460, 1052, 1288),
    },
}


def ensure_pdf() -> None:
    if not PDF_PATH.exists():
        urlretrieve(PDF_URL, PDF_PATH)


def main() -> None:
    ensure_pdf()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(PDF_PATH)
    for filename, spec in SPECS.items():
        page = doc[spec["page_index"]]
        pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
        image = image.crop(spec["crop"])
        image = ImageOps.grayscale(image)
        image = ImageEnhance.Contrast(image).enhance(1.15)
        output_path = OUTPUT_DIR / filename
        image.save(output_path, optimize=True)
        print(f"Saved {output_path}")


if __name__ == "__main__":
    main()
