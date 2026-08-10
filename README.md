# EcoResonance AI

Real-Time Environmental Intelligence and Monitoring System — India.

This is a **static, client-side web app** (plain HTML/CSS/JS, no build step,
no backend server, no API keys). Every number you see comes from a live
public API call made directly from your browser when you open the page.
Nothing is hardcoded or simulated.

## How to run it

Because the pages fetch live data, don't just double-click the HTML files
(some browsers restrict `fetch` on `file://` pages). Serve the folder locally:

```bash
cd ecoresonance
python3 -m http.server 8080
# then open http://localhost:8080 in your browser
```

or use the VS Code "Live Server" extension, or host it on any static host
(GitHub Pages, Netlify, Vercel — all work with zero config).

## Pages

| Page | File | What it shows |
|---|---|---|
| Dashboard | `index.html` | KPIs, top-5 cities by ERI, mini map, ERI trend, alerts preview, hazard distribution |
| Live Map | `live-map.html` | Full India map with switchable layers (Rainfall, Cloud Cover, Wind Flow, Temperature, Pressure, AQI, Seismic), live hazard overview, city snapshot strip |
| Alerts | `alerts.html` | All active environmental alerts generated from live threshold checks, filterable |
| History & Trends | `history.html` | Real historical archive data per city, ERI trend, parameter trends, generated insights |

*City Insights was intentionally left out per your instruction to build only
the four core screens.*

## Data sources (all real, free, key-less, CORS-enabled)

- **Open-Meteo Forecast API** — temperature, humidity, precipitation, wind
  speed/direction, pressure, cloud cover (live, per city)
- **Open-Meteo Air Quality API** — US AQI, PM2.5, PM10 (live, per city)
- **Open-Meteo Archive API** — historical daily weather (History & Trends page)
- **USGS Earthquake GeoJSON feed** — real recent seismic events, used strictly
  as a monitoring signal

No satellite imagery, no NASA feed, and no live cyclone-track feed is used —
none of those are available for free/key-less browser use. Say so plainly if
asked in an interview.

## The ERI (Environmental Risk Index) — what it actually is

`ERI = Σ(weight_i × normalized_value_i) / Σ(weight_i)`

Seven live signals are normalized to 0–1 (rainfall, wind, humidity, pressure
deviation, AQI, temperature stress, seismic proximity) and combined with
documented weights — see `js/eri-engine.js`. The thresholds used for
normalization (e.g. 50mm/hr = "extremely heavy rain") are drawn from standard
meteorological/AQI references, not custom-tuned or validated science.

**Say this in an interview:**
> "ERI is our project's own composite indicator, not an officially recognized
> disaster probability. It summarizes how far current live conditions deviate
> from calm baseline conditions across multiple real signals."

## Storm / wind-hazard risk — how it's derived

There is no free, live, key-less API that gives an actual tracked cyclone
position. The Live Map does **not** draw a fake storm spiral. Instead, "Wind
Storm" risk is derived transparently from two real signals: live wind speed
and a live pressure drop (low pressure near 1013 hPa baseline). This is
disclosed directly in the UI ("derived storm-risk signal", "not a tracked
storm system") — don't oversell it as cyclone tracking.

## Things this project explicitly does NOT claim

- It does **not** predict earthquakes.
- It does **not** guarantee any disaster will happen.
- ERI is **not** an official/scientific disaster-probability score.
- It is **not** a live cyclone-tracking system.
- "System Confidence: 92%" from the mockup was deliberately **not**
  implemented as a fake number — the Live Map instead shows real "sources
  online" / "cities reporting" counts.

## Known limitations to be upfront about

- Open-Meteo's free tier has fair-use rate limits; loading all 130 cities on
  every page load is several batched requests — if you hit a rate limit,
  the status banner will show the real error rather than fabricating data.
- The mini/full maps are OpenStreetMap tile layers with per-city markers —
  not a satellite-image or radar overlay.
- Historical "archive" data has roughly a 2-day reporting lag at the source,
  so today/yesterday won't appear in History & Trends.
