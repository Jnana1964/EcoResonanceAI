/**
 * EcoResonance AI — Live Data Layer
 * ----------------------------------------------------------------
 * Every function here calls a real, free, key-less, CORS-enabled
 * public API. Nothing in this file returns hardcoded or simulated
 * values. If a fetch fails, the UI must show an error/empty state,
 * never a fake fallback number.
 *
 * Sources actually used:
 *   - Open-Meteo Forecast API      (weather)
 *   - Open-Meteo Air Quality API   (AQI, PM2.5, PM10)
 *   - Open-Meteo Archive API       (historical weather, for trends)
 *   - USGS Earthquake GeoJSON feed (seismic monitoring only —
 *     never used to predict anything)
 *
 * No satellite imagery, no cyclone-track feed, and no paid API is
 * used anywhere. Storm/cyclone risk is DERIVED from real wind speed
 * + pressure readings, not from an actual tracked storm system.
 */

const API = (() => {

  const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
  const AQI_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
  const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
  const USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson";

  // Open-Meteo allows batched lat/lon lists (comma separated) in ONE call.
  // This is what makes 130 real live cities feasible without hammering
  // the API with 130 separate requests.
  function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request failed (${res.status}): ${url}`);
    return res.json();
  }

  /**
   * Live current weather + AQI for a batch of cities.
   * Returns: [{ name, state, lat, lon, temperature, humidity, windSpeed,
   *              pressure, precipitation, weatherCode, aqi, pm2_5, pm10 }]
   */
  async function fetchLiveBatch(cities, onProgress) {
    const batches = chunk(cities, 40); // keep URLs a sane length
    const results = [];

    for (const batch of batches) {
      const lats = batch.map(c => c.lat).join(",");
      const lons = batch.map(c => c.lon).join(",");

      const weatherUrl = `${WEATHER_URL}?latitude=${lats}&longitude=${lons}` +
        `&current=temperature_2m,relative_humidity_2m,precipitation,` +
        `wind_speed_10m,wind_direction_10m,surface_pressure,weather_code,` +
        `cloud_cover&timezone=auto`;

      const aqiUrl = `${AQI_URL}?latitude=${lats}&longitude=${lons}` +
        `&current=us_aqi,pm2_5,pm10&timezone=auto`;

      const [weatherData, aqiData] = await Promise.all([
        fetchJSON(weatherUrl),
        fetchJSON(aqiUrl).catch(() => null) // AQI endpoint occasionally rate-limits; don't kill the whole batch
      ]);

      // Open-Meteo returns an array when multiple lat/lon are passed,
      // a single object when only one pair is passed.
      const wArr = Array.isArray(weatherData) ? weatherData : [weatherData];
      const aArr = aqiData ? (Array.isArray(aqiData) ? aqiData : [aqiData]) : [];

      batch.forEach((city, i) => {
        const w = wArr[i]?.current || {};
        const a = aArr[i]?.current || {};
        results.push({
          name: city.name,
          state: city.state,
          lat: city.lat,
          lon: city.lon,
          temperature: w.temperature_2m ?? null,
          humidity: w.relative_humidity_2m ?? null,
          precipitation: w.precipitation ?? null,
          windSpeed: w.wind_speed_10m ?? null,
          windDirection: w.wind_direction_10m ?? null,
          pressure: w.surface_pressure ?? null,
          weatherCode: w.weather_code ?? null,
          cloudCover: w.cloud_cover ?? null,
          aqi: a.us_aqi ?? null,
          pm2_5: a.pm2_5 ?? null,
          pm10: a.pm10 ?? null,
          fetchedAt: new Date().toISOString()
        });
      });

      if (onProgress) onProgress(results.length, cities.length);
    }

    return results;
  }

  /** Live data for a single city (used on Live Map / City detail panels) */
  async function fetchLiveSingle(city) {
    const r = await fetchLiveBatch([city]);
    return r[0];
  }

  /**
   * Historical daily weather for one city, real archive data.
   * days: how many days back from yesterday (Open-Meteo archive has
   * a short reporting lag, so we end at yesterday, not today).
   */
  async function fetchHistory(city, days = 7) {
    const end = new Date();
    end.setDate(end.getDate() - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));

    const fmt = d => d.toISOString().split("T")[0];

    const url = `${ARCHIVE_URL}?latitude=${city.lat}&longitude=${city.lon}` +
      `&start_date=${fmt(start)}&end_date=${fmt(end)}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,` +
      `wind_speed_10m_max,relative_humidity_2m_mean,surface_pressure_mean` +
      `&timezone=auto`;

    const data = await fetchJSON(url);
    const d = data.daily;
    if (!d || !d.time) return [];

    return d.time.map((date, i) => ({
      date,
      tempMax: d.temperature_2m_max?.[i] ?? null,
      tempMin: d.temperature_2m_min?.[i] ?? null,
      rainfall: d.precipitation_sum?.[i] ?? null,
      windMax: d.wind_speed_10m_max?.[i] ?? null,
      humidity: d.relative_humidity_2m_mean?.[i] ?? null,
      pressure: d.surface_pressure_mean?.[i] ?? null
    }));
  }

  /**
   * Real recent seismic activity from USGS, filtered to a bounding
   * box roughly covering India + neighbours. This is a MONITORING
   * signal only — never framed as prediction.
   */
  async function fetchSeismic() {
    const data = await fetchJSON(USGS_URL);
    const INDIA_BOUNDS = { latMin: 6, latMax: 37, lonMin: 68, lonMax: 98 };

    return (data.features || [])
      .map(f => ({
        id: f.id,
        place: f.properties.place,
        magnitude: f.properties.mag,
        time: new Date(f.properties.time).toISOString(),
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        depthKm: f.geometry.coordinates[2],
        url: f.properties.url
      }))
      .filter(q =>
        q.lat >= INDIA_BOUNDS.latMin && q.lat <= INDIA_BOUNDS.latMax &&
        q.lon >= INDIA_BOUNDS.lonMin && q.lon <= INDIA_BOUNDS.lonMax
      );
  }

  return { fetchLiveBatch, fetchLiveSingle, fetchHistory, fetchSeismic };
})();
