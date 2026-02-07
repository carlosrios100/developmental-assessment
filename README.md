# DevAssess - Developmental Assessment App

AI-powered developmental screening application based on ASQ-3 methodology with video analysis capabilities.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MOBILE APP                            │
│  Expo (React Native) + NativeWind                       │
│  iOS / Android / Web                                    │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    SUPABASE                              │
│  PostgreSQL + Auth + Storage + Real-time                │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                  PYTHON API                              │
│  FastAPI + MediaPipe + AI Models                        │
│  Video Analysis + Report Generation                     │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
developmental-assessment/
├── apps/
│   ├── mobile/          # Expo React Native app
│   └── api/             # Python FastAPI backend
├── packages/
│   ├── shared/          # Shared TypeScript types & utilities
│   └── supabase/        # Database schema & migrations
└── docs/                # Documentation
```

## Features

- **ASQ-3 Based Assessment**: Questionnaires for ages 2-60 months
- **5 Developmental Domains**: Communication, Gross Motor, Fine Motor, Problem Solving, Personal-Social
- **Video Analysis**: AI-powered behavior detection using MediaPipe
- **Real-time Sync**: Supabase real-time subscriptions
- **Longitudinal Tracking**: Progress over time with trend analysis
- **Report Generation**: Parent-friendly and professional reports

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.11+
- Supabase account

### Setup

1. **Clone and install dependencies**
   ```bash
   cd developmental-assessment
   pnpm install
   ```

2. **Set up Supabase**
   ```bash
   cd packages/supabase
   pnpm db:start    # Start local Supabase
   pnpm db:push     # Apply migrations
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start the mobile app**
   ```bash
   pnpm dev:mobile
   ```

5. **Start the API (in another terminal)**
   ```bash
   cd apps/api
   pip install -e .
   uvicorn src.main:app --reload
   ```

## Development

### Mobile App

```bash
pnpm dev:mobile      # Start Expo dev server
```

Press:
- `i` - Open iOS simulator
- `a` - Open Android emulator
- `w` - Open web browser

### API

```bash
cd apps/api
uvicorn src.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`

### Database

```bash
cd packages/supabase
pnpm db:studio       # Open Supabase Studio
pnpm db:generate     # Generate TypeScript types
```

## Tech Stack

### Mobile
- **Expo** - React Native framework
- **NativeWind** - Tailwind CSS for React Native
- **Expo Router** - File-based routing
- **TanStack Query** - Data fetching
- **Zustand** - State management

### Backend
- **Supabase** - PostgreSQL, Auth, Storage, Real-time
- **FastAPI** - Python API framework
- **MediaPipe** - Computer vision for behavior detection
- **OpenCV** - Video processing

### Shared
- **TypeScript** - Type safety across the stack
- **Turborepo** - Monorepo build system

## API Endpoints

### Video Analysis
- `POST /api/v1/video/upload` - Upload video
- `POST /api/v1/video/process` - Start analysis
- `GET /api/v1/video/status/{id}` - Get processing status
- `GET /api/v1/video/result/{id}` - Get analysis results

### Assessment
- `POST /api/v1/assessment` - Create assessment
- `POST /api/v1/assessment/{id}/responses` - Save responses
- `POST /api/v1/assessment/{id}/score` - Calculate scores

### Reports
- `POST /api/v1/reports/generate` - Generate report
- `GET /api/v1/reports/{id}` - Get report

## Video Analysis Metrics

The video analysis API returns two categories of metrics: **Movement Metrics** and **Interaction Metrics**.

### Movement Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `distance_traversed` | float | Total movement distance (normalized coordinates) |
| `movement_quality` | string | Quality assessment: "smooth", "coordinated", "jerky", or "uncoordinated" |
| `posture_stability` | float (0-1) | Stability score based on velocity variance |
| `bilateral_coordination` | float (0-1) | Symmetry between left/right limb movements |
| `crossing_midline` | boolean | Whether hands crossed the body's midline |
| `average_speed` | float | Mean movement velocity |

