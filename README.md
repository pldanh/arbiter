# Breathe Clean

A web app that turns air quality numbers into personal advice. Instead of a bare AQI value, it tells you what *you* and *your family* can do today.

## Features
- Live US AQI for your location or any city worldwide, with colors that change by level
- Advice by group (healthy adult, child, older adult) and health conditions (asthma/respiratory, heart, pregnancy)
- Activity planner (walking, riding, running) with an hour-by-hour suitability strip and the best window of the day
- Family profiles: advice for each person, plus a ready-made message to send to the family
- Map and ranking of 46 cities (Vietnam, Asia, Worldwide)
- Alerts when AQI crosses a threshold (Notification API, checked every 30 minutes while the page is open)
- Installable PWA

## Tech
Plain HTML, CSS and JavaScript. No build step, no server, no API key.
Data: [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api). Map: Leaflet + OpenStreetMap.

## Run locally
```bash
npx serve .
# or: python3 -m http.server 8000
```
Open http://localhost:8000. Geolocation and notifications need localhost or HTTPS.

## Deploy for free
- GitHub Pages: push to a repo, then enable Pages in Settings.

## Structure
```
tho-sach/
├── index.html        # page layout
├── css/style.css     # styles, colors by AQI level
├── js/app.js         # API calls, advice logic, map, alerts, family profiles
├── assets/icon.svg   # app icon
├── manifest.json     # PWA config
├── sw.js             # service worker
└── README.md
```

## Disclaimer
AQI values come from a forecast model, not local monitoring stations. Advice is general guidance, not medical advice. People with medical conditions should consult a doctor.
