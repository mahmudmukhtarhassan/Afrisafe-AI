import { API_BASE_URL } from './config.js';
import { fetchWithAuth, clearTokens } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good Morning' :
    hour < 17 ? 'Good Afternoon' :
    'Good Evening';

  const greetingTime = document.getElementById('greetingTime');
  if (greetingTime) greetingTime.textContent = greeting;

  try {
    const meResp = await fetchWithAuth(`${API_BASE_URL}/api/v1/auth/me`);

    if (meResp.ok) {
      const me = await meResp.json();
      const greetingName = document.getElementById('greetingName');
      if (greetingName) {
        greetingName.textContent =
          (me.full_name || me.email || 'User').split(' ')[0];
      }
    } else if (meResp.status === 401) {
      clearTokens();
      window.location.href = 'login.html';
      return;
    }
  } catch (err) {
    console.error('User profile error:', err);
  }

  await Promise.all([
    loadHistory(),
    updateHeaderBadges()
  ]);
});

async function loadHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;

  list.innerHTML = '<div class="empty-state">Loading activity...</div>';

  try {
    const resp = await fetchWithAuth(
      `${API_BASE_URL}/api/v1/prediction/history`
    );

    if (resp.status === 401) {
      clearTokens();
      window.location.href = 'login.html';
      return;
    }

    if (!resp.ok) {
      list.innerHTML =
        '<div class="empty-state">Failed to load history.</div>';
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

    setText('statTotal', total);
    setText('statPositive', positive);
    setText('statNegative', negative);
    setText('statHighRisk', highRisk);

    let score = 85;

    if (total > 0) {
      const latest = items[0];
      const confidence = parseFloat(latest.confidence || 0);

      const isPositive =
        (latest.prediction || '').toLowerCase().includes('malaria') &&
        !(latest.prediction || '').toLowerCase().includes('no');

      score = isPositive
        ? Math.max(0, Math.round(100 - confidence))
        : Math.min(100, Math.round(60 + confidence * 0.4));

      setText(
        'healthStatus',
        `${latest.prediction || 'Unknown'} (${latest.risk || 'Low'} Risk)`
      );
    } else {
      setText('healthStatus', 'No assessments yet');
    }

    score = Math.max(0, Math.min(100, score));
    setText('healthScore', score);

    const gauge = document.getElementById('gaugeFill');
    if (gauge) {
      const circumference = 377;
      const offset = circumference - (score / 100) * circumference;
      requestAnimationFrame(() => {
        gauge.style.strokeDashoffset = offset;
      });
    }

    if (items.length === 0) {
      list.innerHTML =
        '<div class="empty-state">No assessment history yet.</div>';
      return;
    }

    list.innerHTML = '';

    items.slice(0, 5).forEach(item => {
      const date = new Date(item.created_at).toLocaleString();
      const riskClass = (item.risk || 'low').toLowerCase();

      const isPositive =
        (item.prediction || '').toLowerCase().includes('malaria') &&
        !(item.prediction || '').toLowerCase().includes('no');

      const row = document.createElement('a');
      row.href = 'history.html';
      row.className = 'activity-item';
      row.style.textDecoration = 'none';
      row.style.color = 'inherit';

      row.innerHTML = `
        <div class="activity-dot ${isPositive ? 'red' : 'green'}">
          ${isPositive ? '!' : '✔'}
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

  } catch (err) {
    console.error('History error:', err);

    list.innerHTML =
      '<div class="empty-state">Unable to load activity.</div>';
  }
}

async function updateHeaderBadges() {
  try {
    const nResp = await fetchWithAuth(
      `${API_BASE_URL}/api/v1/notifications`
    );

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
  } catch (err) {
    console.error(err);
  }

  try {
    const rResp = await fetchWithAuth(
      `${API_BASE_URL}/api/v1/reminders`
    );

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
  } catch (err) {
    console.error(err);
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
