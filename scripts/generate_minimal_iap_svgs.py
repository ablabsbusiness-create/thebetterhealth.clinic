from __future__ import annotations

from pathlib import Path


STYLE = """
  <style>
    .axis { stroke: #111; stroke-width: 1.8; fill: none; }
    .tick { stroke: #666; stroke-width: 1; }
    .label { fill: #222; font: 11px Arial, sans-serif; }
    .ylabel { fill: #222; font: 11px Arial, sans-serif; text-anchor: end; }
    .curve { fill: none; stroke: #8a8f96; stroke-width: 1.5; stroke-linecap: round; }
    .median { fill: none; stroke: #222; stroke-width: 2.1; stroke-linecap: round; }
    .percentile { fill: #444; font: 700 9px Arial, sans-serif; }
  </style>
""".strip()


CHARTS = [
    {
        "filename": "boys-height-0-5-minimal.svg",
        "title": "WHO Boys Height 0-5 years",
        "panels": [{"kind": "height", "age_mode": "months", "sex": "Boys"}],
    },
    {
        "filename": "boys-weight-0-5-minimal.svg",
        "title": "WHO Boys Weight 0-5 years",
        "panels": [{"kind": "weight", "age_mode": "months", "sex": "Boys"}],
    },
    {
        "filename": "boys-head-0-5-minimal.svg",
        "title": "WHO Boys Head Circumference 0-5 years",
        "panels": [{"kind": "head", "age_mode": "months", "sex": "Boys"}],
    },
    {
        "filename": "boys-bmi-0-5-minimal.svg",
        "title": "WHO Boys BMI 0-5 years",
        "panels": [{"kind": "bmi_small", "age_mode": "months", "sex": "Boys"}],
    },
    {
        "filename": "boys-weight-for-height-0-5-minimal.svg",
        "title": "WHO Boys Weight-for-Height 0-5 years",
        "panels": [{"kind": "weight_for_height", "age_mode": "height", "sex": "Boys"}],
    },
    {
        "filename": "boys-height-5-18-minimal.svg",
        "title": "IAP Boys Height 5-18 years",
        "panels": [{"kind": "height", "age_mode": "years", "sex": "Boys"}],
    },
    {
        "filename": "boys-weight-5-18-minimal.svg",
        "title": "IAP Boys Weight 5-18 years",
        "panels": [{"kind": "weight", "age_mode": "years", "sex": "Boys"}],
    },
    {
        "filename": "boys-head-5-18-minimal.svg",
        "title": "IAP Boys OFC 5-18 years",
        "panels": [{"kind": "head_teen", "age_mode": "years", "sex": "Boys"}],
    },
    {
        "filename": "boys-waist-circumference-minimal.svg",
        "title": "Indian Boys Waist Circumference",
        "panels": [{"kind": "waist", "age_mode": "years", "sex": "Boys"}],
    },
    {
        "filename": "boys-extended-bmi-minimal.svg",
        "title": "IAP Boys Extended BMI Charts",
        "panels": [{"kind": "extended_bmi", "age_mode": "years_long", "sex": "Boys"}],
    },
    {
        "filename": "girls-height-0-5-minimal.svg",
        "title": "WHO Girls Height 0-5 years",
        "panels": [{"kind": "height", "age_mode": "months", "sex": "Girls"}],
    },
    {
        "filename": "girls-weight-0-5-minimal.svg",
        "title": "WHO Girls Weight 0-5 years",
        "panels": [{"kind": "weight", "age_mode": "months", "sex": "Girls"}],
    },
    {
        "filename": "girls-head-0-5-minimal.svg",
        "title": "WHO Girls Head Circumference 0-5 years",
        "panels": [{"kind": "head", "age_mode": "months", "sex": "Girls"}],
    },
    {
        "filename": "girls-bmi-0-5-minimal.svg",
        "title": "WHO Girls BMI 0-5 years",
        "panels": [{"kind": "bmi_small", "age_mode": "months", "sex": "Girls"}],
    },
    {
        "filename": "girls-weight-for-height-0-5-minimal.svg",
        "title": "WHO Girls Weight-for-Height 0-5 years",
        "panels": [{"kind": "weight_for_height", "age_mode": "height", "sex": "Girls"}],
    },
    {
        "filename": "girls-height-5-18-minimal.svg",
        "title": "IAP Girls Height 5-18 years",
        "panels": [{"kind": "height", "age_mode": "years", "sex": "Girls"}],
    },
    {
        "filename": "girls-weight-5-18-minimal.svg",
        "title": "IAP Girls Weight 5-18 years",
        "panels": [{"kind": "weight", "age_mode": "years", "sex": "Girls"}],
    },
    {
        "filename": "girls-head-5-18-minimal.svg",
        "title": "IAP Girls OFC 5-18 years",
        "panels": [{"kind": "head_teen", "age_mode": "years", "sex": "Girls"}],
    },
    {
        "filename": "girls-waist-circumference-minimal.svg",
        "title": "Indian Girls Waist Circumference",
        "panels": [{"kind": "waist", "age_mode": "years", "sex": "Girls"}],
    },
    {
        "filename": "girls-extended-bmi-minimal.svg",
        "title": "IAP Girls Extended BMI Charts",
        "panels": [{"kind": "extended_bmi", "age_mode": "years_long", "sex": "Girls"}],
    },
    {
        "filename": "boys-bmi-5-18-minimal.svg",
        "title": "IAP Boys BMI Chart 5-18 years",
        "panels": [{"kind": "bmi", "age_mode": "years", "sex": "Boys"}],
    },
    {
        "filename": "girls-bmi-5-18-minimal.svg",
        "title": "IAP Girls BMI Chart 5-18 years",
        "panels": [{"kind": "bmi", "age_mode": "years", "sex": "Girls"}],
    },
]


