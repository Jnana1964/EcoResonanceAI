/**
 * EcoResonance AI — ERI (Environmental Risk Index) Engine
 * ----------------------------------------------------------------
 * IMPORTANT: The ERI is EcoResonance AI's own composite indicator.
 * It is NOT an officially recognized disaster-probability score,
 * and it does NOT predict earthquakes, floods, or storms with
 * certainty. It summarizes how far current conditions deviate from
 * calm baseline conditions across multiple real, live signals.
 *
 * Formula (documented, not a black box):
 *   ERI = Σ(w_i * x_i) / Σ(w_i)
 *   where x_i = normalized value of parameter i, in [0, 1]
 *         w_i = configurable weight of parameter i
 */

const ERI_ENGINE = (() => {

  const WEIGHTS = {
    rainfall: 0.24,
    wind: 0.18,
    humidity: 0.10,
    pressureDeviation: 0.14,
    aqi: 0.16,
    temperatureStress: 0.10,
    seismicProximity: 0.08
  };

  const STATES = [
    { max: 0.25, label: "Calm", color: "#22a35a" },
    { max: 0.50, label: "Disturbed", color: "#e6b800" },
    { max: 0.75, label: "Stressed", color: "#e8792c" },
    { max: 1.01, label: "Anxious", color: "#d9362e" }
  ];

  const clamp01 = v => Math.max(0, Math.min(1, v));

  // --- Normalization functions -----------------------------------
  // Each maps a real physical unit onto a 0–1 "environmental stress"
  // scale using thresholds drawn from standard meteorological /
  // air-quality references (e.g. IMD heavy-rain thresholds, US AQI
  // bands). These thresholds are documented assumptions, not claims
  // of scientific precision.

  function normRainfall(mmLastHour) {
    if (mmLastHour == null) return 0;
    // 0mm -> 0, >=50mm/hr (IMD "extremely heavy") -> 1
    return clamp01(mmLastHour / 50);
  }

  function normWind(kmh) {
    if (kmh == null) return 0;
    // 0 -> 0, >=90 km/h (severe storm-force gusts) -> 1
    return clamp01(kmh / 90);
  }

  function normHumidity(pct) {
    if (pct == null) return 0;
    // Stress rises above 70% humidity, saturates at 100%
    return clamp01((pct - 40) / 60);
  }

  function normPressureDeviation(hPa) {
    if (hPa == null) return 0;
    // Standard sea-level pressure ~1013 hPa; deviation of 25+ hPa
    // (as seen near deep low-pressure systems) -> 1
    return clamp01(Math.abs(hPa - 1013) / 25);
  }

  function normAQI(aqi) {
    if (aqi == null) return 0;
    // US AQI scale: 0 good -> 300+ hazardous
    return clamp01(aqi / 300);
  }

  function normTemperature(celsius) {
    if (celsius == null) return 0;
    // Heat stress ramps from 32°C, saturates near 47°C
    return clamp01((celsius - 32) / 15);
  }

  function normSeismic(nearbyQuakes, distanceKm = 300) {
    if (!nearbyQuakes || nearbyQuakes.length === 0) return 0;
    // Strongest nearby event drives the score; M4 -> ~0.4, M7+ -> 1
    const maxMag = Math.max(...nearbyQuakes.map(q => q.magnitude || 0));
    return clamp01(maxMag / 7);
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Computes ERI for one city's live reading.
   * cityData: output row from API.fetchLiveBatch / fetchLiveSingle
   * seismicEvents: full list from API.fetchSeismic (optional)
   */
  function computeERI(cityData, seismicEvents = []) {
    const nearby = seismicEvents.filter(q =>
      haversineKm(cityData.lat, cityData.lon, q.lat, q.lon) <= 300
    );

    const x = {
      rainfall: normRainfall(cityData.precipitation),
      wind: normWind(cityData.windSpeed),
      humidity: normHumidity(cityData.humidity),
      pressureDeviation: normPressureDeviation(cityData.pressure),
      aqi: normAQI(cityData.aqi),
      temperatureStress: normTemperature(cityData.temperature),
      seismicProximity: normSeismic(nearby)
    };

    let weightedSum = 0, weightTotal = 0;
    for (const key in WEIGHTS) {
      weightedSum += WEIGHTS[key] * x[key];
      weightTotal += WEIGHTS[key];
    }
    const eri = clamp01(weightedSum / weightTotal);
    const state = STATES.find(s => eri <= s.max);

    // Determine primary contributing factor for interpretability
    const contributions = Object.entries(x).map(([k, v]) => ({
      key: k, value: v, weighted: v * WEIGHTS[k]
    })).sort((a, b) => b.weighted - a.weighted);

    return {
      eri: Math.round(eri * 100) / 100,
      state: state.label,
      color: state.color,
      breakdown: x,
      primaryFactor: contributions[0].key,
      nearbySeismic: nearby
    };
  }

  /**
   * Hazard interpretation — turns raw signals into labeled hazard
   * cards, always phrased as "risk" / "potential", never certainty.
   */
  function assessHazards(cityData, eriResult) {
    const hazards = [];

    // Flood / heavy rainfall
    if (cityData.precipitation >= 30) hazards.push({ type: "Flood", risk: "High" });
    else if (cityData.precipitation >= 10) hazards.push({ type: "Flood", risk: "Moderate" });
    else hazards.push({ type: "Flood", risk: "Low" });

    // Waterlogging (moderate rain + already-humid ground signal)
    if (cityData.precipitation >= 15 && cityData.humidity >= 75) {
      hazards.push({ type: "Waterlogging", risk: "High" });
    } else if (cityData.precipitation >= 5) {
      hazards.push({ type: "Waterlogging", risk: "Moderate" });
    } else {
      hazards.push({ type: "Waterlogging", risk: "Low" });
    }

    // Wind storm — derived purely from real wind speed + pressure drop,
    // NOT from any tracked cyclone system.
    if (cityData.windSpeed >= 60 || (cityData.pressure && cityData.pressure < 995)) {
      hazards.push({ type: "Wind Storm", risk: "High" });
    } else if (cityData.windSpeed >= 35) {
      hazards.push({ type: "Wind Storm", risk: "Moderate" });
    } else {
      hazards.push({ type: "Wind Storm", risk: "Low" });
    }

    // Heat stress
    if (cityData.temperature >= 42) hazards.push({ type: "Heat Stress", risk: "High" });
    else if (cityData.temperature >= 37) hazards.push({ type: "Heat Stress", risk: "Moderate" });
    else hazards.push({ type: "Heat Stress", risk: "Low" });

    // Landslide proxy — heavy rainfall signal only, clearly caveated
    if (cityData.precipitation >= 40) hazards.push({ type: "Landslide", risk: "Moderate" });
    else hazards.push({ type: "Landslide", risk: "Low" });

    // Air quality
    if (cityData.aqi >= 200) hazards.push({ type: "Air Quality", risk: "High" });
    else if (cityData.aqi >= 100) hazards.push({ type: "Air Quality", risk: "Moderate" });
    else hazards.push({ type: "Air Quality", risk: "Low" });

    // Seismic — monitoring language only
    if (eriResult.nearbySeismic.length > 0) {
      const maxMag = Math.max(...eriResult.nearbySeismic.map(q => q.magnitude));
      hazards.push({
        type: "Seismic Activity",
        risk: maxMag >= 5 ? "Moderate" : "Low",
        note: `M${maxMag.toFixed(1)} recorded within 300km (monitoring only, not a prediction)`
      });
    }

    return hazards;
  }

  return { computeERI, assessHazards, STATES, WEIGHTS };
})();
