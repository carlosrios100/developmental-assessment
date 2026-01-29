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