Y_AXIS = {
    "height": ["180", "140", "100", "60"],
    "weight": ["75", "50", "25", "5"],
    "head": ["57", "53", "49", "45"],
    "head_teen": ["57", "55", "53", "51", "49"],
    "bmi": ["35", "25", "20", "15", "10"],
    "bmi_small": ["22", "18", "14", "10"],
    "extended_bmi": ["45", "35", "25", "15"],
    "waist": ["95", "80", "65", "50"],
    "weight_for_height": ["28", "20", "12", "4"],
}

X_AXIS = {
    "months": ["0m", "12m", "24m", "36m", "48m", "60m"],
    "years": ["5y", "8y", "11y", "14y", "18y"],
    "years_long": ["0y", "4y", "8y", "12y", "18y"],
    "height": ["45", "60", "75", "90", "105", "110"],
}

PERCENTILES = {
    "default": ["P97", "P75", "P50", "P25"],
    "bmi": ["P97", "P75", "P50", "P25", "P3"],
    "extended_bmi": ["P99", "P97", "P85", "P50"],
    "waist": ["P95", "P75", "P50", "P10"],
}


def build_curves(kind: str, x: int, y: int, width: int, height: int) -> list[str]:
    right = x + width
    bottom = y + height
    if kind == "height":
        return [
            f'<path class="curve" d="M{x} {bottom-22} C{x+28} {bottom-92}, {x+88} {bottom-136}, {right} {y+10}"/>',
            f'<path class="curve" d="M{x} {bottom-16} C{x+28} {bottom-74}, {x+88} {bottom-116}, {right} {y+28}"/>',
            f'<path class="median" d="M{x} {bottom-9} C{x+28} {bottom-58}, {x+88} {bottom-96}, {right} {y+44}"/>',
            f'<path class="curve" d="M{x} {bottom-2} C{x+28} {bottom-42}, {x+88} {bottom-78}, {right} {y+58}"/>',
        ]
    if kind == "weight":
        return [
            f'<path class="curve" d="M{x} {bottom-26} C{x+34} {bottom-104}, {x+92} {bottom-132}, {right} {y+16}"/>',
            f'<path class="curve" d="M{x} {bottom-18} C{x+34} {bottom-88}, {x+92} {bottom-114}, {right} {y+34}"/>',
            f'<path class="median" d="M{x} {bottom-10} C{x+34} {bottom-72}, {x+92} {bottom-98}, {right} {y+52}"/>',
            f'<path class="curve" d="M{x} {bottom-1} C{x+34} {bottom-58}, {x+92} {bottom-82}, {right} {y+68}"/>',
        ]
    if kind == "head":
        return [
            f'<path class="curve" d="M{x} {bottom-36} C{x+32} {bottom-62}, {x+90} {bottom-76}, {right} {y+24}"/>',
            f'<path class="curve" d="M{x} {bottom-28} C{x+32} {bottom-52}, {x+90} {bottom-65}, {right} {y+37}"/>',
            f'<path class="median" d="M{x} {bottom-20} C{x+32} {bottom-42}, {x+90} {bottom-54}, {right} {y+50}"/>',
            f'<path class="curve" d="M{x} {bottom-12} C{x+32} {bottom-34}, {x+90} {bottom-44}, {right} {y+63}"/>',
        ]
    if kind == "head_teen":
        return [
            f'<path class="curve" d="M{x} {bottom-44} C{x+32} {bottom-62}, {x+90} {bottom-76}, {right} {y+22}"/>',
            f'<path class="curve" d="M{x} {bottom-34} C{x+32} {bottom-50}, {x+90} {bottom-62}, {right} {y+34}"/>',
            f'<path class="median" d="M{x} {bottom-24} C{x+32} {bottom-40}, {x+90} {bottom-50}, {right} {y+46}"/>',
            f'<path class="curve" d="M{x} {bottom-14} C{x+32} {bottom-30}, {x+90} {bottom-40}, {right} {y+58}"/>',
            f'<path class="curve" d="M{x} {bottom-6} C{x+32} {bottom-22}, {x+90} {bottom-31}, {right} {y+70}"/>',
        ]
    if kind == "weight_for_height":
        return [
            f'<path class="curve" d="M{x} {bottom-28} C{x+48} {bottom-122}, {x+132} {bottom-128}, {right} {y+22}"/>',
            f'<path class="curve" d="M{x} {bottom-18} C{x+48} {bottom-104}, {x+132} {bottom-108}, {right} {y+38}"/>',
            f'<path class="median" d="M{x} {bottom-9} C{x+48} {bottom-86}, {x+132} {bottom-90}, {right} {y+56}"/>',
            f'<path class="curve" d="M{x} {bottom-1} C{x+48} {bottom-68}, {x+132} {bottom-72}, {right} {y+72}"/>',
        ]
    if kind in {"bmi", "extended_bmi", "bmi_small"}:
        return [
            f'<path class="curve" d="M{x} {y+62} C{x+56} {y+50}, {x+126} {y+26}, {right} {y+10}"/>',
            f'<path class="curve" d="M{x} {y+86} C{x+56} {y+74}, {x+126} {y+50}, {right} {y+34}"/>',
            f'<path class="median" d="M{x} {y+110} C{x+56} {y+98}, {x+126} {y+80}, {right} {y+58}"/>',
            f'<path class="curve" d="M{x} {y+132} C{x+56} {y+124}, {x+126} {y+106}, {right} {y+84}"/>',
            f'<path class="curve" d="M{x} {y+148} C{x+56} {y+142}, {x+126} {y+128}, {right} {y+106}"/>' if kind in {"bmi", "bmi_small"} else "",
        ]
    if kind == "waist":
        return [
            f'<path class="curve" d="M{x} {bottom-36} C{x+48} {bottom-88}, {x+122} {bottom-112}, {right} {y+22}"/>',
            f'<path class="curve" d="M{x} {bottom-24} C{x+48} {bottom-70}, {x+122} {bottom-92}, {right} {y+42}"/>',
            f'<path class="median" d="M{x} {bottom-12} C{x+48} {bottom-52}, {x+122} {bottom-72}, {right} {y+62}"/>',
            f'<path class="curve" d="M{x} {bottom-2} C{x+48} {bottom-38}, {x+122} {bottom-56}, {right} {y+80}"/>',
        ]
    return []


