'use strict';

// ============================================================
// GREETING & LIVE CLOCK
// ============================================================
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Good night';
}

function formatTime(d) {
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${String(h).padStart(2, '0')}:${m}:${s} ${ampm}`;
}

const greetEl = document.getElementById('greeting-text');
const clockEl = document.getElementById('live-clock');

if (greetEl) greetEl.textContent = getGreeting();
if (clockEl) {
  clockEl.textContent = formatTime(new Date());
  setInterval(() => { clockEl.textContent = formatTime(new Date()); }, 1000);
}

// ============================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================
function showToast(message, type = 'error', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.style.setProperty('--dur', `${duration / 1000}s`);
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.innerHTML = `
    <span class="toast-msg">${message}</span>
    <button class="toast-close" aria-label="Dismiss notification">&times;</button>
    <div class="toast-progress"></div>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentElement) toast.remove(); }, duration + 400);
}

// ============================================================
// SPAM KEYWORD DETECTION
// ============================================================
const SPAM_KEYWORDS = [
  'casino', 'lottery', 'viagra', 'cialis', 'crypto', 'bitcoin',
  'click here', 'earn money', 'free money', 'investment opportunity',
  'make money fast', 'work from home', '100% free', 'limited offer',
  'act now', 'winner', 'congratulations', 'claim your prize'
];

function containsSpam(text) {
  const t = text.toLowerCase();
  return SPAM_KEYWORDS.some(k => t.includes(k));
}

// ============================================================
// RATE LIMITING (max 3 submissions per minute)
// ============================================================
const rateLimit = { count: 0, lastReset: Date.now(), max: 3, window: 60000 };

function checkRateLimit() {
  const now = Date.now();
  if (now - rateLimit.lastReset > rateLimit.window) {
    rateLimit.count = 0;
    rateLimit.lastReset = now;
  }
  if (rateLimit.count >= rateLimit.max) return false;
  rateLimit.count++;
  return true;
}

// ============================================================
// FIELD VALIDATORS
// ============================================================
function validateName(val) {
  if (!val.trim())            return 'Full name is required.';
  if (val.trim().length < 2)  return 'Name must be at least 2 characters.';
  if (containsSpam(val))      return 'Invalid content detected in name.';
  return null;
}

function validateEmail(val) {
  if (!val.trim()) return 'Email address is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address.';
  return null;
}

function validateSubject(val) {
  if (!val.trim())           return 'Subject is required.';
  if (val.trim().length < 3) return 'Subject must be at least 3 characters.';
  if (containsSpam(val))     return 'Invalid content detected in subject.';
  return null;
}

function validateMessage(val) {
  if (!val.trim())            return 'Message is required.';
  if (val.trim().length < 10) return 'Message must be at least 10 characters.';
  if (containsSpam(val))      return 'Your message contains flagged content.';
  return null;
}

function setFieldState(inputEl, errorMsg) {
  const wrapper   = inputEl.closest('.mb-3') || inputEl.parentElement;
  const errEl     = wrapper.querySelector('.invalid-feedback');
  const validEl   = wrapper.querySelector('.valid-feedback');

  if (errorMsg) {
    inputEl.classList.add('is-invalid');
    inputEl.classList.remove('is-valid');
    if (errEl)   errEl.textContent    = errorMsg;
    if (validEl) validEl.style.display = 'none';
  } else {
    inputEl.classList.add('is-valid');
    inputEl.classList.remove('is-invalid');
    if (errEl)   errEl.textContent    = '';
    if (validEl) validEl.style.display = 'block';
  }
}

// ============================================================
// CONTACT FORM
// ============================================================
const form = document.getElementById('contactForm');

if (form) {
  const nameInput    = document.getElementById('name');
  const emailInput   = document.getElementById('email');
  const subjectInput = document.getElementById('subject');
  const msgInput     = document.getElementById('message');
  const submitBtn    = document.getElementById('submitBtn');
  const btnText      = document.getElementById('btnText');
  const btnSpinner   = document.getElementById('btnSpinner');
  const successMsg   = document.getElementById('successMessage');
  const valSummary   = document.getElementById('validationSummary');
  const valList      = document.getElementById('validationList');

  const formStartTime = Date.now();

  // Real-time validation on blur
  nameInput.addEventListener('blur',    () => setFieldState(nameInput,    validateName(nameInput.value)));
  emailInput.addEventListener('blur',   () => setFieldState(emailInput,   validateEmail(emailInput.value)));
  subjectInput.addEventListener('blur', () => setFieldState(subjectInput, validateSubject(subjectInput.value)));
  msgInput.addEventListener('blur',     () => setFieldState(msgInput,     validateMessage(msgInput.value)));

  // Clear invalid state on input
  [nameInput, emailInput, subjectInput, msgInput].forEach(el => {
    el.addEventListener('input', () => {
      if (el.classList.contains('is-invalid')) {
        el.classList.remove('is-invalid');
        const wrapper = el.closest('.mb-3') || el.parentElement;
        const errEl   = wrapper.querySelector('.invalid-feedback');
        if (errEl) errEl.textContent = '';
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Time-based spam filter (must take at least 2 seconds to fill form)
    if (Date.now() - formStartTime < 2000) {
      showToast('Please take a moment to fill out the form.', 'warning');
      return;
    }

    // Rate limit check
    if (!checkRateLimit()) {
      showToast('Too many messages sent. Please wait a minute before trying again.', 'error');
      return;
    }

    // Validate all fields
    const errors = {
      name:    validateName(nameInput.value),
      email:   validateEmail(emailInput.value),
      subject: validateSubject(subjectInput.value),
      message: validateMessage(msgInput.value),
    };

    setFieldState(nameInput,    errors.name);
    setFieldState(emailInput,   errors.email);
    setFieldState(subjectInput, errors.subject);
    setFieldState(msgInput,     errors.message);

    const errorList = Object.values(errors).filter(Boolean);

    if (errorList.length > 0) {
      if (valSummary && valList) {
        valList.innerHTML = errorList.map(err => `<li>${err}</li>`).join('');
        valSummary.style.display = 'block';
      }
      submitBtn.classList.add('error-pulse');
      setTimeout(() => submitBtn.classList.remove('error-pulse'), 400);
      showToast(`${errorList.length} error${errorList.length > 1 ? 's' : ''} found — please fix before sending.`, 'error');
      return;
    }

    if (valSummary) valSummary.style.display = 'none';

    // Show loading state
    btnText.style.display    = 'none';
    btnSpinner.style.display = 'inline-flex';
    submitBtn.disabled       = true;

    try {
      const response = await fetch(form.action, {
        method:  'POST',
        body:    new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        form.style.display = 'none';
        if (successMsg) successMsg.style.display = 'flex';
        showToast('Message sent successfully!', 'success', 5000);

        // Auto-reset after 6 seconds
        setTimeout(() => {
          form.reset();
          form.style.display = 'block';
          [nameInput, emailInput, subjectInput, msgInput].forEach(el => {
            el.classList.remove('is-valid', 'is-invalid');
          });
          if (successMsg) successMsg.style.display = 'none';
          btnText.style.display    = 'inline';
          btnSpinner.style.display = 'none';
          submitBtn.disabled       = false;
        }, 6000);
      } else {
        throw new Error('Server responded with an error.');
      }
    } catch {
      showToast('Failed to send message. Please try again later.', 'error');
      btnText.style.display    = 'inline';
      btnSpinner.style.display = 'none';
      submitBtn.disabled       = false;
    }
  });
}
