<div align="center">

# 🌍 EcoResonance AI

**Many Environmental Signals → One Interpretable Index**

Collect → Validate → Normalise → Analyse → EcoResonance Index (ERI) → Dashboard

<img src="https://img.shields.io/badge/status-in%20development-e0af68?style=flat-square" />
<img src="https://img.shields.io/badge/Python-Flask-3776AB?style=flat-square&logo=flask&logoColor=white" />
<img src="https://img.shields.io/badge/Pandas-NumPy-150458?style=flat-square&logo=pandas&logoColor=white" />
<img src="https://img.shields.io/badge/Scikit--learn-F7931E?style=flat-square&logo=scikitlearn&logoColor=white" />
<img src="https://img.shields.io/badge/Leaflet-Chart.js-199900?style=flat-square&logo=leaflet&logoColor=white" />
<img src="https://img.shields.io/badge/Data-Open--Meteo%20%7C%20NASA%20POWER-0B3D91?style=flat-square&logo=nasa&logoColor=white" />

**Paper:** Presented at ICSIE 2026 (17th International Conference on Science & Innovative Engineering)

</div>

---

Weather and air-quality dashboards show temperature, humidity, rainfall, wind, pressure and AQI as **separate numbers**, which makes it hard to see how conditions change together. EcoResonance AI combines them into one composite score, the **EcoResonance Index (ERI)**, and shows it on a dashboard, a map and location-level insights.

> ⚠️ **This is a monitoring and interpretation tool, not a disaster predictor.** ERI is a project-defined index, not an official risk classification or warning system.

## The EcoResonance Index

```
ERI = Σ (wᵢ · xᵢ)      xᵢ = normalised parameter value,  Σ wᵢ = 1
```

| ERI | State | |
|---|---|---|
| 0.00 – 0.25 | Calm | 🟢 |
| 0.25 – 0.50 | Disturbed | 🟡 |
| 0.50 – 0.75 | Stressed | 🟠 |
| 0.75 – 1.00 | Anxious | 🔴 |

**Inputs:** temperature · humidity · precipitation · wind speed · pressure · AQI · PM2.5 · UV index

## Modules

| Page | What it shows |
|---|---|
| 📊 **Dashboard** | Current ERI, parameter cards, ERI trend, alert summary |
| 🗺️ **Live Map** | Leaflet map with ERI, temperature, AQI, UV and rain layers; city search |
| 🏙️ **City Insights** | One location in depth: measurements, ERI, interpretation, trends |
| 🚨 **Alerts** | Threshold-based alerts by severity, with history and filters |
| 📈 **History & Trends** | Date-range ERI and parameter trends, period summaries |

## Architecture

```
Open-Meteo (live) ─┐
                   ├─► Collect → Clean & validate → Normalise → Features → ERI / ML
NASA POWER (hist) ─┘                                                       │
                                                                           ▼
                                                                 Flask REST API
                                                                           │
                                         Dashboard · Live Map · City Insights · Alerts · History
```

## Status

<!-- Tick ONLY what is merged, running and tested. -->

- [ ] Five-page frontend (HTML / CSS / JS, Chart.js, Leaflet)
- [ ] Flask backend + REST API
- [ ] Open-Meteo live integration
- [ ] NASA POWER historical integration
- [ ] Cleaning, normalisation, missing-data handling
- [ ] ERI weights and normalisation documented and validated
- [ ] Alert and history logic
- [ ] CNN-LSTM time-series experiments (TensorFlow / Keras)
- [ ] Tests and evaluation

## Deep dive

<details>
<summary><b>📐 What ERI still needs before it means anything</b></summary>

- Normalisation method per parameter (min-max vs. z-score, fixed vs. rolling range)
- Direction of each parameter (is higher worse?)
- How the weights are chosen and justified
- How missing parameters are handled
- How the index is validated against real conditions

Until these are written down, ERI is a design, not a validated metric.

</details>

<details>
<summary><b>🌐 Data sources</b></summary>

| Source | Used for |
|---|---|
| [Open-Meteo](https://open-meteo.com/) | Live and forecast temperature, humidity, precipitation, wind, pressure, air quality |
| [NASA POWER](https://power.larc.nasa.gov/) | Historical temperature, humidity, wind, pressure, precipitation |

Which fields you get depends on location, provider and time period.

</details>

<details>
<summary><b>🧠 Planned CNN-LSTM model</b></summary>

- **CNN:** extracts local patterns across parameters
- **LSTM:** learns how they change over time
- Training data, target variable and metrics are documented once the model is trained. **No accuracy is claimed yet.**

</details>

<details>
<summary><b>🔐 Data-integrity rules</b></summary>

- Demo data is never presented as live
- No fabricated measurements or history
- No claims about unsupported cities
- Missing data is shown as missing
- Every value keeps its source and timestamp

</details>

<details>
<summary><b>🌱 SDGs</b></summary>

**SDG 13** Climate Action · **SDG 11** Sustainable Cities and Communities, through access to environmental information (monitoring only, not mitigation).

</details>

<details>
<summary><b>📁 Project structure</b></summary>

```
EcoResonanceAI/
├── backend/    app.py · routes · services · data_pipeline · models · utils
├── frontend/   templates · static (css, js, images)
├── data/       raw · processed · demo
├── config/ · docs/ · tests/
└── requirements.txt
```

</details>

## Tech stack

**Backend:** Python, Flask · **Data:** Pandas, NumPy, Scikit-learn · **DL (planned):** TensorFlow / Keras
**Frontend:** HTML, CSS, JavaScript, Bootstrap, Chart.js, Leaflet · **Data sources:** Open-Meteo, NASA POWER

---

<div align="center">

Built by **[Bollu Jnana Keerthana](https://github.com/Jnana1964)** · B.Tech CSE, SRM IST · [Portfolio](https://jnana1964.github.io)

<sub>Academic project. Not a substitute for official weather, pollution or emergency advisories.</sub>

</div>
