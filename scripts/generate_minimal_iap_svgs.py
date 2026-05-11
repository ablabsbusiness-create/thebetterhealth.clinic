from __future__ import annotations

from pathlib import Path


STYLE = """
  <style>
    .axis { stroke: #111; stroke-width: 1.8; fill: none; }
    .tick { stroke: #666; stroke-width: 1; }
    .label { fill: #222; font: 9.5px Arial, sans-serif; text-anchor: middle; }
    .ylabel { fill: #222; font: 9.5px Arial, sans-serif; text-anchor: end; }
    .curve { fill: none; stroke: #8a8f96; stroke-width: 1.5; stroke-linecap: round; }
    .median { fill: none; stroke: #222; stroke-width: 2.1; stroke-linecap: round; }
    .percentile { fill: #444; font: 700 8px Arial, sans-serif; }
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
    "bmi": ["35", "25", "20", "15", "10"],
    "bmi_small": ["22", "18", "14", "10"],
    "extended_bmi": ["45", "35", "25", "15"],
    "waist": ["95", "80", "65", "50"],
}

X_AXIS = {
    "months": ["0y", "1y", "2y", "3y", "4y", "5y"],
    "years": ["5y", "8y", "11y", "14y", "18y"],
    "years_long": ["0y", "4y", "8y", "12y", "18y"],
    "height": ["45", "60", "75", "90", "105", "110"],
}

PERCENTILES = {
    "default": ["P97", "P75", "P50", "P25"],
    "bmi": ["27 AE", "23 AE", "P50", "P25", "P10", "P5", "P3"],
    "bmi_small": ["P97", "P75", "P50", "P25", "P3"],
    "head_teen": ["P97", "P75", "P50", "P25", "P3"],
    "extended_bmi": ["P99", "P97", "P85", "P50"],
    "waist": ["P95", "P75", "P50", "P10"],
}


IAP_2015_PERCENTILES = {
    ("Boys", "height"): {
        "axis": {"x_min": 5, "x_max": 18, "y_min": 85, "y_max": 190},
        "columns": ["P3", "P10", "P25", "P50", "P75", "P90", "P97"],
        "rows": [
            (5.0, 99.0, 102.3, 105.6, 108.9, 112.4, 115.9, 119.4),
            (5.5, 101.6, 105.0, 108.4, 111.9, 115.4, 119.0, 122.7),
            (6.0, 104.2, 107.7, 111.2, 114.8, 118.5, 122.2, 126.0),
            (6.5, 106.8, 110.4, 114.0, 117.8, 121.6, 125.4, 129.3),
            (7.0, 109.3, 113.0, 116.8, 120.7, 124.6, 128.6, 132.6),
            (7.5, 111.8, 115.7, 119.6, 123.5, 127.6, 131.7, 135.9),
            (8.0, 114.3, 118.2, 122.3, 126.4, 130.5, 134.8, 139.1),
            (8.5, 116.7, 120.8, 124.9, 129.1, 133.4, 137.8, 142.2),
            (9.0, 119.0, 123.2, 127.5, 131.8, 136.3, 140.7, 145.3),
            (9.5, 121.3, 125.6, 130.0, 134.5, 139.1, 143.7, 148.3),
            (10.0, 123.6, 128.1, 132.6, 137.2, 141.9, 146.6, 151.4),
            (10.5, 125.9, 130.5, 135.2, 139.9, 144.7, 149.5, 154.4),
            (11.0, 128.2, 133.0, 137.8, 142.7, 147.6, 152.5, 157.5),
            (11.5, 130.7, 135.6, 140.6, 145.5, 150.5, 155.6, 160.6),
            (12.0, 133.2, 138.3, 143.3, 148.4, 153.5, 158.6, 163.7),
            (12.5, 135.7, 141.0, 146.2, 151.4, 156.5, 161.7, 166.8),
            (13.0, 138.3, 143.7, 149.0, 154.3, 159.5, 164.7, 169.9),
            (13.5, 140.9, 146.4, 151.8, 157.2, 162.4, 167.6, 172.7),
            (14.0, 143.4, 149.0, 154.5, 159.9, 165.1, 170.3, 175.4),
            (14.5, 145.8, 151.5, 157.0, 162.3, 167.6, 172.7, 177.7),
            (15.0, 148.0, 153.7, 159.2, 164.5, 169.7, 174.8, 179.7),
            (15.5, 150.0, 155.7, 161.2, 166.5, 171.6, 176.5, 181.4),
            (16.0, 151.8, 157.4, 162.9, 168.1, 173.1, 178.0, 182.7),
            (16.5, 153.4, 159.1, 164.5, 169.6, 174.5, 179.3, 183.8),
            (17.0, 155.0, 160.6, 165.9, 171.0, 175.8, 180.4, 184.8),
            (17.5, 156.6, 162.1, 167.3, 172.3, 177.0, 181.5, 185.8),
            (18.0, 158.1, 163.6, 168.7, 173.6, 178.2, 182.5, 186.7),
        ],
    },
    ("Boys", "weight"): {
        "axis": {"x_min": 5, "x_max": 18, "y_min": 0, "y_max": 90},
        "columns": ["P3", "P10", "P25", "P50", "P75", "P90", "P97"],
        "rows": [
            (5.0, 13.2, 14.3, 15.6, 17.1, 19.0, 21.3, 24.2),
            (5.5, 13.8, 15.0, 16.5, 18.2, 20.3, 22.9, 26.1),
            (6.0, 14.5, 15.8, 17.4, 19.3, 21.7, 24.6, 28.3),
            (6.5, 15.3, 16.8, 18.6, 20.7, 23.3, 26.6, 30.8),
            (7.0, 16.0, 17.6, 19.6, 21.9, 24.9, 28.6, 33.4),
            (7.5, 16.7, 18.5, 20.7, 23.3, 26.6, 30.8, 36.2),
            (8.0, 17.5, 19.5, 21.9, 24.8, 28.5, 33.2, 39.4),
            (8.5, 18.3, 20.5, 23.2, 26.4, 30.5, 35.7, 42.6),
            (9.0, 19.1, 21.5, 24.3, 27.9, 32.3, 38.0, 45.5),
            (9.5, 19.9, 22.4, 25.6, 29.4, 34.3, 40.5, 48.6),
            (10.0, 20.7, 23.5, 26.9, 31.1, 36.3, 43.0, 51.8),
            (10.5, 21.6, 24.6, 28.3, 32.8, 38.5, 45.8, 55.2),
            (11.0, 22.6, 25.9, 29.8, 34.7, 40.9, 48.7, 58.7),
            (11.5, 23.8, 27.3, 31.6, 36.9, 43.5, 51.8, 62.5),
            (12.0, 24.9, 28.7, 33.3, 39.0, 46.0, 54.8, 66.1),
            (12.5, 26.1, 30.2, 35.1, 41.2, 48.6, 57.8, 69.5),
            (13.0, 27.5, 31.8, 37.0, 43.3, 51.1, 60.7, 72.6),
            (13.5, 29.0, 33.6, 39.1, 45.7, 53.8, 63.6, 75.6),
            (14.0, 30.7, 35.5, 41.3, 48.2, 56.4, 66.3, 78.3),
            (14.5, 32.6, 37.7, 43.7, 50.8, 59.1, 69.1, 80.9),
            (15.0, 34.5, 39.8, 45.9, 53.1, 61.6, 71.5, 83.1),
            (15.5, 36.1, 41.6, 47.9, 55.2, 63.6, 73.4, 84.7),
            (16.0, 37.5, 43.1, 49.5, 56.8, 65.2, 74.8, 85.8),
            (16.5, 38.7, 44.4, 50.9, 58.2, 66.6, 76.1, 86.8),
            (17.0, 39.8, 45.6, 52.1, 59.5, 67.8, 77.1, 87.5),
            (17.5, 40.8, 46.7, 53.2, 60.6, 68.7, 77.8, 88.0),
            (18.0, 41.8, 47.7, 54.3, 61.6, 69.7, 78.6, 88.4),
        ],
    },
    ("Boys", "bmi"): {
        "axis": {"x_min": 5, "x_max": 18, "y_min": 10, "y_max": 35},
        "columns": ["P3", "P5", "P10", "P25", "P50", "AE23", "AE27"],
        "rows": [
            (5.0, 12.1, 12.4, 12.8, 13.6, 14.7, 15.7, 17.5),
            (5.5, 12.2, 12.4, 12.9, 13.7, 14.8, 15.8, 17.6),
            (6.0, 12.2, 12.5, 12.9, 13.7, 14.9, 16.0, 17.8),
            (6.5, 12.3, 12.5, 13.0, 13.8, 15.0, 16.1, 18.0),
            (7.0, 12.3, 12.6, 13.1, 13.9, 15.1, 16.3, 18.2),
            (7.5, 12.4, 12.7, 13.2, 14.1, 15.3, 16.5, 18.5),
            (8.0, 12.5, 12.8, 13.3, 14.2, 15.5, 16.7, 18.8),
            (8.5, 12.6, 12.9, 13.4, 14.4, 15.7, 17.0, 19.2),
            (9.0, 12.7, 13.0, 13.5, 14.5, 15.9, 17.3, 19.6),
            (9.5, 12.8, 13.1, 13.7, 14.7, 16.2, 17.6, 20.1),
            (10.0, 12.9, 13.2, 13.8, 14.9, 16.4, 18.0, 20.5),
            (10.5, 13.0, 13.3, 14.0, 15.1, 16.7, 18.3, 21.0),
            (11.0, 13.1, 13.5, 14.1, 15.4, 17.0, 18.7, 21.5),
            (11.5, 13.2, 13.6, 14.3, 15.6, 17.3, 19.1, 22.1),
            (12.0, 13.3, 13.8, 14.5, 15.8, 17.7, 19.5, 22.6),
            (12.5, 13.5, 13.9, 14.6, 16.0, 17.9, 19.8, 23.0),
            (13.0, 13.6, 14.0, 14.8, 16.3, 18.2, 20.2, 23.4),
            (13.5, 13.7, 14.2, 14.9, 16.5, 18.5, 20.5, 23.8),
            (14.0, 13.8, 14.3, 15.1, 16.7, 18.7, 20.8, 24.2),
            (14.5, 14.0, 14.5, 15.3, 16.9, 19.0, 21.1, 24.5),
            (15.0, 14.2, 14.7, 15.5, 17.2, 19.3, 21.4, 24.9),
            (15.5, 14.4, 14.9, 15.8, 17.4, 19.6, 21.7, 25.2),
            (16.0, 14.6, 15.1, 16.0, 17.7, 19.9, 22.0, 25.5),
            (16.5, 14.9, 15.4, 16.3, 18.0, 20.2, 22.4, 25.8),
            (17.0, 15.1, 15.6, 16.6, 18.3, 20.5, 22.6, 26.0),
            (17.5, 15.4, 15.9, 16.8, 18.6, 20.8, 22.9, 26.3),
            (18.0, 15.6, 16.2, 17.1, 18.9, 21.1, 23.2, 26.6),
        ],
    },
}

IAP_2015_PERCENTILES[("Girls", "height")] = {
    "axis": {"x_min": 5, "x_max": 18, "y_min": 80, "y_max": 180},
    "columns": IAP_2015_PERCENTILES[("Boys", "height")]["columns"],
    "rows": [
        (5.0, 97.2, 100.5, 103.9, 107.5, 111.3, 115.2, 119.3),
        (5.5, 99.8, 103.2, 106.8, 110.5, 114.4, 118.3, 122.5),
        (6.0, 102.3, 106.0, 109.7, 113.5, 117.4, 121.5, 125.6),
        (6.5, 104.9, 108.7, 112.5, 116.5, 120.5, 124.6, 128.7),
        (7.0, 107.4, 111.4, 115.4, 119.4, 123.5, 127.7, 131.9),
        (7.5, 110.0, 114.1, 118.2, 122.4, 126.6, 130.8, 135.0),
        (8.0, 112.6, 116.8, 121.1, 125.4, 129.6, 133.9, 138.1),
        (8.5, 115.2, 119.6, 124.0, 128.4, 132.7, 137.0, 141.3),
        (9.0, 117.8, 122.4, 126.9, 131.4, 135.8, 140.2, 144.5),
        (9.5, 120.5, 125.2, 129.9, 134.4, 138.9, 143.3, 147.6),
        (10.0, 123.3, 128.1, 132.8, 137.4, 142.0, 146.4, 150.8),
        (10.5, 126.1, 130.9, 135.7, 140.4, 145.0, 149.5, 153.9),
        (11.0, 128.8, 133.7, 138.6, 143.3, 147.9, 152.4, 156.8),
        (11.5, 131.5, 136.4, 141.2, 145.9, 150.6, 155.1, 159.6),
        (12.0, 134.0, 138.9, 143.7, 148.4, 153.0, 157.5, 162.0),
        (12.5, 136.3, 141.1, 145.8, 150.5, 155.1, 159.6, 164.1),
        (13.0, 138.2, 142.9, 147.6, 152.2, 156.8, 161.3, 165.9),
        (13.5, 139.9, 144.5, 149.1, 153.6, 158.2, 162.7, 167.2),
        (14.0, 141.3, 145.8, 150.2, 154.7, 159.2, 163.7, 168.2),
        (14.5, 142.4, 146.8, 151.1, 155.5, 160.0, 164.5, 169.0),
        (15.0, 143.3, 147.5, 151.8, 156.1, 160.5, 165.0, 169.5),
        (15.5, 144.1, 148.1, 152.3, 156.6, 160.9, 165.3, 169.8),
        (16.0, 144.7, 148.6, 152.7, 156.9, 161.2, 165.6, 170.1),
        (16.5, 145.2, 149.1, 153.1, 157.2, 161.4, 165.7, 170.2),
        (17.0, 145.7, 149.5, 153.4, 157.4, 161.6, 165.9, 170.4),
        (17.5, 146.2, 149.8, 153.6, 157.6, 161.7, 166.0, 170.5),
        (18.0, 146.6, 150.2, 153.9, 157.8, 161.9, 166.1, 170.6),
    ],
}

IAP_2015_PERCENTILES[("Girls", "weight")] = {
    "axis": {"x_min": 5, "x_max": 18, "y_min": 0, "y_max": 75},
    "columns": IAP_2015_PERCENTILES[("Boys", "weight")]["columns"],
    "rows": [
        (5.0, 12.3, 13.4, 14.8, 16.4, 18.5, 21.3, 25.0),
        (5.5, 13.0, 14.3, 15.7, 17.6, 19.9, 22.9, 27.0),
        (6.0, 13.7, 15.1, 16.7, 18.7, 21.3, 24.6, 29.1),
        (6.5, 14.4, 15.9, 17.7, 19.9, 22.7, 26.3, 31.2),
        (7.0, 15.1, 16.8, 18.7, 21.2, 24.2, 28.2, 33.4),
        (7.5, 15.9, 17.7, 19.9, 22.5, 25.9, 30.1, 35.7),
        (8.0, 16.7, 18.7, 21.1, 24.0, 27.6, 32.2, 38.1),
        (8.5, 17.5, 19.7, 22.3, 25.5, 29.5, 34.4, 40.7),
        (9.0, 18.5, 20.9, 23.7, 27.2, 31.5, 36.7, 43.4),
        (9.5, 19.5, 22.1, 25.3, 29.0, 33.6, 39.3, 46.3),
        (10.0, 20.7, 23.5, 26.9, 31.0, 36.0, 42.0, 49.4),
        (10.5, 22.0, 25.1, 28.8, 33.2, 38.4, 44.8, 52.6),
        (11.0, 23.3, 26.7, 30.7, 35.4, 41.0, 47.7, 55.9),
        (11.5, 24.8, 28.4, 32.6, 37.6, 43.6, 50.6, 59.1),
        (12.0, 26.2, 30.0, 34.5, 39.8, 46.0, 53.4, 62.1),
        (12.5, 27.6, 31.6, 36.3, 41.8, 48.2, 55.8, 64.8),
        (13.0, 28.9, 33.1, 37.9, 43.6, 50.2, 57.9, 67.1),
        (13.5, 30.2, 34.4, 39.4, 45.1, 51.8, 59.7, 69.0),
        (14.0, 31.3, 35.6, 40.6, 46.4, 53.2, 61.1, 70.4),
        (14.5, 32.3, 36.6, 41.7, 47.5, 54.3, 62.2, 71.4),
        (15.0, 33.1, 37.5, 42.5, 48.4, 55.1, 62.9, 72.1),
        (15.5, 34.0, 38.3, 43.3, 49.1, 55.8, 63.5, 72.5),
        (16.0, 34.7, 39.1, 44.0, 49.7, 56.3, 64.0, 72.8),
        (16.5, 35.5, 39.8, 44.7, 50.3, 56.9, 64.4, 73.1),
        (17.0, 36.2, 40.5, 45.3, 50.9, 57.3, 64.7, 73.3),
        (17.5, 36.9, 41.1, 46.0, 51.5, 57.8, 65.0, 73.4),
        (18.0, 37.6, 41.8, 46.6, 52.0, 58.2, 65.3, 73.5),
    ],
}

IAP_2015_PERCENTILES[("Girls", "bmi")] = {
    "axis": {"x_min": 5, "x_max": 18, "y_min": 10, "y_max": 35},
    "columns": IAP_2015_PERCENTILES[("Boys", "bmi")]["columns"],
    "rows": [
        (5.0, 11.9, 12.1, 12.5, 13.3, 14.3, 15.5, 18.0),
        (5.5, 11.9, 12.2, 12.6, 13.4, 14.4, 15.7, 18.3),
        (6.0, 12.0, 12.2, 12.7, 13.5, 14.5, 15.9, 18.6),
        (6.5, 12.1, 12.3, 12.8, 13.6, 14.7, 16.1, 18.9),
        (7.0, 12.1, 12.4, 12.8, 13.7, 14.9, 16.4, 19.3),
        (7.5, 12.2, 12.5, 12.9, 13.9, 15.1, 16.6, 19.7),
        (8.0, 12.3, 12.6, 13.1, 14.0, 15.3, 16.9, 20.1),
        (8.5, 12.3, 12.7, 13.2, 14.2, 15.6, 17.2, 20.5),
        (9.0, 12.4, 12.8, 13.3, 14.4, 15.8, 17.6, 21.0),
        (9.5, 12.5, 12.9, 13.5, 14.6, 16.1, 18.0, 21.4),
        (10.0, 12.7, 13.1, 13.7, 14.9, 16.5, 18.4, 21.9),
        (10.5, 12.8, 13.2, 13.9, 15.2, 16.8, 18.8, 22.5),
        (11.0, 13.0, 13.4, 14.1, 15.5, 17.2, 19.3, 23.0),
        (11.5, 13.2, 13.7, 14.4, 15.8, 17.6, 19.8, 23.6),
        (12.0, 13.4, 13.9, 14.7, 16.1, 18.0, 20.2, 24.1),
        (12.5, 13.7, 14.2, 15.0, 16.5, 18.4, 20.7, 24.7),
        (13.0, 13.9, 14.4, 15.2, 16.8, 18.8, 21.1, 25.2),
        (13.5, 14.1, 14.6, 15.5, 17.1, 19.1, 21.5, 25.6),
        (14.0, 14.3, 14.9, 15.7, 17.3, 19.4, 21.8, 25.9),
        (14.5, 14.5, 15.1, 16.0, 17.6, 19.7, 22.0, 26.2),
        (15.0, 14.7, 15.2, 16.1, 17.8, 19.9, 22.3, 26.3),
        (15.5, 14.9, 15.4, 16.3, 18.0, 20.1, 22.4, 26.4),
        (16.0, 15.0, 15.6, 16.5, 18.2, 20.3, 22.6, 26.5),
        (16.5, 15.2, 15.8, 16.7, 18.4, 20.4, 22.8, 26.6),
        (17.0, 15.4, 16.0, 16.9, 18.6, 20.6, 22.9, 26.7),
        (17.5, 15.5, 16.1, 17.1, 18.7, 20.8, 23.1, 26.7),
        (18.0, 15.7, 16.3, 17.3, 18.9, 21.0, 23.2, 26.8),
    ],
}

IAP_DISPLAY_COLUMNS = {
    "height": ["P97", "P75", "P50", "P25", "P3"],
    "weight": ["P97", "P75", "P50", "P25", "P3"],
    "bmi": ["AE27", "AE23", "P50", "P25", "P10", "P5", "P3"],
}


def map_reference_point(age: float, value: float, axis: dict, x: int, y: int, width: int, height: int) -> tuple[float, float]:
    x_ratio = (age - axis["x_min"]) / (axis["x_max"] - axis["x_min"])
    y_ratio = (value - axis["y_min"]) / (axis["y_max"] - axis["y_min"])
    return x + width * x_ratio, y + height - height * y_ratio


def reference_curve_path(reference: dict, column: str, x: int, y: int, width: int, height: int) -> str:
    column_index = reference["columns"].index(column) + 1
    points = [
        map_reference_point(row[0], row[column_index], reference["axis"], x, y, width, height)
        for row in reference["rows"]
    ]
    commands = [f"M{points[0][0]:.2f} {points[0][1]:.2f}"]
    commands.extend(f"L{point_x:.2f} {point_y:.2f}" for point_x, point_y in points[1:])
    return " ".join(commands)


def build_reference_curves(panel: dict, x: int, y: int, width: int, height: int) -> list[str]:
    if panel.get("age_mode") != "years":
        return []

    reference = IAP_2015_PERCENTILES.get((panel.get("sex", ""), panel["kind"]))
    if not reference:
        return []

    curves = []
    for column in IAP_DISPLAY_COLUMNS[panel["kind"]]:
        css_class = "median" if column == "P50" else "curve"
        curves.append(f'<path class="{css_class}" d="{reference_curve_path(reference, column, x, y, width, height)}"/>')
    return curves


def build_curves(panel: dict, x: int, y: int, width: int, height: int) -> list[str]:
    return build_reference_curves(panel, x, y, width, height)


def draw_axes(x: int, y: int, width: int, height: int, panel: dict) -> str:
    parts = [
        f'<path class="axis" d="M{x} {y} V{y + height} H{x + width}"/>'
    ]
    x_labels = X_AXIS[panel["age_mode"]]
    for index, label in enumerate(x_labels):
        tick_x = x + round((width / max(1, len(x_labels) - 1)) * index)
        parts.append(f'<path class="tick" d="M{tick_x} {y + height} V{y + height - 6}"/>')
        parts.append(f'<text class="label" x="{tick_x}" y="{y + height + 16}">{label}</text>')

    y_labels = get_y_labels(panel)
    for index, label in enumerate(y_labels):
        tick_y = y + round((height / max(1, len(y_labels) - 1)) * index)
        parts.append(f'<path class="tick" d="M{x} {tick_y} H{x + 6}"/>')
        parts.append(f'<text class="ylabel" x="{x - 6}" y="{tick_y + 4}">{label}</text>')

    return "\n".join(parts)


def get_y_labels(panel: dict) -> list[str]:
    kind = panel["kind"]
    age_mode = panel["age_mode"]
    sex = panel.get("sex", "")

    if kind == "height" and age_mode == "months":
        return ["130", "110", "90", "70", "45"]
    if kind == "height" and sex == "Boys":
        return ["185", "160", "135", "110", "85"]
    if kind == "height":
        return ["180", "155", "130", "105", "80"]
    if kind == "weight" and age_mode == "months":
        return ["25", "20", "15", "10", "5", "0"]
    if kind == "weight" and sex == "Boys":
        return ["90", "75", "50", "25", "0"]
    if kind == "weight":
        return ["75", "50", "25", "0"]
    if kind == "head":
        return ["55", "50", "45", "40", "35"]
    if kind == "head_teen":
        return ["57", "54", "51", "48", "45"]
    if kind == "weight_for_height":
        return ["28", "21", "14", "7", "0"]

    return Y_AXIS[kind]


def get_percentile_labels(panel: dict) -> list[str]:
    if panel.get("age_mode") == "years" and (panel.get("sex", ""), panel["kind"]) in IAP_2015_PERCENTILES:
        return IAP_DISPLAY_COLUMNS[panel["kind"]]
    return []


def draw_percentiles(panel: dict, x: int, y: int, width: int, height: int) -> str:
    labels = get_percentile_labels(panel)
    top = y + 14
    step = max(14, min(18, (height - 24) // max(1, len(labels) - 1)))
    return "\n".join(
        f'<text class="percentile" x="{x + width + 8}" y="{top + index * step}">{label}</text>'
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
        clip_id = f'clip-{chart["filename"].replace(".", "-")}-{index}'
        svg_parts.append(f'<defs><clipPath id="{clip_id}"><rect x="{x}" y="{panel_y}" width="{panel_width}" height="{panel_height}"/></clipPath></defs>')
        svg_parts.append(draw_axes(x, panel_y, panel_width, panel_height, panel))
        curve_parts = [part for part in build_curves(panel, x, panel_y, panel_width, panel_height) if part]
        if curve_parts:
            svg_parts.append(f'<g clip-path="url(#{clip_id})">')
            svg_parts.extend(curve_parts)
            svg_parts.append('</g>')
        svg_parts.append(draw_percentiles(panel, x, panel_y, panel_width, panel_height))

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
