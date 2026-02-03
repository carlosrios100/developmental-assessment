"""Cutoff scores by age and domain (based on ASQ-3 normative data).

Ported from packages/shared/src/data/scoring.ts - all 105 entries.
"""

# Keyed by (age_months, domain) -> {cutoff, monitoring, mean, std}
CUTOFF_SCORES: dict[tuple[int, str], dict[str, float]] = {
    # 2 Month Cutoffs
    (2, "communication"): {"cutoff": 20.12, "monitoring": 32.45, "mean": 44.78, "std": 12.33},
    (2, "gross_motor"): {"cutoff": 25.88, "monitoring": 38.62, "mean": 51.36, "std": 12.74},
    (2, "fine_motor"): {"cutoff": 22.45, "monitoring": 35.78, "mean": 49.11, "std": 13.33},
    (2, "problem_solving"): {"cutoff": 24.56, "monitoring": 37.23, "mean": 49.90, "std": 12.67},
    (2, "personal_social"): {"cutoff": 23.78, "monitoring": 36.45, "mean": 49.12, "std": 12.67},
    # 4 Month Cutoffs
    (4, "communication"): {"cutoff": 18.45, "monitoring": 31.23, "mean": 44.01, "std": 12.78},
    (4, "gross_motor"): {"cutoff": 22.34, "monitoring": 35.67, "mean": 49.00, "std": 13.33},
    (4, "fine_motor"): {"cutoff": 25.67, "monitoring": 38.12, "mean": 50.57, "std": 12.45},
    (4, "problem_solving"): {"cutoff": 23.89, "monitoring": 36.78, "mean": 49.67, "std": 12.89},
    (4, "personal_social"): {"cutoff": 24.12, "monitoring": 37.01, "mean": 49.90, "std": 12.89},
    # 6 Month Cutoffs
    (6, "communication"): {"cutoff": 16.78, "monitoring": 29.89, "mean": 43.00, "std": 13.11},
    (6, "gross_motor"): {"cutoff": 20.45, "monitoring": 33.78, "mean": 47.11, "std": 13.33},
    (6, "fine_motor"): {"cutoff": 26.78, "monitoring": 39.12, "mean": 51.46, "std": 12.34},
    (6, "problem_solving"): {"cutoff": 24.56, "monitoring": 37.23, "mean": 49.90, "std": 12.67},
    (6, "personal_social"): {"cutoff": 22.89, "monitoring": 35.78, "mean": 48.67, "std": 12.89},
    # 8 Month Cutoffs
    (8, "communication"): {"cutoff": 15.23, "monitoring": 28.12, "mean": 41.01, "std": 12.89},
    (8, "gross_motor"): {"cutoff": 19.78, "monitoring": 33.12, "mean": 46.46, "std": 13.34},
    (8, "fine_motor"): {"cutoff": 27.12, "monitoring": 39.45, "mean": 51.78, "std": 12.33},
    (8, "problem_solving"): {"cutoff": 24.89, "monitoring": 37.56, "mean": 50.23, "std": 12.67},
    (8, "personal_social"): {"cutoff": 22.34, "monitoring": 35.23, "mean": 48.12, "std": 12.89},
    # 9 Month Cutoffs
    (9, "communication"): {"cutoff": 15.45, "monitoring": 28.34, "mean": 41.23, "std": 12.89},
    (9, "gross_motor"): {"cutoff": 20.12, "monitoring": 33.56, "mean": 47.00, "std": 13.44},
    (9, "fine_motor"): {"cutoff": 27.45, "monitoring": 39.67, "mean": 51.89, "std": 12.22},
    (9, "problem_solving"): {"cutoff": 25.01, "monitoring": 37.67, "mean": 50.33, "std": 12.66},
    (9, "personal_social"): {"cutoff": 22.45, "monitoring": 35.34, "mean": 48.23, "std": 12.89},
    # 10 Month Cutoffs
    (10, "communication"): {"cutoff": 15.56, "monitoring": 28.45, "mean": 41.34, "std": 12.89},
    (10, "gross_motor"): {"cutoff": 20.89, "monitoring": 34.23, "mean": 47.57, "std": 13.34},
    (10, "fine_motor"): {"cutoff": 27.67, "monitoring": 39.78, "mean": 51.89, "std": 12.11},
    (10, "problem_solving"): {"cutoff": 25.12, "monitoring": 37.78, "mean": 50.44, "std": 12.66},
    (10, "personal_social"): {"cutoff": 22.56, "monitoring": 35.45, "mean": 48.34, "std": 12.89},
    # 12 Month Cutoffs
    (12, "communication"): {"cutoff": 15.64, "monitoring": 28.52, "mean": 41.4, "std": 12.88},
    (12, "gross_motor"): {"cutoff": 21.93, "monitoring": 35.18, "mean": 48.43, "std": 13.25},
    (12, "fine_motor"): {"cutoff": 27.82, "monitoring": 39.49, "mean": 51.16, "std": 11.67},
    (12, "problem_solving"): {"cutoff": 25.21, "monitoring": 37.74, "mean": 50.27, "std": 12.53},
    (12, "personal_social"): {"cutoff": 22.45, "monitoring": 35.67, "mean": 48.89, "std": 13.22},
    # 14 Month Cutoffs
    (14, "communication"): {"cutoff": 15.12, "monitoring": 28.01, "mean": 40.90, "std": 12.89},
    (14, "gross_motor"): {"cutoff": 30.45, "monitoring": 41.23, "mean": 52.01, "std": 10.78},
    (14, "fine_motor"): {"cutoff": 28.89, "monitoring": 40.12, "mean": 51.35, "std": 11.23},
    (14, "problem_solving"): {"cutoff": 25.45, "monitoring": 37.89, "mean": 50.33, "std": 12.44},
    (14, "personal_social"): {"cutoff": 24.12, "monitoring": 37.01, "mean": 49.90, "std": 12.89},
    # 16 Month Cutoffs
    (16, "communication"): {"cutoff": 14.98, "monitoring": 27.85, "mean": 40.72, "std": 12.87},
    (16, "gross_motor"): {"cutoff": 33.12, "monitoring": 43.56, "mean": 54.00, "std": 10.44},
    (16, "fine_motor"): {"cutoff": 29.78, "monitoring": 40.67, "mean": 51.56, "std": 10.89},
    (16, "problem_solving"): {"cutoff": 25.67, "monitoring": 38.12, "mean": 50.57, "std": 12.45},
    (16, "personal_social"): {"cutoff": 25.34, "monitoring": 38.01, "mean": 50.68, "std": 12.67},
    # 18 Month Cutoffs
    (18, "communication"): {"cutoff": 14.85, "monitoring": 27.68, "mean": 40.51, "std": 12.83},
    (18, "gross_motor"): {"cutoff": 35.16, "monitoring": 45.27, "mean": 55.38, "std": 10.11},
    (18, "fine_motor"): {"cutoff": 30.71, "monitoring": 41.25, "mean": 51.79, "std": 10.54},
    (18, "problem_solving"): {"cutoff": 25.84, "monitoring": 38.33, "mean": 50.82, "std": 12.49},
    (18, "personal_social"): {"cutoff": 26.45, "monitoring": 38.92, "mean": 51.39, "std": 12.47},
    # 20 Month Cutoffs
    (20, "communication"): {"cutoff": 16.45, "monitoring": 29.78, "mean": 43.11, "std": 13.33},
    (20, "gross_motor"): {"cutoff": 35.45, "monitoring": 45.12, "mean": 54.79, "std": 9.67},
    (20, "fine_motor"): {"cutoff": 30.67, "monitoring": 41.45, "mean": 52.23, "std": 10.78},
    (20, "problem_solving"): {"cutoff": 26.89, "monitoring": 39.23, "mean": 51.57, "std": 12.34},
    (20, "personal_social"): {"cutoff": 28.45, "monitoring": 40.12, "mean": 51.79, "std": 11.67},
    # 22 Month Cutoffs
    (22, "communication"): {"cutoff": 17.89, "monitoring": 31.23, "mean": 44.57, "std": 13.34},
    (22, "gross_motor"): {"cutoff": 36.12, "monitoring": 45.67, "mean": 55.22, "std": 9.55},
    (22, "fine_motor"): {"cutoff": 31.12, "monitoring": 41.89, "mean": 52.66, "std": 10.77},
    (22, "problem_solving"): {"cutoff": 27.45, "monitoring": 39.78, "mean": 52.11, "std": 12.33},
    (22, "personal_social"): {"cutoff": 29.34, "monitoring": 40.89, "mean": 52.44, "std": 11.55},
    # 24 Month Cutoffs
    (24, "communication"): {"cutoff": 19.52, "monitoring": 32.97, "mean": 46.42, "std": 13.45},
    (24, "gross_motor"): {"cutoff": 36.71, "monitoring": 46.03, "mean": 55.35, "std": 9.32},
    (24, "fine_motor"): {"cutoff": 31.52, "monitoring": 42.18, "mean": 52.84, "std": 10.66},
    (24, "problem_solving"): {"cutoff": 27.98, "monitoring": 40.12, "mean": 52.26, "std": 12.14},
    (24, "personal_social"): {"cutoff": 30.25, "monitoring": 41.87, "mean": 53.49, "std": 11.62},
    # 27 Month Cutoffs
    (27, "communication"): {"cutoff": 22.34, "monitoring": 35.67, "mean": 49.00, "std": 13.33},
    (27, "gross_motor"): {"cutoff": 36.89, "monitoring": 46.23, "mean": 55.57, "std": 9.34},
    (27, "fine_motor"): {"cutoff": 29.45, "monitoring": 40.78, "mean": 52.11, "std": 11.33},
    (27, "problem_solving"): {"cutoff": 28.67, "monitoring": 40.89, "mean": 53.11, "std": 12.22},
    (27, "personal_social"): {"cutoff": 32.12, "monitoring": 43.45, "mean": 54.78, "std": 11.33},
    # 30 Month Cutoffs
    (30, "communication"): {"cutoff": 25.67, "monitoring": 38.12, "mean": 50.57, "std": 12.45},
    (30, "gross_motor"): {"cutoff": 36.78, "monitoring": 46.12, "mean": 55.46, "std": 9.34},
    (30, "fine_motor"): {"cutoff": 28.34, "monitoring": 39.89, "mean": 51.44, "std": 11.55},
    (30, "problem_solving"): {"cutoff": 29.45, "monitoring": 41.67, "mean": 53.89, "std": 12.22},
    (30, "personal_social"): {"cutoff": 33.56, "monitoring": 44.23, "mean": 54.90, "std": 10.67},
    # 33 Month Cutoffs
    (33, "communication"): {"cutoff": 28.12, "monitoring": 40.34, "mean": 52.56, "std": 12.22},
    (33, "gross_motor"): {"cutoff": 36.78, "monitoring": 46.12, "mean": 55.46, "std": 9.34},
    (33, "fine_motor"): {"cutoff": 27.89, "monitoring": 39.56, "mean": 51.23, "std": 11.67},
    (33, "problem_solving"): {"cutoff": 30.34, "monitoring": 42.23, "mean": 54.12, "std": 11.89},
    (33, "personal_social"): {"cutoff": 34.23, "monitoring": 44.78, "mean": 55.33, "std": 10.55},
    # 36 Month Cutoffs
    (36, "communication"): {"cutoff": 30.66, "monitoring": 42.12, "mean": 53.58, "std": 11.46},
    (36, "gross_motor"): {"cutoff": 36.82, "monitoring": 46.27, "mean": 55.72, "std": 9.45},
    (36, "fine_motor"): {"cutoff": 27.56, "monitoring": 39.44, "mean": 51.32, "std": 11.88},
    (36, "problem_solving"): {"cutoff": 31.24, "monitoring": 42.87, "mean": 54.50, "std": 11.63},
    (36, "personal_social"): {"cutoff": 35.16, "monitoring": 45.33, "mean": 55.50, "std": 10.17},
    # 42 Month Cutoffs
    (42, "communication"): {"cutoff": 35.78, "monitoring": 46.12, "mean": 56.46, "std": 10.34},
    (42, "gross_motor"): {"cutoff": 36.45, "monitoring": 46.23, "mean": 56.01, "std": 9.78},
    (42, "fine_motor"): {"cutoff": 29.12, "monitoring": 40.89, "mean": 52.66, "std": 11.77},
    (42, "problem_solving"): {"cutoff": 31.12, "monitoring": 43.01, "mean": 54.90, "std": 11.89},
    (42, "personal_social"): {"cutoff": 37.45, "monitoring": 47.12, "mean": 56.79, "std": 9.67},
    # 48 Month Cutoffs
    (48, "communication"): {"cutoff": 40.71, "monitoring": 49.52, "mean": 58.33, "std": 8.81},
    (48, "gross_motor"): {"cutoff": 35.88, "monitoring": 46.16, "mean": 56.44, "std": 10.28},
    (48, "fine_motor"): {"cutoff": 30.51, "monitoring": 42.09, "mean": 53.67, "std": 11.58},
    (48, "problem_solving"): {"cutoff": 30.93, "monitoring": 43.13, "mean": 55.33, "std": 12.20},
    (48, "personal_social"): {"cutoff": 39.52, "monitoring": 48.27, "mean": 57.02, "std": 8.75},
    # 54 Month Cutoffs
    (54, "communication"): {"cutoff": 41.89, "monitoring": 50.45, "mean": 59.01, "std": 8.56},
    (54, "gross_motor"): {"cutoff": 38.12, "monitoring": 47.67, "mean": 57.22, "std": 9.55},
    (54, "fine_motor"): {"cutoff": 29.67, "monitoring": 41.89, "mean": 54.11, "std": 12.22},
    (54, "problem_solving"): {"cutoff": 33.12, "monitoring": 44.78, "mean": 56.44, "std": 11.66},
    (54, "personal_social"): {"cutoff": 40.23, "monitoring": 49.01, "mean": 57.79, "std": 8.78},
    # 60 Month Cutoffs
    (60, "communication"): {"cutoff": 42.88, "monitoring": 51.16, "mean": 59.44, "std": 8.28},
    (60, "gross_motor"): {"cutoff": 40.27, "monitoring": 49.13, "mean": 57.99, "std": 8.86},
    (60, "fine_motor"): {"cutoff": 28.72, "monitoring": 41.52, "mean": 54.32, "std": 12.80},
    (60, "problem_solving"): {"cutoff": 35.26, "monitoring": 46.38, "mean": 57.50, "std": 11.12},
    (60, "personal_social"): {"cutoff": 40.88, "monitoring": 49.73, "mean": 58.58, "std": 8.85},
}

# All available age intervals
AGE_INTERVALS = sorted(set(age for age, _ in CUTOFF_SCORES.keys()))


def get_cutoff_scores(age_months: int, domain: str) -> dict[str, float]:
    """Get cutoff scores for a given age and domain.

    Uses exact match first, then finds the closest age interval
    (preferring the lower age when equidistant).
    """
    # Try exact match
    key = (age_months, domain)
    if key in CUTOFF_SCORES:
        return CUTOFF_SCORES[key]

    # Find closest age
    closest_age = min(AGE_INTERVALS, key=lambda x: abs(x - age_months))
    return CUTOFF_SCORES[(closest_age, domain)]
