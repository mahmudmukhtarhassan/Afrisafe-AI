/** AfriSafe AI — shared app navigation. Keeps the same header, notification/reminder actions, bottom tabs and More drawer on every authenticated page. */

const NAV_ITEMS = [
  { href: 'dashboard.html', label: 'Dashboard', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10.5 12 3l9 7.5"></path><path d="M5 9.5V21h14V9.5"></path><path d="M9 21v-7h6v7"></path></svg>' },
  { href: 'assessment.html', label: 'Assess', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3h10v18H7z"></path><path d="M9.5 7h5M9.5 11h5M9.5 15h3"></path></svg>' },
  { href: 'history.html', label: 'History', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 4v5h5"></path><path d="M12 7v5l3 2"></path></svg>' },
  { href: 'profile.html', label: 'Profile', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path></svg>' },
  { href: '#', label: 'More', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>' }
];

const LOGO = `<div class="shared-logo-mark" aria-hidden="true"><span></span><span></span></div>`;
const BELL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';
const CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15.5 14"></polyline></svg>';

function currentPage() { return window.location.pathname.split('/').pop() || 'dashboard.html'; }

function injectStyles() {
  if (document.getElementById('shared-nav-styles')) return;
  const style = document.createElement('style');
  style.id = 'shared-nav-styles';
  style.textContent = `
    body{padding-bottom:calc(76px + env(safe-area-inset-bottom,0px))}
    .shared-app-header{position:sticky;top:0;z-index:150;max-width:560px;margin:0 auto;height:66px;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;background:rgba(7,18,26,.94);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,.07)}
    .shared-brand{display:flex;align-items:center;gap:9px;text-decoration:none;min-width:0}.shared-logo-mark{width:36px;height:36px;border-radius:11px;background:linear-gradient(135deg,#0F9D58,#1E88E5);display:flex;align-items:center;justify-content:center;gap:3px;box-shadow:0 5px 18px rgba(15,157,88,.2)}.shared-logo-mark span{display:block;width:4px;height:18px;background:#fff;border-radius:4px}.shared-logo-mark span+span{transform:rotate(90deg);margin-left:-7px}.shared-brand-name{font-size:17px;font-weight:800;color:#fff;white-space:nowrap}.shared-actions{display:flex;align-items:center;gap:8px}.shared-action{position:relative;width:40px;height:40px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:#0F1720;color:#fff;display:flex;align-items:center;justify-content:center;text-decoration:none}.shared-action svg{width:20px;height:20px}.shared-badge{position:absolute;top:-5px;right:-5px;min-width:17px;height:17px;border-radius:99px;background:#EF4444;color:#fff;font-size:9px;font-weight:800;display:none;align-items:center;justify-content:center;border:2px solid #07121A}.shared-badge.show{display:flex}
    .shared-bottom-nav{position:fixed;left:50%;bottom:0;transform:translateX(-50%);z-index:180;width:min(560px,100%);height:calc(76px + env(safe-area-inset-bottom,0px));padding:7px 8px env(safe-area-inset-bottom,0px);display:grid;grid-template-columns:repeat(5,1fr);gap:2px;background:rgba(8,16,23,.96);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid rgba(255,255,255,.09)}
    .shared-tab{border:0;background:transparent;color:#77818C;text-decoration:none;border-radius:13px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font:inherit;cursor:pointer}.shared-tab svg{width:21px;height:21px}.shared-tab span{font-size:9px;font-weight:700}.shared-tab.active{color:#42D48A;background:rgba(15,157,88,.1)}.shared-tab:active{transform:scale(.96)}
    .shared-drawer-backdrop{position:fixed;inset:0;z-index:190;background:rgba(0,0,0,.52);opacity:0;visibility:hidden;transition:.25s}.shared-drawer-backdrop.open{opacity:1;visibility:visible}.shared-drawer{position:fixed;right:0;top:0;z-index:200;width:min(320px,88vw);height:100dvh;padding:20px;background:#0B1720;border-left:1px solid rgba(255,255,255,.08);box-shadow:-20px 0 55px rgba(0,0,0,.4);transform:translateX(105%);transition:transform .28s ease}.shared-drawer.open{transform:translateX(0)}.shared-drawer-head{display:flex;align-items:center;justify-content:space-between;padding-bottom:18px;border-bottom:1px solid rgba(255,255,255,.08)}.shared-drawer-head strong{font-size:20px;color:#fff}.shared-drawer-head small{display:block;color:#94A3B8;margin-top:3px}.shared-close{width:38px;height:38px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:#16202B;color:#fff;font-size:25px}.shared-links{display:flex;flex-direction:column;gap:5px;padding-top:15px}.shared-links a{padding:13px 12px;border-radius:12px;color:#E5E7EB;text-decoration:none;font-size:13px;font-weight:650}.shared-links a:hover{background:rgba(15,157,88,.1);color:#42D48A}.shared-links .logout{color:#F87171;background:rgba(239,68,68,.08)}
    @media(min-width:700px){.shared-app-header{border-left:1px solid rgba(255,255,255,.06);border-right:1px solid rgba(255,255,255,.06)}.shared-bottom-nav{border-left:1px solid rgba(255,255,255,.08);border-right:1px solid rgba(255,255,255,.08);border-radius:18px 18px 0 0}}
  `;
  document.head.appendChild(style);
}

function injectAppShell() {
  injectStyles();
  // Remove legacy dashboard shell pieces so every page uses exactly one shared menu.
  document.querySelectorAll('.top-nav,.app-header').forEach(el => el.remove());
  document.querySelectorAll('.bottom-nav').forEach(el => el.remove());
  document.querySelectorAll('.side-menu,.drawer-backdrop').forEach(el => el.remove());

  const header = document.createElement('header');
  header.className = 'shared-app-header';
  header.innerHTML = `<a class="shared-brand" href="dashboard.html">${LOGO}<span class="shared-brand-name">AfriSafe AI</span></a><div class="shared-actions"><a class="shared-action" href="notifications.html" aria-label="Notifications">${BELL}<span id="sharedNotificationBadge" class="shared-badge"></span></a><a class="shared-action" href="reminders.html" aria-label="Reminders">${CLOCK}<span id="sharedReminderBadge" class="shared-badge"></span></a></div>`;
  document.body.insertBefore(header, document.body.firstChild);

  const nav = document.createElement('nav');
  nav.className = 'shared-bottom-nav';
  const page = currentPage();
  nav.innerHTML = NAV_ITEMS.map((item, i) => item.label === 'More'
    ? `<button type="button" class="shared-tab" id="sharedMoreBtn" aria-expanded="false">${item.icon}<span>More</span></button>`
    : `<a href="${item.href}" class="shared-tab ${page === item.href ? 'active' : ''}">${item.icon}<span>${item.label}</span></a>`).join('');
  document.body.appendChild(nav);

  const backdrop = document.createElement('div'); backdrop.className='shared-drawer-backdrop'; backdrop.id='sharedDrawerBackdrop';
  const drawer = document.createElement('aside'); drawer.className='shared-drawer'; drawer.id='sharedDrawer'; drawer.setAttribute('aria-hidden','true');
  drawer.innerHTML = `<div class="shared-drawer-head"><div><strong>More</strong><small>AfriSafe AI</small></div><button class="shared-close" id="sharedDrawerClose" aria-label="Close">×</button></div><nav class="shared-links"><a href="notifications.html">🔔 Notifications</a><a href="reminders.html">⏰ Reminders</a><a href="guidelines.html">🛡️ Prevention Guidelines</a><a href="ai_chat.html">🤖 AI Health Assistant</a><a href="reports.html">📊 Reports</a><a href="profile.html">👤 Profile</a><a href="settings.html">⚙️ Settings</a><a href="more.html">☰ More Features</a><a href="login.html" class="logout" id="sharedLogout">↪ Logout</a></nav>`;
  document.body.append(backdrop, drawer);

  const setOpen = open => { drawer.classList.toggle('open',open); backdrop.classList.toggle('open',open); drawer.setAttribute('aria-hidden',String(!open)); document.getElementById('sharedMoreBtn')?.setAttribute('aria-expanded',String(open)); };
  document.getElementById('sharedMoreBtn')?.addEventListener('click',()=>setOpen(!drawer.classList.contains('open')));
  document.getElementById('sharedDrawerClose')?.addEventListener('click',()=>setOpen(false));
  backdrop.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});

  updateBadges();
}

function updateBadges(){
  try{const n=JSON.parse(localStorage.getItem('afrisafe_notif_items')||'[]').filter(x=>!x.read).length; const b=document.getElementById('sharedNotificationBadge'); if(n){b.textContent=n>9?'9+':n;b.classList.add('show')}}catch{}
  try{const r=JSON.parse(localStorage.getItem('afrisafe_reminders')||'[]').length; const b=document.getElementById('sharedReminderBadge'); if(r){b.textContent=r>9?'9+':r;b.classList.add('show')}}catch{}
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',injectAppShell); else injectAppShell();
window.injectAppShell=injectAppShell;
