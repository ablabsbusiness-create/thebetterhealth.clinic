from __future__ import annotations

from pathlib import Path
from io import BytesIO
from urllib.request import Request, urlopen

from PIL import Image, ImageFilter, ImageOps


CHARTS = [
    ("https://iapindia.org/pdf/IAP-Boys-BMI-Chart-5-18-years-746x1024.jpg", "boys-bmi-5-18-bw.png"),
    ("https://iapindia.org/pdf/IAP-Boys-Height-Weight-chart-5-18-years-1-746x1024.jpg", "boys-height-weight-5-18-bw.png"),
    ("https://iapindia.org/pdf/WHO-boys-Height-Weight-Head-Chart-0-5-years-746x1024.jpg", "boys-height-weight-head-0-5-bw.png"),
    ("https://iapindia.org/pdf/WHO-boys-Weight-for-Height-Length-Chart-746x1024.jpg", "boys-weight-for-height-0-5-bw.png"),
    ("https://iapindia.org/pdf/Boys-0-18-iap-and-who-combined-charts-height-and-weight-1-746x1024.jpg", "boys-combined-height-weight-0-18-bw.png"),
    ("https://iapindia.org/pdf/Indian-Boys-Waist-Circumference.jpg", "boys-waist-circumference-bw.png"),
    ("https://iapindia.org/pdf/IAP-Boys-Extended-BMI-Charts.jpg", "boys-extended-bmi-bw.png"),
    ("https://iapindia.org/pdf/IAP-Girls-BMI-Chart-5-18-years-746x1024.jpg", "girls-bmi-5-18-bw.png"),
    ("https://iapindia.org/pdf/IAP-Girls-Height-Weight-chart-5-18-years-746x1024.jpg", "girls-height-weight-5-18-bw.png"),
    ("https://iapindia.org/pdf/WHO-Girls-Height-Weight-Head-Chart-0-5-years-746x1024.jpg", "girls-height-weight-head-0-5-bw.png"),
    ("https://iapindia.org/pdf/WHO-Girls-Weight-for-Height-Length-Chart-746x1024.jpg", "girls-weight-for-height-0-5-bw.png"),
    ("https://iapindia.org/pdf/Girls-0-18-iap-and-who-combined-charts-height-and-weight-746x1024.jpg", "girls-combined-height-weight-0-18-bw.png"),
    ("https://iapindia.org/pdf/Indian-Girls-Waist-Circumference.jpg", "girls-waist-circumference-bw.png"),
    ("https://iapindia.org/pdf/IAP-Girls-Extended-BMI-Charts.jpg", "girls-extended-bmi-bw.png"),
]


def convert_to_line_art(image: Image.Image) -> Image.Image:
    grayscale = image.convert("L")
    grayscale = ImageOps.autocontrast(grayscale)
    grayscale = grayscale.filter(ImageFilter.SHARPEN)
    grayscale = grayscale.filter(ImageFilter.MedianFilter(size=3))

    # Preserve light chart lines and labels while dropping the mostly white paper background.
    threshold = 228
    binary = grayscale.point(lambda px: 255 if px > threshold else 0, mode="1")
    return binary.convert("L")


def download_image(url: str) -> Image.Image:
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
    )
    with urlopen(request) as response:
        data = response.read()
    return Image.open(BytesIO(data)).convert("RGB")


def main() -> None:
    output_dir = Path("app/assets/iap-official-bw")
    output_dir.mkdir(parents=True, exist_ok=True)

    for url, filename in CHARTS:
        image = download_image(url)
        converted = convert_to_line_art(image)
        output_path = output_dir / filename
        converted.save(output_path, format="PNG", optimize=True)
        print(f"Saved {output_path}")


if __name__ == "__main__":
    main()
