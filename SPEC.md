# ExcelCalcFlow — Full-Stack Website Specification

## Overview

A web application that lets authenticated users upload an Excel file containing currency amounts, applies live USD/EUR/TRY exchange rates, and presents the converted results in the browser. Users can also download the result as an Excel file. The existing Python calculation logic in `src/calculator_app.py` is reused as the backend engine.

---

## Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Frontend     | React 18 + TypeScript, React Router v6          |
| Styling      | Tailwind CSS                                    |
| HTTP client  | Axios                                           |
| Backend      | Python 3.11+, Flask 3.x, Flask-JWT-Extended     |
| Database     | SQLite (dev) / PostgreSQL (prod)                |
| ORM          | SQLAlchemy 2.x + Alembic (migrations)           |
| File storage | Local filesystem (dev) / S3-compatible (prod)   |
| Auth         | JWT (access + refresh tokens, httpOnly cookies) |

---

## Features

### Authentication
- User registration (email + password)
- User login / logout
- JWT access token (15 min) + refresh token (7 days) via httpOnly cookies
- Protected routes — unauthenticated users are redirected to `/login`

### Excel Upload & Calculation
- Drag-and-drop or click-to-upload `.xlsx` file
- Backend validates required columns (`amount`, `currency`, `description`)
- Live FX rates fetched from `https://api.frankfurter.app`
- Conversion to Turkish Lira (TRY) applied per row
- Results stored in the database linked to the authenticated user

### Results Dashboard
- List of all past uploads for the logged-in user (filename, date, row count, status)
- Click an upload to view its result table inline
- Download result as `.xlsx`

### Live FX Rates Widget
- Display current USD → TRY and EUR → TRY rates on the dashboard
- Rates refreshed on page load

---

## Project Structure

```
t2/
├── backend/                  # Flask API
│   ├── app/
│   │   ├── __init__.py       # Flask app factory
│   │   ├── auth/             # Auth blueprints & JWT logic
│   │   ├── uploads/          # Upload & calculation blueprints
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── schemas.py        # Marshmallow / Pydantic schemas
│   │   └── fx.py             # Wraps existing fetch_live_rates()
│   ├── migrations/           # Alembic migration files
│   ├── config.py             # Environment-based config
│   ├── requirements.txt      # Backend dependencies
│   └── run.py                # Entry point
│
├── frontend/                 # React app
│   ├── src/
│   │   ├── api/              # Axios instances & API calls
│   │   ├── components/       # Shared UI components
│   │   ├── pages/            # Page-level components
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Upload.tsx
│   │   │   └── Results.tsx
│   │   ├── hooks/            # Custom React hooks (useAuth, useFX, etc.)
│   │   ├── context/          # AuthContext
│   │   └── App.tsx           # Router & layout
│   ├── public/
│   ├── tailwind.config.js
│   └── package.json
│
├── src/                      # Existing CLI logic (reused by backend)
│   └── calculator_app.py
├── data/
├── SPEC.md
└── README.md
```

---

## Database Schema

### `users`
| Column          | Type         | Notes                  |
|-----------------|--------------|------------------------|
| id              | INTEGER PK   | Auto-increment         |
| email           | VARCHAR(255) | Unique, not null       |
| password_hash   | VARCHAR(255) | bcrypt hash            |
| created_at      | DATETIME     | Default now()          |

### `uploads`
| Column       | Type         | Notes                                     |
|--------------|--------------|-------------------------------------------|
| id           | INTEGER PK   | Auto-increment                            |
| user_id      | INTEGER FK   | → users.id, cascade delete               |
| filename     | VARCHAR(255) | Original filename                         |
| file_path    | VARCHAR(512) | Server-side storage path                  |
| row_count    | INTEGER      | Number of data rows                       |
| status       | VARCHAR(50)  | `pending` / `done` / `error`             |
| error_msg    | TEXT         | Populated on validation/FX failure        |
| uploaded_at  | DATETIME     | Default now()                             |

### `results`
| Column         | Type         | Notes                              |
|----------------|--------------|------------------------------------|
| id             | INTEGER PK   | Auto-increment                     |
| upload_id      | INTEGER FK   | → uploads.id, cascade delete       |
| row_index      | INTEGER      | Original row position in Excel     |
| description    | TEXT         |                                    |
| amount         | FLOAT        | Original amount                    |
| currency       | VARCHAR(10)  | USD / EUR / TRY                    |
| live_rate      | FLOAT        | Rate used at calculation time      |
| converted_try  | FLOAT        | amount × live_rate                 |

