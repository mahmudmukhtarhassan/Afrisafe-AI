import { API_BASE_URL } from './config.js';
import { fetchWithAuth, clearTokens } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetingTime = document.getElementById('greetingTime');
  if (greetingTime) greetingTime.textContent = greeting;

  try {
    const meResp = await fetchWithAuth(`${API_BASE_URL}/api/v1/auth/me`);
    if (meResp.ok) {
      const me = await meResp.json();
      const greetingName = document.getElementById('greetingName');
      if (greetingName) greetingName.textContent = (me.full_name || me.email || 'User').split(' ')[0];
    } else if (meResp.status === 401) {
      clearTokens();
      window.location.href = 'login.html';
      return;
    }
  } catch (err) {
    console.error(err);
  }

  await Promise.all([loadHistory(), updateHeaderBadges()]);
});

async function loadHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;
  list.innerHTML = '<div class="activity-item"><div class="activity-info"><div class="activity-title">Loading activity...</div><div class="activity-time">Please wait</div></div></div>';
}

async function updateHeaderBadges() {
  const notificationBadge = document.getElementById('notificationBadge');
  const reminderBadge = document.getElementById('reminderBadge');
  if (notificationBadge) notificationBadge.classList.add('hidden');
  if (reminderBadge) reminderBadge.classList.add('hidden');
}
