<<<<<<< HEAD
# PrecisionWorks Conversational Order Management

Hackathon-ready full-stack app with:

- React + Vite frontend
- Tailwind CSS styling
- Framer Motion animations
- Node.js + Express backend
- SQLite database (`better-sqlite3`)
- NLP-like intent extraction via lightweight parser

## Features

- Register/Login flow (register first, then login)
- Authenticated user session with JWT
- User-specific order visibility
- Chat-driven:
  - Order creation
  - Status update (`Received -> In Review -> Accepted`)
  - Quality note logging
  - Multi-order awareness (e.g. list accepted orders)
- Read-only dashboard with latest quality note

## Run Locally

### 1) Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:4000`.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## API Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /orders` (auth required)
- `POST /chat` (auth required)

## Database Used

**SQLite** (file: `backend/data.sqlite`)
=======
# AIChatBot
>>>>>>> 4fd9280c8edfd3fb180fb88dd91dfb6ee583ca7a
