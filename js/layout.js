/**
 * Renders the shared sidebar + topbar shell on every page.
 * `active` = one of: dashboard, live-map, alerts, history
 */
function renderShell(active, pageTitle, pageSub) {
  const nav = [
    { key: "dashboard", href: "index.html", icon: "\u25A3", label: "Dashboard" },
    { key: "live-map", href: "live-map.html", icon: "\u25C9", label: "Live Map" },
    { key: "alerts", href: "alerts.html", icon: "\u26A0", label: "Alerts", badgeId: "sidebarAlertBadge" },
    { key: "history", href: "history.html", icon: "\u23F3", label: "History & Trends" }
  ];

  const navHTML = nav.map(n => `
    <a class="nav-item ${n.key === active ? "active" : ""}" href="${n.href}">
      <span class="icon">${n.icon}</span>
      <span>${n.label}</span>
      ${n.badgeId ? `<span class="nav-badge" id="${n.badgeId}">&nbsp;</span>` : ""}
    </a>
  `).join("");

  document.getElementById("shellRoot").innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-icon">\u{1F343}</div>
          <div>
            <div class="brand-name">EcoResonance AI</div>
            <div class="brand-sub">Real-Time Environmental Intelligence</div>
          </div>
        </div>
        <nav class="nav-group">${navHTML}</nav>
        <div class="sidebar-footer">
          <div class="earth-mood-card">
            <div class="earth-mood-label">Earth Mood (India avg.)</div>
            <div class="earth-mood-value" id="earthMoodState">Loading…</div>
            <div class="earth-mood-score" id="earthMoodScore">ERI —/1.00</div>
          </div>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <div class="search-box">
            <span>\u{1F50D}</span>
            <input id="citySearch" placeholder="Search city, state or region..." autocomplete="off" />
          </div>
          <div class="topbar-right">
            <span id="clockDisplay"></span>
            <span class="bell">\u{1F514}<span class="dot" id="topAlertDot">&nbsp;</span></span>
            <div class="avatar">AD</div>
          </div>
        </header>
        <main class="content">
          <div class="page-title">${pageTitle}</div>
          <div class="page-sub">${pageSub}</div>
          <div id="pageBody"></div>
        </main>
        <div class="footer-note">EcoResonance AI — data: Open-Meteo &amp; USGS, live. ERI is a project-defined composite indicator, not an official disaster probability.</div>
      </div>
    </div>
  `;

  // Live clock
  const clock = document.getElementById("clockDisplay");
  function tick() {
    const now = new Date();
    clock.textContent = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
      ", " + now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }
  tick(); setInterval(tick, 30000);

  // City search -> jump to Live Map with query param
  const search = document.getElementById("citySearch");
  search.addEventListener("keydown", e => {
    if (e.key === "Enter" && search.value.trim()) {
      window.location.href = `live-map.html?city=${encodeURIComponent(search.value.trim())}`;
    }
  });
}

function stateClass(state) {
  return "state-" + state.toLowerCase();
}

function stateColorVar(state) {
  return { Calm: "var(--calm)", Disturbed: "var(--disturbed)", Stressed: "var(--stressed)", Anxious: "var(--anxious)" }[state] || "var(--text-muted)";
}