### `fx_snapshots`
| Column      | Type     | Notes                                 |
|-------------|----------|---------------------------------------|
| id          | INTEGER  | Auto-increment                        |
| upload_id   | INTEGER  | → uploads.id                          |
| usd_to_try  | FLOAT    |                                       |
| eur_to_try  | FLOAT    |                                       |
| fetched_at  | DATETIME |                                       |

---

## API Endpoints

### Auth — `/api/auth`

| Method | Path        | Auth? | Description                          |
|--------|-------------|-------|--------------------------------------|
| POST   | `/register` | No    | Create account `{email, password}`   |
| POST   | `/login`    | No    | Issue JWT cookies `{email, password}`|
| POST   | `/logout`   | Yes   | Clear JWT cookies                    |
| GET    | `/me`       | Yes   | Return current user info             |
| POST   | `/refresh`  | No*   | Rotate access token via refresh cookie |

### Uploads — `/api/uploads`

| Method | Path           | Auth? | Description                              |
|--------|----------------|-------|------------------------------------------|
| POST   | `/`            | Yes   | Upload `.xlsx` file (multipart/form-data)|
| GET    | `/`            | Yes   | List all uploads for the current user    |
| GET    | `/<id>`        | Yes   | Get upload metadata + result rows        |
| GET    | `/<id>/download` | Yes | Download result `.xlsx` file            |
| DELETE | `/<id>`        | Yes   | Delete upload and all related results    |

### FX Rates — `/api/fx`

| Method | Path      | Auth? | Description                    |
|--------|-----------|-------|--------------------------------|
| GET    | `/latest` | No    | Return current USD/EUR → TRY rates |

---

## Frontend Routes

| Path              | Component      | Auth Required | Description               |
|-------------------|----------------|---------------|---------------------------|
| `/login`          | Login          | No            | Login form                |
| `/register`       | Register       | No            | Registration form         |
| `/`               | Dashboard      | Yes           | Upload history + FX rates |
| `/upload`         | Upload         | Yes           | File upload form          |
| `/results/:id`    | Results        | Yes           | Result table for one upload |

---

## Data Flow

```
User uploads .xlsx
        │
        ▼
Flask validates columns (amount, currency, description)
        │
        ▼
fetch_live_rates() → api.frankfurter.app
        │
        ▼
calculate() applied row by row
        │
        ├──► Store rows in `results` table
        ├──► Store FX snapshot in `fx_snapshots`
        └──► Update upload.status = "done"
                │
                ▼
React fetches GET /api/uploads/:id
                │
                ▼
Displays table; offers Download button → GET /api/uploads/:id/download
```

---

## Authentication Flow

```
Register → POST /api/auth/register
Login    → POST /api/auth/login  →  Set httpOnly cookies:
                                      access_token  (15 min)
                                      refresh_token (7 days)
Every request → Flask-JWT-Extended reads cookie automatically
Token expiry  → POST /api/auth/refresh → new access_token cookie
Logout        → POST /api/auth/logout  → clear both cookies
```

---

## Environment Variables

### Backend (`backend/.env`)
```
FLASK_ENV=development
SECRET_KEY=change-me-in-production
DATABASE_URL=sqlite:///./excalcflow.db
JWT_SECRET_KEY=change-me-in-production
UPLOAD_FOLDER=./uploads
MAX_CONTENT_LENGTH=10485760   # 10 MB
```

### Frontend (`frontend/.env`)
```
VITE_API_BASE_URL=http://localhost:5000
```

---

## Key Validation Rules

- Uploaded file must be `.xlsx` (reject `.xls`, `.csv`, etc.)
- File size limit: 10 MB
- Required columns: `amount` (numeric), `currency` (`USD`/`EUR`/`TRY`), `description` (string)
- Unknown currencies default to an error row, not a crash
- If the FX API is unreachable, return HTTP 502 with a clear message

---

## Development Quick Start (planned)

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
flask db upgrade
flask run

# Frontend
cd frontend
npm install
npm run dev
```

---

## Open Questions / Decisions

- [ ] File storage: local filesystem is fine for dev — decide on S3 or similar before production
- [ ] Pagination for result rows if Excel files can be very large
- [ ] Rate limiting on the upload endpoint to prevent abuse
- [ ] Email verification on registration (optional)
