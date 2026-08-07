import { API_BASE_URL } from './config.js';
import { fetchWithAuth, clearTokens } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('reminderForm');
  if (form) {
    form.addEventListener('submit', createReminder);
  }

  loadReminders();
});

async function loadReminders() {
  const list = document.getElementById('reminderList');
  if (!list) return;

  list.innerHTML = `
    <div class="empty-state">
      <div class="icon">⏰</div>
      <div>Loading reminders...</div>
    </div>
  `;

  try {
    const resp = await fetchWithAuth(
      `${API_BASE_URL}/api/v1/reminders`,
      { method: 'GET' }
    );

    if (resp.status === 401) {
      clearTokens();
      window.location.href = 'login.html';
      return;
    }

    if (!resp.ok) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="icon">⚠️</div>
          <div>Reminders service is not available yet.</div>
        </div>
      `;
      return;
    }

    const result = await resp.json();
    const reminders = result.data || [];

    if (reminders.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="icon">🗓️</div>
          <div>You have no reminders yet.</div>
        </div>
      `;
      return;
    }

    list.innerHTML = '';

    reminders.forEach(reminder => {
      const card = document.createElement('div');
      card.className = 'reminder-card';

      card.innerHTML = `
        <div class="reminder-icon">⏰</div>

        <div class="reminder-content">
          <div class="reminder-title">${escapeHtml(reminder.title || 'Reminder')}</div>
          <div class="reminder-date">${formatDate(reminder.reminder_date)}</div>
        </div>
      `;

      list.appendChild(card);
    });

  } catch (err) {
    console.error(err);

    list.innerHTML = `
      <div class="empty-state">
        <div class="icon">🌐</div>
        <div>Network error. Please check your connection.</div>
      </div>
    `;
  }
}

async function createReminder(event) {
  event.preventDefault();

  const title = document.getElementById('title').value.trim();
  const reminderDate = document.getElementById('reminderDate').value;
  const statusMessage = document.getElementById('statusMessage');
  const saveBtn = document.getElementById('saveReminderBtn');

  if (!title || !reminderDate) return;

  saveBtn.disabled = true;
  statusMessage.textContent = 'Saving reminder...';

  try {
    const resp = await fetchWithAuth(
      `${API_BASE_URL}/api/v1/reminders`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          reminder_date: new Date(reminderDate).toISOString(),
        }),
      }
    );

    if (resp.status === 401) {
      clearTokens();
      window.location.href = 'login.html';
      return;
    }

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      statusMessage.textContent =
        data.detail || 'Unable to save reminder.';

      saveBtn.disabled = false;
      return;
    }

    statusMessage.textContent = 'Reminder saved successfully.';
    document.getElementById('reminderForm').reset();

    await loadReminders();

  } catch (err) {
    console.error(err);

    statusMessage.textContent =
      'Network error. Please try again.';

  } finally {
    saveBtn.disabled = false;
  }
}

function formatDate(value) {
  if (!value) return 'Unknown date';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
