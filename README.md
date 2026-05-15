# Zuno — Electric Bike Rental Platform

Distance-based electric bike rentals. Pick up from any station, ride to your destination, drop off, and pay only for the kilometres you travelled.

---

## How it works

1. User signs up (gets Rs.100 free wallet credit)
2. Browses stations, selects pickup station, unlocks a bike
3. Rides to destination
4. Selects drop-off station — live fare estimate shown
5. Ends ride — fare is calculated via Haversine (GPS coordinates of the two stations) and deducted from wallet

---

## Pricing

| Component         | Rate                     |
|-------------------|--------------------------|
| Unlock fee        | Rs.10 per ride           |
| First 5km         | Rs.3 per km              |
| Beyond 5km        | Rs.2 per km              |
| Minimum fare      | Rs.15                    |

**Example:** 8km ride = Rs.10 (unlock) + 5×3 (first 5km) + 3×2 (next 3km) = **Rs.31**

---

## Project Structure

```
zuno/
├── backend/
│   ├── server.js         Express API — all routes
│   └── package.json
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js
        ├── api.js              API service layer
        ├── index.css           Global design system
        ├── index.js
        ├── context/
        │   └── AuthContext.jsx JWT auth state
        ├── components/
        │   ├── Navbar.jsx/css
        │   ├── Footer.jsx/css
        │   └── StationCard.jsx/css
        └── pages/
            ├── Home.jsx/css       Landing page
            ├── Stations.jsx/css   Browse & unlock bikes
            ├── Ride.jsx/css       Active ride — timer, drop-off, fare estimate
            ├── History.jsx/css    Past rides & breakdowns
            ├── Pricing.jsx/css    Rate cards + fare calculator
            ├── Auth.jsx/css       Login / Register
            └── Account.jsx/css    Wallet top-up & account info
```

---

## Setup

### Requirements
- Node.js 18+
- npm 8+

### 1. Install & run backend

```bash
cd backend
npm install
node server.js
# API running at http://localhost:5000
```

### 2. Install & run frontend (separate terminal)

```bash
cd frontend
npm install
npm start
# App running at http://localhost:3000
```

The frontend proxies all `/api` calls to `http://localhost:5000` via the `proxy` field in `frontend/package.json`.

---

## Demo Account

```
Email:    demo@zuno.in
Password: demo123
Balance:  Rs.200
```

Or register a new account — every new user starts with Rs.100 free credit.

---

## API Reference

| Method | Endpoint                     | Auth | Description                              |
|--------|------------------------------|------|------------------------------------------|
| POST   | /api/auth/register           | No   | Register user, returns JWT               |
| POST   | /api/auth/login              | No   | Login, returns JWT                       |
| GET    | /api/auth/me                 | Yes  | Get current user                         |
| POST   | /api/wallet/topup            | Yes  | Add funds to wallet                      |
| GET    | /api/cities                  | No   | List all cities                          |
| GET    | /api/stations                | No   | List stations (optional ?city= filter)   |
| GET    | /api/stations/:id            | No   | Single station with live bike count      |
| GET    | /api/fare/estimate           | No   | Fare estimate between two stations       |
| POST   | /api/rides/start             | Yes  | Unlock bike at pickup station            |
| POST   | /api/rides/:id/end           | Yes  | End ride, deduct fare                    |
| GET    | /api/rides/active            | Yes  | Get current active ride                  |
| GET    | /api/rides                   | Yes  | Get ride history                         |
| GET    | /api/rides/:id               | Yes  | Single ride detail                       |
| GET    | /api/pricing                 | No   | Current pricing config                   |
| POST   | /api/newsletter              | No   | Subscribe email                          |
| GET    | /api/health                  | No   | Health check                             |

---

## Distance Calculation

Distance is calculated using the **Haversine formula** — the great-circle (shortest) distance between two GPS coordinates on Earth's surface. This gives a consistent, predictable fare that the user can verify before ending their ride.

```
d = 2R × arcsin(√(sin²(Δlat/2) + cos(lat₁)cos(lat₂)sin²(Δlon/2)))
```

Where R = 6371km (Earth's radius), lat/lon are in radians.

---

## Stations

17 stations across 4 cities — Bangalore (6), Mumbai (4), Delhi (4), Pune (3).

---

## Production Notes

- Replace in-memory `db` object with a real database (PostgreSQL / MongoDB)
- Set `JWT_SECRET` environment variable to a strong random string
- Build frontend: `cd frontend && npm run build`, then serve `build/` from Express
- Add rate limiting and input sanitisation before exposing to public traffic
