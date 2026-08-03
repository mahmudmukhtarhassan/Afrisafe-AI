/**
 * AfriSafe AI — Bottom Navigation + App Shell Injector
 * Injects the header and bottom nav on all authenticated pages.
 */

const NAV_ITEMS = [
  {
    href: 'dashboard.html',
    label: 'Dashboard',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  },
  {
    href: 'assessment.html',
    label: 'Assess',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>',
  },
  {
    href: 'history.html',
    label: 'History',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>',
  },
  {
    href: 'profile.html',
    label: 'Profile',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  },
  {
    href: 'more.html',
    label: 'More',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  },
];

function getCurrentPage() {
  const path = window.location.pathname;
  return path.substring(path.lastIndexOf('/') + 1) || 'dashboard.html';
}

const LOGO_SVG = `<svg class="brand-logo" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="navLogoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0F9D58"/>
      <stop offset="1" stop-color="#1E88E5"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="12" fill="url(#navLogoGrad)"/>
  <path d="M24 12v24M12 24h24" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
</svg>`;

function injectAppShell() {
  const body = document.body;
  if (!body) return;

  // Wrap content in app-shell if not already
  let shell = document.querySelector('.app-shell');
  if (!shell) {
    shell = document.createElement('div');
    shell.className = 'app-shell';
    const main = document.querySelector('.app-main') || document.createElement('div');
    if (!main.classList.contains('app-main')) {
      main.classList.add('app-main');
    }
    while (body.firstChild && body.firstChild !== shell) {
      const node = body.firstChild;
      if (node.tagName === 'SCRIPT' || node.tagName === 'LINK' || node.tagName === 'STYLE' || node.tagName === 'META') break;
      shell.appendChild(node);
    }
    body.insertBefore(shell, body.firstChild);
  }

  // Inject header
  if (!document.querySelector('.app-header')) {
    const header = document.createElement('header');
    header.className = 'app-header';
    header.innerHTML = `
      <a href="dashboard.html" class="brand">
        ${LOGO_SVG}
        <span class="brand-text">AfriSafe AI</span>
      </a>
      <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
        <svg id="themeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      </button>
    `;
    body.insertBefore(header, shell);
  }

  // Inject bottom nav
  if (!document.querySelector('.bottom-nav')) {
    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    const currentPage = getCurrentPage();
    nav.innerHTML = NAV_ITEMS.map(item => `
      <a href="${item.href}" class="nav-tab ${item.href === currentPage ? 'active' : ''}">
        ${item.icon}
        <span>${item.label}</span>
      </a>
    `).join('');
    body.appendChild(nav);
  }

  // Wire theme toggle
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const sunIcon = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
  const moonIcon = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeIcon) themeIcon.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
  }

  const savedTheme = localStorage.getItem('afrisafe_theme') || 'light';
  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('afrisafe_theme', next);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectAppShell);
} else {
  injectAppShell();
}

window.injectAppShell = injectAppShell;
