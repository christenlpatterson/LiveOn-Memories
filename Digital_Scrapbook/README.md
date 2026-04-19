# LiveOn Memories — Digital Scrapbook

A family memory scrapbook application for preserving milestones, photographs, stories, and voice recordings across generations.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite 6 |
| Styling | Tailwind CSS 4 + Radix UI primitives |
| Backend | Flask 3 + Flask-SQLAlchemy |
| Database | SQLite (`backend/scrapbook.db`) |
| Media storage | Local disk (`backend/media/photos/`, `backend/media/audio/`) |

## Project Structure

```
LiveOn-Memories/
├── start.sh                  # Launch both servers with one command
├── backend/
│   ├── app.py                # Flask API server
│   ├── seed.py               # Seeds the database with initial milestones
│   ├── requirements.txt      # Python dependencies
│   ├── scrapbook.db          # SQLite database (auto-created)
│   └── media/
│       ├── photos/           # Uploaded photos stored here
│       └── audio/            # Voice recordings stored here
└── Digital_Scrapbook/        # React frontend
    ├── src/
    │   ├── app/
    │   │   ├── App.tsx
    │   │   ├── api/index.ts  # Typed fetch client for Flask API
    │   │   ├── components/
    │   │   │   ├── AnnotatedPhoto.tsx
    │   │   │   ├── ScrapbookEditor.tsx
    │   │   │   ├── Timeline.tsx
    │   │   │   ├── VisitorLog.tsx
    │   │   │   ├── pages/DetailPage.tsx
    │   │   │   └── ui/       # button, card, dialog, input, textarea, sonner
    │   │   └── data/types.ts # Shared TypeScript interfaces
    │   ├── styles/
    │   └── main.tsx
    ├── vite.config.ts
    └── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+

### First-time setup

```bash
# 1. Install Python dependencies
cd Digital_Scrapbook
python3 -m venv .venv
.venv/bin/pip install -r ../backend/requirements.txt

# 2. Seed the database with initial milestones
cd ../backend
../Digital_Scrapbook/.venv/bin/python seed.py

# 3. Install Node dependencies
cd ../Digital_Scrapbook
npm install
```

### Running the app

```bash
cd ~/Desktop/LiveOn-Memories
./start.sh
```

This starts both servers:

- **Frontend** → http://localhost:5173
- **Backend API** → http://localhost:5000

Press **Ctrl+C** to stop both servers.

## Sync Production Content To Local

From the repository root, use the sync helper:

```bash
./sync-content.sh pull --api-base https://YOUR-PROD-BACKEND --reset
```

What this does:

- Exports `GET /api/milestones` into a local bundle folder under `backups/`
- Downloads media referenced by `/media/photos/...` and `/media/audio/...`
- Hydrates your local backend database and media folders from that bundle

Other useful commands:

```bash
# Export only (no local import)
./sync-content.sh export --api-base https://YOUR-PROD-BACKEND

# Hydrate later from an existing bundle
./sync-content.sh hydrate --bundle backups/bundle-YYYYMMDD-HHMMSS --reset

# Export and keep bundle only (skip hydrate)
./sync-content.sh pull --api-base https://YOUR-PROD-BACKEND --skip-hydrate
```

Notes:

- Use `--reset` to replace local content instead of merging.
- External image URLs are preserved as URLs.
- Local media is written into `backend/media/photos` and `backend/media/audio`.

### Recurring Sync Shortcut

Use the preconfigured script for regular pulls from your production backend:

```bash
./sync-prod-content.sh
```

Optional flags:

```bash
# Merge instead of replacing local content
./sync-prod-content.sh --no-reset

# Export bundle only (do not hydrate local)
./sync-prod-content.sh --export-only

# Temporarily override backend URL
./sync-prod-content.sh --api-base https://another-backend.onrender.com
```

## Features

- **Timeline** — chronological view of all family milestones
- **Detail Page** — full story, photographs, and voice recordings per milestone
- **Create / Edit entries** — add title, year, month, story, and photos
- **Photo annotations** — click a photo to add a pinned note
- **Voice recordings** — record audio clips directly in the browser
- **Visitor log** — leave comments on any milestone
- **Delete** — remove milestones with a confirmation dialog

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/milestones` | List all milestones |
| POST | `/api/milestones` | Create a milestone |
| PATCH | `/api/milestones/<id>` | Update a milestone |
| DELETE | `/api/milestones/<id>` | Delete a milestone |
| POST | `/api/milestones/<id>/photos` | Upload a photo |
| DELETE | `/api/milestones/<id>/photos/<pid>` | Delete a photo |
| POST | `/api/milestones/<id>/photos/<pid>/annotations` | Add an annotation |
| POST | `/api/milestones/<id>/comments` | Add a comment |
| POST | `/api/milestones/<id>/audio` | Upload a voice recording |
| DELETE | `/api/milestones/<id>/audio/<cid>` | Delete a voice recording |

