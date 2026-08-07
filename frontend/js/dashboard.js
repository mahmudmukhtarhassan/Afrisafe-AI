import { API_BASE_URL } from './config.js';
import { fetchWithAuth, clearTokens } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
// ---------------------------
// Greeting
// ---------------------------
const hour = new Date().getHours();
let greeting = 'Welcome';

if (hour < 12) greeting = 'Good Morning';
else if (hour < 17) greeting = 'Good Afternoon';
else greeting = 'Good Evening';

document.getElementById('greetingTime').textContent = greeting;

// ---------------------------
// User Profile
// ---------------------------
try {
const meResp = await fetchWithAuth(`${API_BASE_URL}/api/v1/auth/me`);

```
if (meResp.ok) {
  const me = await meResp.json();
  const firstName = (me.full_name || me.email || 'User').split(' ')[0];
  document.getElementById('greetingName').textContent = firstName;
} else if (meResp.status === 401) {
  clearTokens();
  window.location.href = 'login.html';
  return;
}
```

} catch (err) {
console.error(err);
}

// ---------------------------
// Load Dashboard
// ---------------------------
await Promise.all([
loadHistory(),
updateHeaderBadges(),
]);
});

// =====================================================
// Prediction History
// =====================================================

async function loadHistory() {
try {
const resp = await fetchWithAuth(
`${API_BASE_URL}/api/v1/prediction/history`
);

```
if (!resp.ok) {
  document.getElementById('historyList').innerHTML =
    '<div class="empty-state">Failed to load history</div>';
  return;
}

const data = await resp.json();
const items = data.items || data || [];

const total = items.length;

const positive = items.filter(i =>
  (i.prediction || '').toLowerCase().includes('malaria') &&
  !(i.prediction || '').toLowerCase().includes('no')
).length;

const negative = total - positive;

const highRisk = items.filter(i =>
  (i.risk || '').toLowerCase() === 'high'
).length;

document.getElementById('statTotal').textContent = total;
document.getElementById('statPositive').textContent = positive;
document.getElementById('statNegative').textContent = negative;
document.getElementById('statHighRisk').textContent = highRisk;

// ---------------------------
// Health Score
// ---------------------------

let score = 85;

if (total > 0) {
  const latest = items[0];
  const confidence = parseFloat(latest.confidence || 0);

  const positiveResult =
    (latest.prediction || '').toLowerCase().includes('malaria') &&
    !(latest.prediction || '').toLowerCase().includes('no');

  score = positiveResult
    ? Math.max(20, Math.round(100 - confidence))
    : Math.min(100, Math.round(60 + confidence * 0.4));

  document.getElementById('healthStatus').textContent =
    `${latest.prediction || 'Unknown'} (${latest.risk || 'Low'} Risk)`;
} else {
  document.getElementById('healthStatus').textContent =
    'No assessments yet';
}

document.getElementById('healthScore').textContent = score;

const gauge = document.getElementById('gaugeFill');

if (gauge) {
  const circumference = 377;
  const offset = circumference - (score / 100) * circumference;
  gauge.style.strokeDashoffset = offset;
}

// ---------------------------
// Recent Activity
// ---------------------------

const list = document.getElementById('historyList');

if (items.length === 0) {
  list.innerHTML =
    '<div class="empty-state">No assessment history yet</div>';
  return;
}

list.innerHTML = '';

items.slice(0, 5).forEach(item => {
  const date = new Date(item.created_at).toLocaleString();

  const riskClass = (item.risk || 'low').toLowerCase();

  const positiveResult =
    (item.prediction || '').toLowerCase().includes('malaria') &&
    !(item.prediction || '').toLowerCase().includes('no');

  const row = document.createElement('div');
  row.className = 'activity-item';

  row.innerHTML = `
    <div class="activity-dot ${positiveResult ? 'red' : 'green'}">
      ${positiveResult ? '!' : '✔'}
    </div>

    <div class="activity-info">
      <div class="activity-title">
        ${item.prediction || 'Unknown'}
      </div>

      <div class="activity-time">
        ${date}
      </div>
    </div>

    <span class="risk-badge risk-${riskClass}">
      ${item.risk || 'Low'}
    </span>
  `;

  list.appendChild(row);
});
```

} catch (err) {
console.error(err);

```
document.getElementById('historyList').innerHTML =
  '<div class="empty-state">Unable to load activity</div>';
```

}
}

// =====================================================
// Header Badges
// =====================================================

async function updateHeaderBadges() {
// Notifications
try {
const nResp = await fetchWithAuth(
`${API_BASE_URL}/api/v1/notifications`
);

```
if (nResp.ok) {
  const nData = await nResp.json();

  const unread = (nData.data || []).filter(n => !n.read).length;

  const badge = document.getElementById('notificationBadge');

  if (badge) {
    if (unread > 0) {
      badge.textContent = unread;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}
```

} catch (err) {
console.error(err);
}

// Reminders
try {
const rResp = await fetchWithAuth(
`${API_BASE_URL}/api/v1/reminders`
);

```
if (rResp.ok) {
  const rData = await rResp.json();

  const count = (rData.data || []).length;

  const badge = document.getElementById('reminderBadge');

  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}
```

} catch (err) {
console.error(err);
}
}