def draw_axes(x: int, y: int, width: int, height: int, panel: dict) -> str:
    parts = [
        f'<path class="axis" d="M{x} {y} V{y + height} H{x + width}"/>'
    ]
    x_labels = X_AXIS[panel["age_mode"]]
    for index, label in enumerate(x_labels):
        tick_x = x + round((width / max(1, len(x_labels) - 1)) * index)
        parts.append(f'<path class="tick" d="M{tick_x} {y + height} V{y + height - 6}"/>')
        parts.append(f'<text class="label" x="{tick_x - 10}" y="{y + height + 16}">{label}</text>')

    y_labels = Y_AXIS[panel["kind"]]
    for index, label in enumerate(y_labels):
        tick_y = y + round((height / max(1, len(y_labels) - 1)) * index)
        parts.append(f'<path class="tick" d="M{x} {tick_y} H{x + 6}"/>')
        parts.append(f'<text class="ylabel" x="{x - 6}" y="{tick_y + 4}">{label}</text>')

    return "\n".join(parts)


def draw_percentiles(kind: str, x: int, y: int, width: int) -> str:
    labels = PERCENTILES.get(kind, PERCENTILES["default"])
    top = y + 12
    return "\n".join(
        f'<text class="percentile" x="{x + width + 8}" y="{top + index * 18}">{label}</text>'
        for index, label in enumerate(labels)
    )


def render_chart(chart: dict) -> str:
    width = 260
    panel_gap = 20
    panel_width = 170
    panel_height = 140
    panel_y = 22
    total_height = panel_y + panel_height + 26

    svg_parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {total_height}" role="img" aria-label="{chart["title"]}">',
        STYLE,
        f'<rect x="0" y="0" width="{width}" height="{total_height}" fill="#fff"/>',
    ]

    panel_count = len(chart["panels"])
    total_panel_width = panel_count * panel_width + (panel_count - 1) * panel_gap
    start_x = (width - total_panel_width) // 2

    for index, panel in enumerate(chart["panels"]):
        x = start_x + index * (panel_width + panel_gap)
        svg_parts.append(draw_axes(x, panel_y, panel_width, panel_height, panel))
        svg_parts.extend(part for part in build_curves(panel["kind"], x, panel_y, panel_width, panel_height) if part)
        svg_parts.append(draw_percentiles(panel["kind"], x, panel_y, panel_width))

    svg_parts.append("</svg>")
    return "\n".join(svg_parts)


def main() -> None:
    output_dir = Path("app/assets/iap-official-minimal")
    output_dir.mkdir(parents=True, exist_ok=True)

    for chart in CHARTS:
        output_path = output_dir / chart["filename"]
        output_path.write_text(render_chart(chart), encoding="utf-8")
        print(f"Saved {output_path}")


if __name__ == "__main__":
    main()
