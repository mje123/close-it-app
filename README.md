# Close It!™ — Real Estate Closing Cost Calculator

A full-stack modernization of [closeitapp.com](https://closeitapp.com), engineered by Federal Title & Escrow Company.

## Quick Start

### Prerequisites
- Node.js 20+

### 1. Start the Backend (port 5001)
```bash
cd server
npm install
npm run dev
```

### 2. Start the Frontend (port 3000)
```bash
cd client
npm install
npm run dev
```

Open **http://localhost:3000**

---

## Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Zustand, React Router, jsPDF
- **Backend**: Express, TypeScript, SQLite (better-sqlite3), JWT auth
- **Build**: Vite 8

## Features
- **Buy It!** calculator — cash to close, monthly payments, full closing cost breakdown
- **Sell It!** calculator — net proceeds, commission, taxes, all deductions
- Closing Disclosure PDF generation & print view
- JWT authentication with saved calculations
- All assets from closeitapp.com downloaded to `/client/public/assets/`

## Test Credentials
- Email: `test@example.com`
- Password: `password123`

## Project Structure
```
close-it/
├── client/          # React + Vite frontend
│   └── public/assets/
│       ├── logos/   # Close It! and Federal Title logos
│       ├── screenshots/  # Mobile app screenshots
│       └── media/   # As-seen-on press logos
├── server/          # Express + SQLite API
│   └── data/        # SQLite database (auto-created)
└── scripts/         # Asset download script
```

## API Endpoints
- `POST /api/calculations/calculate/buyer` — Calculate buyer closing costs
- `POST /api/calculations/calculate/seller` — Calculate seller net proceeds
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Register
- `GET /api/calculations/saved` — Get saved calculations (auth required)

## Notes
- Port 5000 is occupied by macOS Control Center; server runs on **5001**
- The Vite dev proxy forwards `/api/*` from port 3000 → 5001 automatically
