from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUTPUT_DIR = Path("app/assets/nellhaus-official-png")
SCALE = 4
CANVAS_WIDTH = 260
CANVAS_HEIGHT = 188
PLOT_X = 45
PLOT_Y = 22
PLOT_WIDTH = 170
PLOT_HEIGHT = 140
X_MIN = 5
X_MAX = 18
Y_MIN = 45
Y_MAX = 60

BG = "#ffffff"
AXIS = "#111111"
TICK = "#666666"
LABEL = "#222222"
CURVE = "#8a8f96"
MEDIAN = "#222222"
PERCENTILE = "#444444"

# Digitized from Nellhaus head circumference charts reproduced in the
# University of Washington FAS Diagnostic & Prevention Network guide.
NELLHAUS_CURVES = {
    "boys": {
        "+2SD": [(5, 54.0), (6, 54.1), (8, 55.2), (10, 56.0), (12, 56.7), (14, 57.4), (16, 57.8), (18, 58.1)],
        "Mean": [(5, 51.5), (6, 52.0), (8, 52.8), (10, 53.4), (12, 54.0), (14, 55.0), (16, 55.8), (18, 55.8)],
        "-2SD": [(5, 48.7), (6, 49.0), (8, 49.8), (10, 49.8), (12, 50.8), (14, 51.8), (16, 52.8), (18, 53.0)],
    },
    "girls": {
        "+2SD": [(5, 53.0), (6, 53.2), (8, 54.2), (10, 54.6), (12, 55.5), (14, 56.8), (16, 56.9), (18, 57.3)],
        "Mean": [(5, 50.0), (6, 50.5), (8, 51.5), (10, 51.8), (12, 52.8), (14, 54.0), (16, 54.7), (18, 55.0)],
        "-2SD": [(5, 48.0), (6, 48.0), (8, 49.2), (10, 49.3), (12, 50.0), (14, 51.0), (16, 52.0), (18, 52.0)],
    },
}


def sx(value: int | float) -> int:
    return round(value * SCALE)


def load_font(size: int, *, bold: bool = False) -> ImageFont.ImageFont:
    names = ("arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf") if bold else ("arial.ttf", "Arial.ttf", "DejaVuSans.ttf")
    for name in names:
        try:
            return ImageFont.truetype(name, sx(size))
        except OSError:
            continue
    return ImageFont.load_default()


LABEL_FONT = load_font(9, bold=True)
PERCENTILE_FONT = load_font(8, bold=True)


def map_point(age: float, value: float) -> tuple[int, int]:
    x_ratio = (age - X_MIN) / (X_MAX - X_MIN)
    y_ratio = (value - Y_MIN) / (Y_MAX - Y_MIN)
    x = PLOT_X + PLOT_WIDTH * x_ratio
    y = PLOT_Y + PLOT_HEIGHT - PLOT_HEIGHT * y_ratio
    return sx(x), sx(y)


def text_center(draw: ImageDraw.ImageDraw, xy, text: str, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    draw.text((xy[0] - (bbox[2] - bbox[0]) / 2, xy[1] - (bbox[3] - bbox[1]) / 2), text, font=font, fill=fill)


def text_right(draw: ImageDraw.ImageDraw, xy, text: str, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    draw.text((xy[0] - (bbox[2] - bbox[0]), xy[1] - (bbox[3] - bbox[1]) / 2), text, font=font, fill=fill)


def draw_axes(draw: ImageDraw.ImageDraw) -> None:
    draw.line(
        [(sx(PLOT_X), sx(PLOT_Y)), (sx(PLOT_X), sx(PLOT_Y + PLOT_HEIGHT)), (sx(PLOT_X + PLOT_WIDTH), sx(PLOT_Y + PLOT_HEIGHT))],
        fill=AXIS,
        width=sx(1),
    )
    for value in [5, 8, 11, 14, 18]:
        x, _ = map_point(value, Y_MIN)
        draw.line([(x, sx(PLOT_Y + PLOT_HEIGHT)), (x, sx(PLOT_Y + PLOT_HEIGHT - 6))], fill=TICK, width=sx(1))
        text_center(draw, (x, sx(PLOT_Y + PLOT_HEIGHT + 16)), f"{value}y", LABEL_FONT, LABEL)

    for value in [60, 55, 50, 45]:
        _, y = map_point(X_MIN, value)
        draw.line([(sx(PLOT_X), y), (sx(PLOT_X + 6), y)], fill=TICK, width=sx(1))
        text_right(draw, (sx(PLOT_X - 6), y), str(value), LABEL_FONT, LABEL)


def render_chart(sex: str, filename: str) -> None:
    image = Image.new("RGB", (sx(CANVAS_WIDTH), sx(CANVAS_HEIGHT)), BG)
    draw = ImageDraw.Draw(image)
    draw_axes(draw)

    for label, rows in NELLHAUS_CURVES[sex].items():
        points = [map_point(age, value) for age, value in rows]
        draw.line(points, fill=MEDIAN if label == "Mean" else CURVE, width=sx(1), joint="curve")
        text_x, text_y = points[-1]
        draw.text((text_x + sx(8), text_y - sx(4)), label, font=PERCENTILE_FONT, fill=PERCENTILE)

    output_path = OUTPUT_DIR / filename
    image.save(output_path, optimize=True)
    print(f"Saved {output_path}")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    render_chart("boys", "boys-ofc-5-18-nellhaus.png")
    render_chart("girls", "girls-ofc-5-18-nellhaus.png")


if __name__ == "__main__":
    main()
