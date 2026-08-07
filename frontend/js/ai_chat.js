import { API_BASE_URL } from './config.js';
import { fetchWithAuth, clearTokens } from './auth.js';

const messages = document.getElementById('messages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const quickChips = document.querySelectorAll('.quick-chip');

document.addEventListener('DOMContentLoaded', () => {
  if (chatInput) chatInput.focus();

  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.dataset.message || chip.textContent.trim();
      chatInput.value = text;
      sendMessage(text);
    });
  });
});

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const text = chatInput.value.trim();
  if (!text) return;

  await sendMessage(text);
});

async function sendMessage(text) {
  addUserMessage(text);

  chatInput.value = '';
  chatInput.focus();

  setLoading(true);

  try {
    // Backend endpoint: /api/v1/ai_chat
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/v1/ai_chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text
        })
      }
    );

    if (response.status === 401) {
      clearTokens();
      window.location.href = 'login.html';
      return;
    }

    if (response.status === 404) {
      throw new Error('AI Chat endpoint not found on the server.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'AI service unavailable');
    }

    addAIMessage(
      data.reply ||
      'I’m sorry, I could not generate a response right now.'
    );

  } catch (err) {
    console.error(err);

    addAIMessage(
      err.message ||
      'I’m having trouble connecting to the AfriSafe AI service right now. Please try again in a moment.'
    );

  } finally {
    setLoading(false);
  }
}

function addUserMessage(text) {
  const message = document.createElement('div');
  message.className = 'message user';

  message.innerHTML = `
    <div class="avatar user">👤</div>
    <div class="bubble">${escapeHtml(text)}</div>
  `;

  messages.appendChild(message);
  scrollToBottom();
}

function addAIMessage(text) {
  const message = document.createElement('div');
  message.className = 'message ai';

  message.innerHTML = `
    <div class="avatar ai">🤖</div>
    <div class="bubble">${escapeHtml(text)}</div>
  `;

  messages.appendChild(message);
  scrollToBottom();
}

function setLoading(loading) {
  if (loading) {
    sendBtn.disabled = true;
    chatInput.disabled = true;
    typingIndicator.classList.add('active');
  } else {
    sendBtn.disabled = false;
    chatInput.disabled = false;
    typingIndicator.classList.remove('active');
  }

  scrollToBottom();
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    messages.scrollTop = messages.scrollHeight;
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
