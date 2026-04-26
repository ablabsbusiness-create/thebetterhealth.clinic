from __future__ import annotations

from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError as exc:  # pragma: no cover - environment-specific dependency
    raise SystemExit(
        "Pillow is required to generate PNG chart assets. Install it with `pip install pillow`."
    ) from exc

from generate_minimal_iap_svgs import CHARTS, PERCENTILES, X_AXIS, get_y_labels


SCALE = 4
CANVAS_WIDTH = 260
PANEL_GAP = 20
PANEL_WIDTH = 170
PANEL_HEIGHT = 140
PANEL_Y = 22
TOTAL_HEIGHT = PANEL_Y + PANEL_HEIGHT + 26

BG = "#ffffff"
AXIS = "#111111"
TICK = "#666666"
LABEL = "#222222"
CURVE = "#8a8f96"
MEDIAN = "#222222"
PERCENTILE = "#444444"


def sx(value: int | float) -> int:
    return round(value * SCALE)


def load_font(size: int) -> ImageFont.ImageFont:
    for font_name in ("arial.ttf", "Arial.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(font_name, sx(size))
        except OSError:
            continue
    return ImageFont.load_default()


LABEL_FONT = load_font(9)
PERCENTILE_FONT = load_font(8)


def cubic_points(p0, p1, p2, p3, steps: int = 48):
    points = []
    for index in range(steps + 1):
        t = index / steps
        mt = 1 - t
        x = (
            (mt ** 3) * p0[0]
            + 3 * (mt ** 2) * t * p1[0]
            + 3 * mt * (t ** 2) * p2[0]
            + (t ** 3) * p3[0]
        )
        y = (
            (mt ** 3) * p0[1]
            + 3 * (mt ** 2) * t * p1[1]
            + 3 * mt * (t ** 2) * p2[1]
            + (t ** 3) * p3[1]
        )
        points.append((sx(x), sx(y)))
    return points


def build_curves(kind: str, x: int, y: int, width: int, height: int):
    right = x + width
    bottom = y + height
    curves = []

    def add(start, c1, c2, end, color, width_px):
        curves.append((cubic_points(start, c1, c2, end), color, sx(width_px)))

    if kind == "height":
        add((x, bottom - 22), (x + 28, bottom - 92), (x + 88, bottom - 136), (right, y + 10), CURVE, 1.5)
        add((x, bottom - 16), (x + 28, bottom - 74), (x + 88, bottom - 116), (right, y + 28), CURVE, 1.5)
        add((x, bottom - 9), (x + 28, bottom - 58), (x + 88, bottom - 96), (right, y + 44), MEDIAN, 2.1)
        add((x, bottom - 2), (x + 28, bottom - 42), (x + 88, bottom - 78), (right, y + 58), CURVE, 1.5)
    elif kind == "weight":
        add((x, bottom - 26), (x + 34, bottom - 104), (x + 92, bottom - 132), (right, y + 16), CURVE, 1.5)
        add((x, bottom - 18), (x + 34, bottom - 88), (x + 92, bottom - 114), (right, y + 34), CURVE, 1.5)
        add((x, bottom - 10), (x + 34, bottom - 72), (x + 92, bottom - 98), (right, y + 52), MEDIAN, 2.1)
        add((x, bottom - 1), (x + 34, bottom - 58), (x + 92, bottom - 82), (right, y + 68), CURVE, 1.5)
    elif kind == "head":
        add((x, bottom - 36), (x + 32, bottom - 62), (x + 90, bottom - 76), (right, y + 24), CURVE, 1.5)
        add((x, bottom - 28), (x + 32, bottom - 52), (x + 90, bottom - 65), (right, y + 37), CURVE, 1.5)
        add((x, bottom - 20), (x + 32, bottom - 42), (x + 90, bottom - 54), (right, y + 50), MEDIAN, 2.1)
        add((x, bottom - 12), (x + 32, bottom - 34), (x + 90, bottom - 44), (right, y + 63), CURVE, 1.5)
    elif kind == "head_teen":
        add((x, bottom - 44), (x + 32, bottom - 62), (x + 90, bottom - 76), (right, y + 22), CURVE, 1.5)
        add((x, bottom - 34), (x + 32, bottom - 50), (x + 90, bottom - 62), (right, y + 34), CURVE, 1.5)
        add((x, bottom - 24), (x + 32, bottom - 40), (x + 90, bottom - 50), (right, y + 46), MEDIAN, 2.1)
        add((x, bottom - 14), (x + 32, bottom - 30), (x + 90, bottom - 40), (right, y + 58), CURVE, 1.5)
        add((x, bottom - 6), (x + 32, bottom - 22), (x + 90, bottom - 31), (right, y + 70), CURVE, 1.5)
    elif kind == "weight_for_height":
        add((x, bottom - 28), (x + 48, bottom - 122), (x + 132, bottom - 128), (right, y + 22), CURVE, 1.5)
        add((x, bottom - 18), (x + 48, bottom - 104), (x + 132, bottom - 108), (right, y + 38), CURVE, 1.5)
        add((x, bottom - 9), (x + 48, bottom - 86), (x + 132, bottom - 90), (right, y + 56), MEDIAN, 2.1)
        add((x, bottom - 1), (x + 48, bottom - 68), (x + 132, bottom - 72), (right, y + 72), CURVE, 1.5)
    elif kind in {"bmi", "extended_bmi", "bmi_small"}:
        add((x, y + 62), (x + 56, y + 50), (x + 126, y + 26), (right, y + 10), CURVE, 1.5)
        add((x, y + 86), (x + 56, y + 74), (x + 126, y + 50), (right, y + 34), CURVE, 1.5)
        add((x, y + 110), (x + 56, y + 98), (x + 126, y + 80), (right, y + 58), MEDIAN, 2.1)
        add((x, y + 132), (x + 56, y + 124), (x + 126, y + 106), (right, y + 84), CURVE, 1.5)
        if kind in {"bmi", "bmi_small"}:
            add((x, y + 148), (x + 56, y + 142), (x + 126, y + 128), (right, y + 106), CURVE, 1.5)
    elif kind == "waist":
        add((x, bottom - 36), (x + 48, bottom - 88), (x + 122, bottom - 112), (right, y + 22), CURVE, 1.5)
        add((x, bottom - 24), (x + 48, bottom - 70), (x + 122, bottom - 92), (right, y + 42), CURVE, 1.5)
        add((x, bottom - 12), (x + 48, bottom - 52), (x + 122, bottom - 72), (right, y + 62), MEDIAN, 2.1)
        add((x, bottom - 2), (x + 48, bottom - 38), (x + 122, bottom - 56), (right, y + 80), CURVE, 1.5)

    return curves


def text_center(draw: ImageDraw.ImageDraw, xy, text: str, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    draw.text((xy[0] - width / 2, xy[1] - height / 2), text, font=font, fill=fill)


def text_right(draw: ImageDraw.ImageDraw, xy, text: str, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    draw.text((xy[0] - width, xy[1] - height / 2), text, font=font, fill=fill)


def draw_axes(draw: ImageDraw.ImageDraw, x: int, y: int, width: int, height: int, panel: dict):
    draw.line([(sx(x), sx(y)), (sx(x), sx(y + height)), (sx(x + width), sx(y + height))], fill=AXIS, width=sx(2))

    x_labels = X_AXIS[panel["age_mode"]]
    x_step = width / max(1, len(x_labels) - 1)
    for index, label in enumerate(x_labels):
        tick_x = x + round(x_step * index)
        draw.line([(sx(tick_x), sx(y + height)), (sx(tick_x), sx(y + height - 6))], fill=TICK, width=sx(1))
        text_center(draw, (sx(tick_x), sx(y + height + 16)), label, LABEL_FONT, LABEL)

    y_labels = get_y_labels(panel)
    y_step = height / max(1, len(y_labels) - 1)
    for index, label in enumerate(y_labels):
        tick_y = y + round(y_step * index)
        draw.line([(sx(x), sx(tick_y)), (sx(x + 6), sx(tick_y))], fill=TICK, width=sx(1))
        text_right(draw, (sx(x - 6), sx(tick_y)), label, LABEL_FONT, LABEL)


def draw_percentiles(draw: ImageDraw.ImageDraw, kind: str, x: int, y: int, width: int, height: int):
    labels = PERCENTILES.get(kind, PERCENTILES["default"])
    top = y + 14
    step = max(14, min(18, (height - 24) // max(1, len(labels) - 1)))
    for index, label in enumerate(labels):
        draw.text((sx(x + width + 8), sx(top + index * step - 4)), label, font=PERCENTILE_FONT, fill=PERCENTILE)


def render_chart(chart: dict) -> Image.Image:
    image = Image.new("RGB", (sx(CANVAS_WIDTH), sx(TOTAL_HEIGHT)), BG)
    draw = ImageDraw.Draw(image)

    panel_count = len(chart["panels"])
    total_panel_width = panel_count * PANEL_WIDTH + (panel_count - 1) * PANEL_GAP
    start_x = (CANVAS_WIDTH - total_panel_width) // 2

    for index, panel in enumerate(chart["panels"]):
        x = start_x + index * (PANEL_WIDTH + PANEL_GAP)
        draw_axes(draw, x, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT, panel)
        for points, color, width_px in build_curves(panel["kind"], x, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT):
          draw.line(points, fill=color, width=width_px, joint="curve")
        draw_percentiles(draw, panel["kind"], x, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT)

    return image


def main() -> None:
    output_dir = Path("app/assets/iap-official-png")
    output_dir.mkdir(parents=True, exist_ok=True)

    for chart in CHARTS:
        output_name = chart["filename"].replace(".svg", ".png")
        output_path = output_dir / output_name
        render_chart(chart).save(output_path, format="PNG", optimize=True)
        print(f"Saved {output_path}")


if __name__ == "__main__":
    main()