### Interaction Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `eye_contact_duration` | float | Total seconds of detected eye contact |
| `eye_contact_percentage` | float | Percentage of frames with eye contact |
| `joint_attention_episodes` | int | Estimated shared attention moments |
| `vocalizations` | int | Number of distinct vocal segments detected |
| `vocalization_duration` | float | Total seconds of vocalization |
| `positive_affect_instances` | int | Count of detected smiles |
| `responsiveness_to_cues` | float (0-1) | Behavioral variability score (see note) |
| `turn_taking_instances` | int | Estimated turn-taking events (see note) |
| `proximity_to_caregiver` | int | Always 0 (requires multi-person tracking) |

### Important Notes on Proxy Metrics

Some metrics are **estimates** based on observable behaviors, not direct measurements:

#### `responsiveness_to_cues` ⚠️ Proxy Metric
This score measures **behavioral variability** (gaze shifts and movement onsets), not true responsiveness to caregiver cues. A higher score indicates more frequent behavioral state changes, which may correlate with engagement, but the system cannot detect actual caregiver cues or confirm the child is responding to them.

#### `turn_taking_instances` ⚠️ Proxy Metric
This counts vocalization patterns with gaps of 0.8-5 seconds between them, which *may* indicate the child is waiting for a response. However, the system cannot confirm whether a caregiver actually spoke during the gap. This is an estimate of potential turn-taking behavior, not confirmed conversational exchanges.

#### `proximity_to_caregiver`
Currently returns 0. Accurate measurement requires multi-person pose detection to identify and track both child and caregiver, which is not yet implemented.

### Confidence Considerations

- Metrics are most reliable when the child's face and body are clearly visible
- Poor lighting, occlusion, or rapid movement may reduce accuracy
- These metrics are screening tools and should not replace professional assessment

### Threshold Tuning

Detection thresholds are configurable via the `DetectionThresholds` dataclass in `video_analysis.py`. Default values are reasonable starting points but may need calibration with real developmental assessment videos.

| Category | Threshold | Default | Description |
|----------|-----------|---------|-------------|
| **MediaPipe** | `mediapipe_min_confidence` | 0.5 | Pose/face detection confidence (0-1) |
| **Eye Contact** | `gaze_ratio_min/max` | 0.35/0.65 | Iris position range for "forward gaze" |
| **Smile** | `smile_width_ratio` | 0.35 | Mouth width relative to face width |
| **Smile** | `smile_corner_elevation` | 0.01 | Corner lift threshold |
| **Gaze Shift** | `gaze_shift_threshold` | 0.02 | Minimum iris movement to count |
| **Movement** | `movement_onset_velocity` | 0.005 | Velocity threshold for "moving" |
| **Midline** | `midline_crossing_offset` | 0.05 | How far past center to count |
| **Turn-Taking** | `turn_taking_min/max_gap` | 0.8/5.0 | Gap duration range (seconds) |
| **Quality** | `movement_quality_*` | 0.01/0.03/0.05 | Velocity std thresholds |

**Example: Custom thresholds for testing**
```python
from src.services.video_analysis import VideoAnalysisService, DetectionThresholds

# More sensitive smile detection
custom = DetectionThresholds(
    smile_width_ratio=0.30,
    smile_corner_elevation=0.008,
)
service = VideoAnalysisService(thresholds=custom)
```

## Developmental Domains

| Domain | Description |
|--------|-------------|
| Communication | Language skills - receptive and expressive |
| Gross Motor | Large muscle movements - walking, running, balance |
| Fine Motor | Hand and finger movements - grasping, drawing |
| Problem Solving | Cognitive skills - learning, thinking |
| Personal-Social | Self-help skills and social interactions |

## Scoring

Based on ASQ-3 methodology:
- **Yes** = 10 points
- **Sometimes** = 5 points
- **Not Yet** = 0 points

Risk levels determined by comparing to age-normed cutoffs:
- **Typical** - Score above monitoring zone
- **Monitoring** - Score in monitoring zone
- **At Risk** - Score below cutoff
- **Concern** - Multiple domains at risk

## License

Private - All rights reserved

## Research Sources

- [ASQ-3 Ages and Stages](https://agesandstages.com/)
- [CDC Developmental Milestones](https://www.cdc.gov/act-early/)
- [HARMONI Video Analysis](https://github.com/yeung-lab/HARMONI)
