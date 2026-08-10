/**
 * Minimal, dependency-free canvas chart helpers.
 * Kept intentionally simple (no external charting library) so the
 * project has zero build step and works by just opening the HTML.
 */

function drawLineChart(canvasId, labels, values, seriesName, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || canvas.parentElement.clientWidth;
  const cssH = canvas.height || 220;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);

  const pad = { top: 14, right: 14, bottom: 26, left: 34 };
  const w = cssW - pad.left - pad.right;
  const h = cssH - pad.top - pad.bottom;

  const validValues = values.filter(v => v != null && !isNaN(v));
  const maxV = Math.max(1, ...validValues) * 1.1;
  const minV = 0;

  const lineColor = color || getComputedStyle(document.documentElement).getPropertyValue("--green-primary").trim() || "#1f9d55";

  // gridlines
  ctx.strokeStyle = "#eef1ef";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (h / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + w, y); ctx.stroke();
    const val = (maxV - (maxV / 4) * i);
    ctx.fillStyle = "#8a968f"; ctx.font = "10px Inter, sans-serif";
    ctx.fillText(val.toFixed(2), 2, y + 3);
  }

  if (values.length < 2) return;

  const stepX = w / (values.length - 1);
  const points = values.map((v, i) => ({
    x: pad.left + stepX * i,
    y: pad.top + h - ((v ?? 0) - minV) / (maxV - minV) * h
  }));

  // filled area
  ctx.beginPath();
  ctx.moveTo(points[0].x, pad.top + h);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, pad.top + h);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + h);
  grad.addColorStop(0, lineColor + "33");
  grad.addColorStop(1, lineColor + "00");
  ctx.fillStyle = grad;
  ctx.fill();

  // line
  ctx.beginPath();
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2.2;
  ctx.lineJoin = "round";
  ctx.stroke();

  // dots
  points.forEach(p => {
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = lineColor; ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
  });

  // x labels
  ctx.fillStyle = "#8a968f"; ctx.font = "10px Inter, sans-serif"; ctx.textAlign = "center";
  labels.forEach((l, i) => {
    if (labels.length > 10 && i % Math.ceil(labels.length / 8) !== 0) return;
    ctx.fillText(l, points[i].x, cssH - 8);
  });
  ctx.textAlign = "left";
}

function drawMultiLineChart(canvasId, labels, series) {
  // series: [{name, values, color}]
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || canvas.parentElement.clientWidth;
  const cssH = canvas.height || 240;
  canvas.width = cssW * dpr; canvas.height = cssH * dpr;
  canvas.style.width = cssW + "px"; canvas.style.height = cssH + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);

  const pad = { top: 14, right: 14, bottom: 40, left: 36 };
  const w = cssW - pad.left - pad.right;
  const h = cssH - pad.top - pad.bottom;

  // normalize each series independently to 0-1 so different units (mm, %, km/h) are comparable on one chart
  const normed = series.map(s => {
    const valid = s.values.filter(v => v != null && !isNaN(v));
    const max = Math.max(1, ...valid);
    return { ...s, norm: s.values.map(v => v == null ? null : v / max) };
  });

  ctx.strokeStyle = "#eef1ef"; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (h / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + w, y); ctx.stroke();
  }

  const stepX = w / (labels.length - 1 || 1);

  normed.forEach(s => {
    const pts = s.norm.map((v, i) => ({ x: pad.left + stepX * i, y: pad.top + h - (v ?? 0) * h }));
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();
  });

  ctx.fillStyle = "#8a968f"; ctx.font = "10px Inter, sans-serif"; ctx.textAlign = "center";
  labels.forEach((l, i) => {
    if (labels.length > 10 && i % Math.ceil(labels.length / 8) !== 0) return;
    ctx.fillText(l, pad.left + stepX * i, cssH - 22);
  });
  ctx.textAlign = "left";

  // legend
  let lx = pad.left;
  ctx.font = "11px Inter, sans-serif";
  series.forEach(s => {
    ctx.fillStyle = s.color;
    ctx.fillRect(lx, cssH - 12, 8, 8);
    ctx.fillStyle = "#5b6b64";
    ctx.fillText(" " + s.name, lx + 10, cssH - 4);
    lx += ctx.measureText(s.name).width + 32;
  });
}

function drawDonut(canvasId, labels, values, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || canvas.parentElement.clientWidth;
  const cssH = canvas.height || 220;
  canvas.width = cssW * dpr; canvas.height = cssH * dpr;
  canvas.style.width = cssW + "px"; canvas.style.height = cssH + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);

  const total = values.reduce((a, b) => a + b, 0) || 1;
  const cx = cssW * 0.32, cy = cssH / 2, rOuter = Math.min(cssW * 0.28, cssH * 0.42), rInner = rOuter * 0.6;

  let start = -Math.PI / 2;
  values.forEach((v, i) => {
    const angle = (v / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, start, start + angle);
    ctx.arc(cx, cy, rInner, start + angle, start, true);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    start += angle;
  });

  ctx.fillStyle = "#1a2420";
  ctx.font = "bold 16px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(total, cx, cy + 5);
  ctx.font = "10px Inter, sans-serif";
  ctx.fillStyle = "#8a968f";
  ctx.fillText("cities", cx, cy + 18);
  ctx.textAlign = "left";

  // legend
  let ly = cssH / 2 - (labels.length * 20) / 2;
  labels.forEach((l, i) => {
    const pct = ((values[i] / total) * 100).toFixed(0);
    ctx.fillStyle = colors[i];
    ctx.fillRect(cssW * 0.6, ly, 10, 10);
    ctx.fillStyle = "#1a2420"; ctx.font = "bold 11.5px Inter, sans-serif";
    ctx.fillText(l, cssW * 0.6 + 16, ly + 9);
    ctx.fillStyle = "#8a968f"; ctx.font = "11px Inter, sans-serif";
    ctx.fillText(`${values[i]} (${pct}%)`, cssW * 0.6 + 16, ly + 22);
    ly += 34;
  });
}
