# Toronto Map Directory

A playful, interactive map directory showcasing maker spaces and coworking spots across Toronto. Built with React, Mapbox GL JS, and a dash of Framer Motion for that Readymag-inspired feel.

## What it does

- Visual map of creative spaces in Toronto
- Directory sidebar with searchable listings
- Click markers or directory items to zoom in and see details
- Auto-geocodes addresses from Supabase if coordinates are missing

## Tech stack

- **Frontend:** React + Vite, Framer Motion, Mapbox GL JS
- **Backend:** Express API
- **Database:** Supabase
- **Geocoding:** Mapbox Geocoding API

## Getting started

1. Install dependencies:
```bash
npm install
```

2. Set up your `.env` file in the root:
```env
# Frontend
VITE_MAPBOX_TOKEN=your_mapbox_public_token

# Backend
MAPBOX_ACCESS_TOKEN=your_mapbox_token
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
PORT=5174
```

3. Run both frontend and backend:
```bash
npm run dev
```

This starts:
- Frontend at `http://localhost:5173`
- API server at `http://localhost:5174`

Or run them separately:
```bash
npm run dev:client  # Just frontend
npm run dev:server  # Just backend
```

## Database schema

The app expects a `spaces` table in Supabase with fields like `name`, `address`, `lat`, `long`, `vibes`, `industry`, `website`, etc. If `lat`/`long` are missing, the backend will auto-geocode addresses using Mapbox.

## Build for production

```bash
npm run build
```

The frontend builds to `dist/`, and you'll need to deploy the Express server separately.
