/**
 * AfriSafe AI — Bottom Navigation & App Shell Injector
 * Injects the mobile bottom tab bar and top header on authenticated pages.
 * Active tab is highlighted based on the current page filename.
 */

const NAV_ITEMS = [
  { label: "Dashboard", href: "dashboard.html", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>' },
  { label: "Assess", href: "assessment.html", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
  { label: "History", href: "history.html", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>' },
  { label: "Profile", href: "profile.html", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
  { label: "More", href: "more.html", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>' },
];

function getCurrentPage() {
  const path = window.location.pathname;
  return path.substring(path.lastIndexOf("/") + 1) || "dashboard.html";
}

function injectAppShell() {
  const page = getCurrentPage();

  // Wrap existing body content in app-shell if not already
  let shell = document.querySelector(".app-shell");
  if (!shell) {
    shell = document.createElement("div");
    shell.className = "app-shell";
    // Move all body children into shell
    while (document.body.firstChild) {
      shell.appendChild(document.body.firstChild);
    }
    document.body.appendChild(shell);
  }

  // Inject header if not present
  if (!shell.querySelector(".app-header")) {
    const header = document.createElement("header");
    header.className = "app-header";
    header.innerHTML = `
      <a href="dashboard.html" class="brand" style="text-decoration:none;color:inherit;">
        <div class="brand-logo"><img src="assets/gemini-svg.svg" alt="AfriSafe"></div>
        <span>AfriSafe <span class="brand-badge">AI</span></span>
      </a>
      <div class="header-spacer"></div>
      <button class="icon-btn" id="themeToggle" aria-label="Toggle dark mode">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
    `;
    shell.insertBefore(header, shell.firstChild);

    // Wire theme toggle
    const toggle = header.querySelector("#themeToggle");
    toggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("afrisafe_theme", next);
    });
  }

  // Inject bottom nav if not present
  if (!shell.querySelector(".bottom-nav")) {
    const nav = document.createElement("nav");
    nav.className = "bottom-nav";
    nav.setAttribute("aria-label", "Bottom navigation");
    nav.innerHTML = NAV_ITEMS.map((item) => {
      const isActive = item.href === page;
      return `<a href="${item.href}" class="nav-tab ${isActive ? "active" : ""}">${item.icon}<span>${item.label}</span></a>`;
    }).join("");
    shell.appendChild(nav);
  }

  // Apply saved theme
  const savedTheme = localStorage.getItem("afrisafe_theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }
}

// Run on DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectAppShell);
} else {
  injectAppShell();
}

window.injectAppShell = injectAppShell;
