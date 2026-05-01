from __future__ import annotations

import base64
import io
import json
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw


class ChartPlotError(ValueError):
    pass


TEMPLATE_LIBRARY: dict[str, dict[str, Any]] = {
    "girlsHeight0to5": {
        "label": "Girls Height vs Age 0-5y",
        "path": "../assets/iap-official-png/girls-height-0-5-minimal.png",
        "regions": {
            "height": {
                "x": {"source": "ageMonths", "min": 0, "max": 60, "start": 0.1731, "end": 0.8269},
                "y": {"source": "height", "min": 45, "max": 130, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "boysHeight0to5": {
        "label": "Boys Height vs Age 0-5y",
        "path": "../assets/iap-official-png/boys-height-0-5-minimal.png",
        "regions": {
            "height": {
                "x": {"source": "ageMonths", "min": 0, "max": 60, "start": 0.1731, "end": 0.8269},
                "y": {"source": "height", "min": 45, "max": 130, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "girlsWeight0to5": {
        "label": "Girls Weight vs Age 0-5y",
        "path": "../assets/iap-official-png/girls-weight-0-5-minimal.png",
        "regions": {
            "weight": {
                "x": {"source": "ageMonths", "min": 0, "max": 60, "start": 0.1731, "end": 0.8269},
                "y": {"source": "weight", "min": 0, "max": 25, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "boysWeight0to5": {
        "label": "Boys Weight vs Age 0-5y",
        "path": "../assets/iap-official-png/boys-weight-0-5-minimal.png",
        "regions": {
            "weight": {
                "x": {"source": "ageMonths", "min": 0, "max": 60, "start": 0.1731, "end": 0.8269},
                "y": {"source": "weight", "min": 0, "max": 25, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "girlsHead0to5": {
        "label": "Girls OFC vs Age 0-5y",
        "path": "../assets/iap-official-png/girls-head-0-5-minimal.png",
        "regions": {
            "head": {
                "x": {"source": "ageMonths", "min": 0, "max": 60, "start": 0.1731, "end": 0.8269},
                "y": {"source": "head", "min": 35, "max": 55, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "boysHead0to5": {
        "label": "Boys OFC vs Age 0-5y",
        "path": "../assets/iap-official-png/boys-head-0-5-minimal.png",
        "regions": {
            "head": {
                "x": {"source": "ageMonths", "min": 0, "max": 60, "start": 0.1731, "end": 0.8269},
                "y": {"source": "head", "min": 35, "max": 55, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "girlsBmi0to5": {
        "label": "Girls BMI vs Age 0-5y",
        "path": "../assets/iap-official-png/girls-bmi-0-5-minimal.png",
        "regions": {
            "bmi": {
                "x": {"source": "ageMonths", "min": 0, "max": 60, "start": 0.1731, "end": 0.8269},
                "y": {"source": "bmi", "min": 10, "max": 22, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "boysBmi0to5": {
        "label": "Boys BMI vs Age 0-5y",
        "path": "../assets/iap-official-png/boys-bmi-0-5-minimal.png",
        "regions": {
            "bmi": {
                "x": {"source": "ageMonths", "min": 0, "max": 60, "start": 0.1731, "end": 0.8269},
                "y": {"source": "bmi", "min": 10, "max": 22, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "girlsHeight5to18": {
        "label": "Girls Height vs Age 5-18y",
        "path": "../assets/iap-official-png/girls-height-5-18-minimal.png",
        "regions": {
            "height": {
                "x": {"source": "ageYears", "min": 5, "max": 18, "start": 0.1731, "end": 0.8269},
                "y": {"source": "height", "min": 80, "max": 180, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "boysHeight5to18": {
        "label": "Boys Height vs Age 5-18y",
        "path": "../assets/iap-official-png/boys-height-5-18-minimal.png",
        "regions": {
            "height": {
                "x": {"source": "ageYears", "min": 5, "max": 18, "start": 0.1731, "end": 0.8269},
                "y": {"source": "height", "min": 85, "max": 185, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "girlsWeight5to18": {
        "label": "Girls Weight vs Age 5-18y",
        "path": "../assets/iap-official-png/girls-weight-5-18-minimal.png",
        "regions": {
            "weight": {
                "x": {"source": "ageYears", "min": 5, "max": 18, "start": 0.1731, "end": 0.8269},
                "y": {"source": "weight", "min": 5, "max": 75, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "boysWeight5to18": {
        "label": "Boys Weight vs Age 5-18y",
        "path": "../assets/iap-official-png/boys-weight-5-18-minimal.png",
        "regions": {
            "weight": {
                "x": {"source": "ageYears", "min": 5, "max": 18, "start": 0.1731, "end": 0.8269},
                "y": {"source": "weight", "min": 5, "max": 75, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "girlsHead5to18": {
        "label": "Girls OFC vs Age 5-18y",
        "path": "../assets/iap-official-png/girls-head-5-18-minimal.png",
        "regions": {
            "head": {
                "x": {"source": "ageYears", "min": 5, "max": 18, "start": 0.1731, "end": 0.8269},
                "y": {"source": "head", "min": 45, "max": 57, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "boysHead5to18": {
        "label": "Boys OFC vs Age 5-18y",
        "path": "../assets/iap-official-png/boys-head-5-18-minimal.png",
        "regions": {
            "head": {
                "x": {"source": "ageYears", "min": 5, "max": 18, "start": 0.1731, "end": 0.8269},
                "y": {"source": "head", "min": 45, "max": 57, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "girlsBmi5to18": {
        "label": "Girls BMI vs Age 5-18y",
        "path": "../assets/iap-official-png/girls-bmi-5-18-minimal.png",
        "regions": {
            "bmi": {
                "x": {"source": "ageYears", "min": 5, "max": 18, "start": 0.1731, "end": 0.8269},
                "y": {"source": "bmi", "min": 10, "max": 35, "start": 0.8617, "end": 0.117},
            }
        },
    },
    "boysBmi5to18": {
        "label": "Boys BMI vs Age 5-18y",
        "path": "../assets/iap-official-png/boys-bmi-5-18-minimal.png",
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


def get_plot_bounds(region: dict[str, Any], width: int, height: int, inset: float = 0.0) -> tuple[float, float, float, float]:
    left = min(region["x"]["start"], region["x"]["end"]) * width + inset
    right = max(region["x"]["start"], region["x"]["end"]) * width - inset
    top = min(region["y"]["start"], region["y"]["end"]) * height + inset
    bottom = max(region["y"]["start"], region["y"]["end"]) * height - inset
    if left > right:
        midpoint_x = (left + right) / 2
        left = midpoint_x
        right = midpoint_x
    if top > bottom:
        midpoint_y = (top + bottom) / 2
        top = midpoint_y
        bottom = midpoint_y
    return left, right, top, bottom


def constrain_point_to_bounds(point: tuple[float, float], bounds: tuple[float, float, float, float]) -> tuple[float, float]:
    left, right, top, bottom = bounds
    x, y = point
    return min(max(x, left), right), min(max(y, top), bottom)


def clip_overlay_to_bounds(
    overlay: Image.Image,
    width: int,
    height: int,
    bounds: tuple[float, float, float, float],
) -> Image.Image:
    left, right, top, bottom = bounds
    clipped_overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    mask = Image.new("L", (width, height), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rectangle((left, top, right, bottom), fill=255)
    clipped_overlay.paste(overlay, (0, 0), mask)
    return clipped_overlay


def sort_entries(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(entries, key=lambda entry: parse_datetime(entry.get("measuredAt")) or datetime.min)


def get_metric_axis_age_values(region: dict[str, Any], entries: list[dict[str, Any]], dob_value: str) -> list[float]:
    values: list[float] = []
    for entry in entries:
        patient_data = build_patient_data(dob_value, entry)
        value = patient_data.get(region["x"]["source"], float("nan"))
        if value == value:
            values.append(value)
    return sorted(values)


def get_custom_axis_step(source: str, span: float) -> float:
    if source == "ageMonths":
        if span <= 4:
            return 1
        if span <= 10:
            return 2
        return 3
    if span <= 1.2:
        return 0.2
    if span <= 2.5:
        return 0.5
    if span <= 5:
        return 1
    return 2


def round_down_to_step(value: float, step: float) -> float:
    return int(value / step) * step if step else value


def round_up_to_step(value: float, step: float) -> float:
    if not step:
        return value
    quotient = value / step
    whole = int(quotient)
    return whole * step if quotient == whole else (whole + 1) * step


def get_focused_x_axis_viewport(region: dict[str, Any], entries: list[dict[str, Any]], dob_value: str) -> dict[str, float] | None:
    age_values = get_metric_axis_age_values(region, entries, dob_value)
    if not age_values:
        return None

    min_age = age_values[0]
    max_age = age_values[-1]
    span = max(max_age - min_age, 0)
    step = get_custom_axis_step(region["x"]["source"], span)
    minimum_window = 6 if region["x"]["source"] == "ageMonths" else 1.2
    padding = step * 1.5
    viewport_min = round_down_to_step(min_age - padding, step)
    viewport_max = round_up_to_step(max_age + padding, step)

    if viewport_max - viewport_min < minimum_window:
        center = (min_age + max_age) / 2
        viewport_min = round_down_to_step(center - minimum_window / 2, step)
        viewport_max = round_up_to_step(center + minimum_window / 2, step)

    viewport_min = max(region["x"]["min"], viewport_min)
    viewport_max = min(region["x"]["max"], viewport_max)

    if not (viewport_max > viewport_min):
        return None

    return {"min": viewport_min, "max": viewport_max, "step": step}


def render_focused_template(
    image: Image.Image,
    region: dict[str, Any],
    viewport: dict[str, float] | None,
) -> Image.Image:
    if not viewport:
        return image.copy()

    source_width, source_height = image.size
    full_span = region["x"]["max"] - region["x"]["min"]
    if full_span <= 0:
        return image.copy()

    source_plot_left = region["x"]["start"] * source_width
    source_plot_right = region["x"]["end"] * source_width
    source_plot_width = source_plot_right - source_plot_left
    dest_plot_left = region["x"]["start"] * source_width
    dest_plot_right = region["x"]["end"] * source_width
    dest_plot_width = dest_plot_right - dest_plot_left
    viewport_left_ratio = clamp_ratio((viewport["min"] - region["x"]["min"]) / full_span)
    viewport_right_ratio = clamp_ratio((viewport["max"] - region["x"]["min"]) / full_span)
    viewport_source_left = source_plot_left + source_plot_width * viewport_left_ratio
    viewport_source_right = source_plot_left + source_plot_width * viewport_right_ratio
    viewport_source_width = max(1, int(round(viewport_source_right - viewport_source_left)))

    focused = Image.new("RGBA", image.size, (255, 255, 255, 255))

    if dest_plot_left > 0:
        left_slice = image.crop((0, 0, int(round(source_plot_left)), source_height))
        focused.paste(left_slice, (0, 0))

    viewport_slice = image.crop(
        (
            int(round(viewport_source_left)),
            0,
            int(round(viewport_source_left)) + viewport_source_width,
            source_height,
        )
    )
    viewport_slice = viewport_slice.resize((max(1, int(round(dest_plot_width))), source_height), Image.Resampling.LANCZOS)
    focused.paste(viewport_slice, (int(round(dest_plot_left)), 0))

    if source_width - dest_plot_right > 0:
        right_slice = image.crop((int(round(source_plot_right)), 0, source_width, source_height))
        focused.paste(right_slice, (int(round(dest_plot_right)), 0))

    return focused


def format_custom_axis_label(source: str, value: float, step: float) -> str:
    if source == "ageMonths":
        return f"{round(value)}m"
    decimals = 1 if step < 1 else 0
    return f"{value:.{decimals}f}y"


def draw_custom_x_axis_labels(
    image: Image.Image,
    region: dict[str, Any],
    viewport: dict[str, float] | None,
    marker_radius: int,
) -> None:
    if not viewport:
        return

    draw = ImageDraw.Draw(image)
    bounds = get_plot_bounds(region, image.width, image.height, marker_radius)
    band_top = max(0, int(round(bounds[3] - 10)))
    band_bottom = image.height
    band_height = band_bottom - band_top
    if band_height < 24:
        return

    draw.rectangle((0, band_top, image.width, band_bottom), fill=(255, 255, 255, 245))
    axis_y = band_top + 10
    draw.line((bounds[0], axis_y, bounds[1], axis_y), fill="#c9d6cc", width=1)

    value = viewport["min"]
    while value <= viewport["max"] + viewport["step"] / 2:
        tick_value = round(value, 4)
        tick_ratio = clamp_ratio((tick_value - viewport["min"]) / (viewport["max"] - viewport["min"]))
        tick_x = (region["x"]["start"] + (region["x"]["end"] - region["x"]["start"]) * tick_ratio) * image.width
        draw.line((tick_x, axis_y, tick_x, axis_y + 5), fill="#c9d6cc", width=1)
        draw.text((tick_x, axis_y + 10), format_custom_axis_label(region["x"]["source"], tick_value, viewport["step"]), fill="#415146", anchor="ma")
        value += viewport["step"]


def get_marker_metrics(image_width: int) -> tuple[int, int]:
    radius = max(7, round(image_width * 0.0045))
    outline_width = max(2, round(radius * 0.22))
    return radius, outline_width


def draw_marker(draw: ImageDraw.ImageDraw, point: tuple[float, float], image_width: int) -> None:
    radius, outline_width = get_marker_metrics(image_width)
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

    image = Image.open(image_path).convert("RGBA")
    line_width = max(3, round(image.width * 0.0024))
    marker_radius, _ = get_marker_metrics(image.width)

    for metric_key in template_request.get("metrics", []):
        region = template["regions"].get(metric_key)
        if not region:
            continue

        entries = sort_entries(list(plot_series.get(metric_key, [])))
        viewport = get_focused_x_axis_viewport(region, entries, dob_value)
        focused_image = render_focused_template(image, region, viewport)
        plot_bounds = get_plot_bounds(region, focused_image.width, focused_image.height, max(marker_radius, line_width / 2))
        clip_bounds = get_plot_bounds(region, focused_image.width, focused_image.height, 0)
        mapped_points = []
        for entry in entries:
            patient_data = build_patient_data(dob_value, entry)
            if patient_data.get(metric_key) != patient_data.get(metric_key):
                continue
            point = map_point(region, patient_data, focused_image.width, focused_image.height)
            if point is not None:
                mapped_points.append(constrain_point_to_bounds(point, plot_bounds))

        overlay = Image.new("RGBA", focused_image.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        if len(mapped_points) > 1:
            overlay_draw.line(mapped_points, fill=MARKER_FILL, width=line_width, joint="curve")

        for point in mapped_points:
            draw_marker(overlay_draw, point, focused_image.width)

        focused_image = Image.alpha_composite(
            focused_image,
            clip_overlay_to_bounds(overlay, focused_image.width, focused_image.height, clip_bounds),
        )
        draw_custom_x_axis_labels(focused_image, region, viewport, marker_radius)
        image = focused_image

    return image.convert("RGB")


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


class handler(BaseHTTPRequestHandler):
    def send_json(self, status_code: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        self.send_json(200, {"ok": True, "message": "POST growth chart payloads here."})

    def do_POST(self) -> None:
        try:
            body_length = int(self.headers.get("content-length", "0"))
            raw_body = self.rfile.read(body_length) if body_length > 0 else b"{}"
            payload = json.loads(raw_body.decode("utf-8"))
            self.send_json(200, generate_chart_package(payload))
        except ChartPlotError as exc:
            self.send_json(400, {"error": str(exc)})
        except json.JSONDecodeError:
            self.send_json(400, {"error": "Request body must be valid JSON."})
        except Exception:
            self.send_json(500, {"error": "Unable to generate charts right now."})
