import csv
import io
import os
import time

import requests
from flask import Flask, jsonify, send_from_directory

app = Flask(__name__, static_folder='public', static_url_path='')

SHEET_ID      = '1PKciOkWTBX9fZQUSKNJZXi5UkKbLRLn-k1P04vKs0Ho'
SHEET_CSV_URL = f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid=0'
CACHE_TTL     = 30  # seconds

_cache: dict = {'data': None, 'ts': 0.0, 'error': None}


def _fetch_from_sheet() -> list[dict]:
    resp = requests.get(SHEET_CSV_URL, timeout=12, allow_redirects=True)
    resp.raise_for_status()

    reader    = csv.DictReader(io.StringIO(resp.text))
    customers = []

    for row in reader:
        name  = (row.get('Customer Name') or '').strip()
        phone = (row.get('Phone Number')  or '').strip()
        raw   = (row.get('Amount Spent')  or '0') \
                    .replace(',', '').replace('₹', '').strip()
        if not name:
            continue
        try:
            amount = float(raw)
        except ValueError:
            amount = 0.0
        customers.append({'name': name, 'phone': phone, 'amountSpent': amount})

    customers.sort(key=lambda c: c['amountSpent'], reverse=True)
    for i, c in enumerate(customers):
        c['rank']     = i + 1
        c['cashback'] = i < 10   # top 10 win 100 % cashback

    return customers


def get_data() -> tuple[list[dict] | None, str | None]:
    now = time.time()
    if _cache['data'] is not None and now - _cache['ts'] < CACHE_TTL:
        return _cache['data'], None
    try:
        data             = _fetch_from_sheet()
        _cache['data']   = data
        _cache['ts']     = now
        _cache['error']  = None
        return data, None
    except Exception as exc:
        _cache['error'] = str(exc)
        # return stale data if we have it, otherwise error
        return _cache['data'], str(exc)


# ── API ───────────────────────────────────────────────────────────────────────

@app.route('/api/customers')
def api_customers():
    data, err = get_data()
    if data is None:
        return jsonify({'error': f'Could not load sheet: {err}'}), 502
    return jsonify(data)


@app.route('/api/refresh', methods=['POST'])
def api_refresh():
    _cache['data'] = None  # bust the cache
    data, err = get_data()
    if data is None:
        return jsonify({'error': str(err)}), 502
    return jsonify({'success': True, 'count': len(data)})


# ── STATIC ────────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return send_from_directory('public', 'index.html')


@app.route('/admin')
def admin():
    return send_from_directory('public', 'admin.html')


# ── MAIN ──────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    print(f'\n🎉 Doto Kids Birthday Leaderboard  →  http://localhost:{port}')
    print(f'📋 Admin / Sheet editor            →  http://localhost:{port}/admin\n')
    app.run(host='0.0.0.0', port=port, debug=False)
