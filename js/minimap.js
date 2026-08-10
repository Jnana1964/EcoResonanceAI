/**
 * Small India overview map for the Dashboard page. Uses Leaflet with
 * OpenStreetMap tiles (free, no key). Markers are colored by each
 * city's live-computed ERI state.
 */
function renderMiniMap(cities) {
  const el = document.getElementById("miniMap");
  if (!el || typeof L === "undefined") return;
  el.innerHTML = "";

  const map = L.map(el, { zoomControl: false, attributionControl: false }).setView([22.5, 79.5], 4);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 10 }).addTo(map);

  cities.forEach(c => {
    L.circleMarker([c.lat, c.lon], {
      radius: 4,
      color: c.color,
      fillColor: c.color,
      fillOpacity: 0.85,
      weight: 1
    }).bindTooltip(`${c.name}: ERI ${c.eri.toFixed(2)} (${c.state})`).addTo(map);
  });
}
