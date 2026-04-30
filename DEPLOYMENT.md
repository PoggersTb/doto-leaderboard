# Doto Kids – 2nd Birthday Sale Leaderboard
## Deployment Guide

---

## Overview

A leaderboard webpage for the Doto Kids 2nd Birthday Sale. The top 10 customers by total spend win 100% cashback. Data is pulled live from a Google Sheet — no database required.

**Stack:** Python 3 · Flask · Vanilla JS · Google Sheets (as data source)

---

## Project Structure

```
doto-leaderboard/
├── server.py              # Flask backend — fetches & serves Google Sheet data
├── public/
│   ├── index.html         # Public leaderboard page
│   ├── admin.html         # Admin guide (links to the Google Sheet)
│   └── birthday-sale.png  # Birthday sale creative asset
├── package.json           # Node deps (only if using the Node server alternative)
├── server.js              # Node/Express alternative to server.py
└── DEPLOYMENT.md          # This file
```

---

## Prerequisites

- Python 3.8+
- pip

---

## Local Setup

**1. Clone the repo**
```bash
git clone https://github.com/PoggersTb/doto-leaderboard.git
cd doto-leaderboard
```

**2. Install dependencies**
```bash
pip install flask requests
```

**3. Run the server**
```bash
python3 server.py
```

**4. Open in browser**
- Leaderboard → `http://localhost:3000`
- Admin guide → `http://localhost:3000/admin`

---

## Google Sheet

The leaderboard data is sourced from this Google Sheet:

**Sheet ID:** `1PKciOkWTBX9fZQUSKNJZXi5UkKbLRLn-k1P04vKs0Ho`  
**URL:** https://docs.google.com/spreadsheets/d/1PKciOkWTBX9fZQUSKNJZXi5UkKbLRLn-k1P04vKs0Ho

### Required column headers (Row 1)

| Column | Description |
|---|---|
| `Customer Name` | Displayed on the leaderboard |
| `Phone Number` | Shown masked for privacy (e.g. XXXXXX1234) |
| `Amount Spent` | Numbers only — no ₹ symbol, no commas |

The sheet must be set to **"Anyone with the link can view"** for the server to read it.

To change the sheet, update the `SHEET_ID` constant at the top of `server.py`.

### Cache
Data is cached for **30 seconds**. To force an immediate refresh, hit the **"↻ Refresh Now"** button on the `/admin` page.

---

## Production Deployment

### Option 1 — Gunicorn (recommended for Linux/VPS)

```bash
pip install gunicorn
gunicorn -w 2 -b 0.0.0.0:3000 server:app
```

To keep it running with systemd, create `/etc/systemd/system/doto-leaderboard.service`:

```ini
[Unit]
Description=Doto Kids Leaderboard
After=network.target

[Service]
WorkingDirectory=/path/to/doto-leaderboard
ExecStart=/usr/bin/gunicorn -w 2 -b 0.0.0.0:3000 server:app
Restart=always

[Install]
WantedBy=multi-user.target
```

Then enable it:
```bash
sudo systemctl enable doto-leaderboard
sudo systemctl start doto-leaderboard
```

### Option 2 — Railway / Render / Fly.io (one-click cloud)

Add a `Procfile` in the project root:
```
web: gunicorn -w 2 -b 0.0.0.0:$PORT server:app
```

Then connect the GitHub repo to Railway/Render and deploy. Set the `PORT` environment variable if needed (the server reads it automatically).

### Option 3 — Embedding into Shopify

Since Shopify doesn't run Python servers, the recommended approach is:

1. Host this server separately (Railway/Render/VPS)
2. Embed the leaderboard in a Shopify page using an `<iframe>`:

```html
<iframe
  src="https://your-deployed-url.com"
  width="100%"
  height="900px"
  frameborder="0"
  scrolling="auto">
</iframe>
```

Or copy the contents of `public/index.html` into a Shopify custom page template and point the `/api/customers` fetch URL to the hosted server.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |

---

## Updating the Leaderboard

No code changes needed. Just edit the Google Sheet directly — the leaderboard updates within 30 seconds automatically.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/customers` | Returns all customers sorted by spend, with rank and cashback flag |
| `POST` | `/api/refresh` | Busts the cache and re-fetches from the sheet immediately |

### Sample response — `GET /api/customers`
```json
[
  {
    "name": "Priya Sharma",
    "phone": "XXXXXX1234",
    "amountSpent": 8500,
    "rank": 1,
    "cashback": true
  },
  ...
]
```

---

## Contact

For questions about the leaderboard, reach out to the Doto Kids team.  
Store: [dotokids.com](https://www.dotokids.com)
