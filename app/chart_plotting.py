from __future__ import annotations

import base64
import io
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw


class ChartPlotError(ValueError):
    pass


TEMPLATE_LIBRARY: dict[str, dict[str, Any]] = {
    "girlsHeight0to5": {
        "label": "Girls Height vs Age 0-5y",
        "path": "assets/iap-official-png/girls-height-0-5-minimal.png",
        "regions": {
            "height": {
                "x": {"source": "ageMonths", "min": 0, "max": 60, "start": 0.1731, "end": 0.8269},
                "y": {"source": "height", "min": 45, "max": 130, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "boysHeight0to5": {
        "label": "Boys Height vs Age 0-5y",
        "path": "assets/iap-official-png/boys-height-0-5-minimal.png",
        "regions": {
            "height": {
                "x": {"source": "ageMonths", "min": 0, "max": 60, "start": 0.1731, "end": 0.8269},
                "y": {"source": "height", "min": 45, "max": 130, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "girlsWeight0to5": {
        "label": "Girls Weight vs Age 0-5y",
        "path": "assets/iap-official-png/girls-weight-0-5-minimal.png",
        "regions": {
            "weight": {
                "x": {"source": "ageMonths", "min": 0, "max": 60, "start": 0.1731, "end": 0.8269},
                "y": {"source": "weight", "min": 0, "max": 25, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "boysWeight0to5": {
        "label": "Boys Weight vs Age 0-5y",
        "path": "assets/iap-official-png/boys-weight-0-5-minimal.png",
        "regions": {
            "weight": {
                "x": {"source": "ageMonths", "min": 0, "max": 60, "start": 0.1731, "end": 0.8269},
                "y": {"source": "weight", "min": 0, "max": 25, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "girlsHead0to5": {
        "label": "Girls OFC vs Age 0-5y",
        "path": "assets/iap-official-png/girls-head-0-5-minimal.png",
        "regions": {
            "head": {
                "x": {"source": "ageMonths", "min": 0, "max": 60, "start": 0.1731, "end": 0.8269},
                "y": {"source": "head", "min": 35, "max": 55, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "boysHead0to5": {
        "label": "Boys OFC vs Age 0-5y",
        "path": "assets/iap-official-png/boys-head-0-5-minimal.png",
        "regions": {
            "head": {
                "x": {"source": "ageMonths", "min": 0, "max": 60, "start": 0.1731, "end": 0.8269},
                "y": {"source": "head", "min": 35, "max": 55, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "girlsBmi0to5": {
        "label": "Girls BMI vs Age 0-5y",
        "path": "assets/iap-official-png/girls-bmi-0-5-minimal.png",
        "regions": {
            "bmi": {
                "x": {"source": "ageMonths", "min": 0, "max": 60, "start": 0.1731, "end": 0.8269},
                "y": {"source": "bmi", "min": 10, "max": 22, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "boysBmi0to5": {
        "label": "Boys BMI vs Age 0-5y",
        "path": "assets/iap-official-png/boys-bmi-0-5-minimal.png",
        "regions": {
            "bmi": {
                "x": {"source": "ageMonths", "min": 0, "max": 60, "start": 0.1731, "end": 0.8269},
                "y": {"source": "bmi", "min": 10, "max": 22, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "girlsHeight5to18": {
        "label": "Girls Height vs Age 5-18y",
        "path": "assets/iap-official-png/girls-height-5-18-minimal.png",
        "regions": {
            "height": {
                "x": {"source": "ageYears", "min": 5, "max": 18, "start": 0.1731, "end": 0.8269},
                "y": {"source": "height", "min": 80, "max": 180, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "boysHeight5to18": {
        "label": "Boys Height vs Age 5-18y",
        "path": "assets/iap-official-png/boys-height-5-18-minimal.png",
        "regions": {
            "height": {
                "x": {"source": "ageYears", "min": 5, "max": 18, "start": 0.1731, "end": 0.8269},
                "y": {"source": "height", "min": 85, "max": 185, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "girlsWeight5to18": {
        "label": "Girls Weight vs Age 5-18y",
        "path": "assets/iap-official-png/girls-weight-5-18-minimal.png",
        "regions": {
            "weight": {
                "x": {"source": "ageYears", "min": 5, "max": 18, "start": 0.1731, "end": 0.8269},
                "y": {"source": "weight", "min": 5, "max": 75, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "boysWeight5to18": {
        "label": "Boys Weight vs Age 5-18y",
        "path": "assets/iap-official-png/boys-weight-5-18-minimal.png",
        "regions": {
            "weight": {
                "x": {"source": "ageYears", "min": 5, "max": 18, "start": 0.1731, "end": 0.8269},
                "y": {"source": "weight", "min": 5, "max": 75, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "girlsHead5to18": {
        "label": "Girls OFC vs Age 5-18y",
        "path": "assets/iap-official-png/girls-head-5-18-minimal.png",
        "regions": {
            "head": {
                "x": {"source": "ageYears", "min": 5, "max": 18, "start": 0.1731, "end": 0.8269},
                "y": {"source": "head", "min": 45, "max": 57, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "boysHead5to18": {
        "label": "Boys OFC vs Age 5-18y",
        "path": "assets/iap-official-png/boys-head-5-18-minimal.png",
        "regions": {
            "head": {
                "x": {"source": "ageYears", "min": 5, "max": 18, "start": 0.1731, "end": 0.8269},
                "y": {"source": "head", "min": 45, "max": 57, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "girlsBmi5to18": {
        "label": "Girls BMI vs Age 5-18y",
        "path": "assets/iap-official-png/girls-bmi-5-18-minimal.png",
        "regions": {
            "bmi": {
                "x": {"source": "ageYears", "min": 5, "max": 18, "start": 0.1731, "end": 0.8269},
                "y": {"source": "bmi", "min": 10, "max": 35, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "boysBmi5to18": {
        "label": "Boys BMI vs Age 5-18y",
        "path": "assets/iap-official-png/boys-bmi-5-18-minimal.png",
        "regions": {
            "bmi": {
                "x": {"source": "ageYears", "min": 5, "max": 18, "start": 0.1731, "end": 0.8269},
                "y": {"source": "bmi", "min": 10, "max": 35, "start": 0.8617, "end": 0.117},
            }
        },
    },
}

MARKER_FILL = "#b91c1c"
MARKER_OUTLINE = "#ffffff"
BASE_DIR = Path(__file__).resolve().parent


def parse_float(value: Any) -> float:
    try:
        return float(str(value).strip())
    except (TypeError, ValueError):
        return float("nan")


def parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    text = str(value).strip()
    if not text:
        return None
    normalized = text.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


def get_age_years_at_date(dob_value: str, measured_at_value: Any) -> float:
    dob = parse_datetime(dob_value)
    measured_at = parse_datetime(measured_at_value)
    if dob is None or measured_at is None or measured_at < dob:
        return float("nan")
    return (measured_at - dob).total_seconds() / (365.25 * 24 * 60 * 60)


def clamp_ratio(value: float) -> float:
    return min(1.0, max(0.0, value))


def build_patient_data(dob_value: str, entry: dict[str, Any]) -> dict[str, float]:
    age_years = get_age_years_at_date(dob_value, entry.get("measuredAt"))
    age_months = age_years * 12 if age_years == age_years else float("nan")
    weight = parse_float(entry.get("weight"))
    height = parse_float(entry.get("height"))
    head = parse_float(entry.get("head"))
    bmi = weight / ((height / 100) ** 2) if height == height and weight == weight and height > 0 else float("nan")
    return {
        "ageYears": age_years,
        "ageMonths": age_months,
        "weight": weight,
        "height": height,
        "head": head,
        "bmi": bmi,
    }


def map_point(region: dict[str, Any], patient_data: dict[str, float], width: int, height: int) -> tuple[float, float] | None:
    x_value = patient_data.get(region["x"]["source"], float("nan"))
    y_value = patient_data.get(region["y"]["source"], float("nan"))
    if x_value != x_value or y_value != y_value:
        return None
    x_ratio = clamp_ratio((x_value - region["x"]["min"]) / (region["x"]["max"] - region["x"]["min"]))
    y_ratio = clamp_ratio((y_value - region["y"]["min"]) / (region["y"]["max"] - region["y"]["min"]))
    x = (region["x"]["start"] + (region["x"]["end"] - region["x"]["start"]) * x_ratio) * width
    y = (region["y"]["start"] - (region["y"]["start"] - region["y"]["end"]) * y_ratio) * height
    return x, y


def sort_entries(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(entries, key=lambda entry: parse_datetime(entry.get("measuredAt")) or datetime.min)


def draw_marker(draw: ImageDraw.ImageDraw, point: tuple[float, float], image_width: int) -> None:
    radius = max(240, round(image_width * 0.22))
    outline_width = max(18, round(radius * 0.18))
    x, y = point
    draw.ellipse(
        (x - radius, y - radius, x + radius, y + radius),
        fill=MARKER_FILL,
        outline=MARKER_OUTLINE,
        width=outline_width,
    )


def render_template_page(template_request: dict[str, Any], plot_series: dict[str, list[dict[str, Any]]], dob_value: str) -> Image.Image:
    template_key = template_request.get("key", "")
    template = TEMPLATE_LIBRARY.get(template_key)
    if not template:
        raise ChartPlotError(f"Unknown template key: {template_key}")

    image_path = BASE_DIR / template["path"]
    if not image_path.exists():
        raise ChartPlotError(f"Missing chart asset: {template['path']}")

    image = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(image)
    line_width = max(20, round(image.width * 0.012))

    for metric_key in template_request.get("metrics", []):
        region = template["regions"].get(metric_key)
        if not region:
            continue

        entries = sort_entries(list(plot_series.get(metric_key, [])))
        mapped_points = []
        for entry in entries:
            patient_data = build_patient_data(dob_value, entry)
            if patient_data.get(metric_key) != patient_data.get(metric_key):
                continue
            point = map_point(region, patient_data, image.width, image.height)
            if point is not None:
                mapped_points.append(point)

        if len(mapped_points) > 1:
            draw.line(mapped_points, fill=MARKER_FILL, width=line_width, joint="curve")

        for point in mapped_points:
            draw_marker(draw, point, image.width)

    return image


def encode_png_data_url(image: Image.Image) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def encode_pdf_base64(images: list[Image.Image]) -> str:
    if not images:
        return ""
    pdf_buffer = io.BytesIO()
    first_image, *remaining = [image.convert("RGB") for image in images]
    first_image.save(pdf_buffer, format="PDF", save_all=True, append_images=remaining)
    return base64.b64encode(pdf_buffer.getvalue()).decode("ascii")


def generate_chart_package(payload: dict[str, Any]) -> dict[str, Any]:
    dob_value = str(payload.get("dob", "")).strip()
    if not dob_value:
        raise ChartPlotError("DOB is required for chart plotting.")

    template_requests = payload.get("templateRequests")
    if not isinstance(template_requests, list) or not template_requests:
        raise ChartPlotError("No chart templates were requested.")

    plot_series = payload.get("plotSeries")
    if not isinstance(plot_series, dict):
        raise ChartPlotError("Plot series payload is missing.")

    pages = []
    page_images = []

    for template_request in template_requests:
        image = render_template_page(template_request, plot_series, dob_value)
        pages.append(
            {
                "label": template_request.get("label") or TEMPLATE_LIBRARY[template_request["key"]]["label"],
                "dataUrl": encode_png_data_url(image),
                "width": image.width,
                "height": image.height,
            }
        )
        page_images.append(image)

    return {
        "pages": pages,
        "pdfBase64": encode_pdf_base64(page_images),
    }
