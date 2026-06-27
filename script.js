
/* ── STATE ──────────────────────────────────────────────── */
let cartCount = 3;
let isLoggedIn = false;
let billingAnnual = false;
const prices = {
  basic: [0, 0],
  pro: [4500, 3600],
  family: [9500, 7600]
};

/* ── ROUTING ────────────────────────────────────────────── */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + id);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function setActiveNav(active) {
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const el = document.getElementById('nav-' + active);
  if (el) el.classList.add('active');
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

/* ── AUTH ───────────────────────────────────────────────── */
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('tab-' + tab).setAttribute('aria-selected', 'true');
  document.getElementById('panel-' + tab).classList.add('active');
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(pw) {
  return pw.length >= 8;
}

function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pw = document.getElementById('login-password').value;
  let valid = true;

  if (!validateEmail(email)) {
    markError('login-email', 'Please enter a valid email address');
    valid = false;
  } else { clearError('login-email'); }

  if (!validatePassword(pw)) {
    markError('login-password', 'Password must be at least 8 characters');
    valid = false;
  } else { clearError('login-password'); }

  if (!valid) return;

  /* TODO: Replace with backend POST /api/auth/login
     Expected: { email, password } → JWT token
     Store token: localStorage.setItem('auth_token', token)
     Add CSRF token header for all subsequent requests */
  showToast('Signed in successfully! 🎉');
  isLoggedIn = true;
  document.getElementById('userAvatar').style.display = 'flex';
  setTimeout(() => { showPage('dashboard'); setActiveNav('dashboard'); }, 800);
}

function handleRegister() {
  const fname = document.getElementById('reg-fname').value.trim();
  const lname = document.getElementById('reg-lname').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pw = document.getElementById('reg-password').value;
  const terms = document.getElementById('terms').checked;
  let valid = true;

  if (!fname) { markError('reg-fname', 'First name is required'); valid = false; } else clearError('reg-fname');
  if (!lname) { markError('reg-lname', 'Last name is required'); valid = false; } else clearError('reg-lname');
  if (!validateEmail(email)) { markError('reg-email', 'Valid email required'); valid = false; } else clearError('reg-email');
  if (!validatePassword(pw)) { markError('reg-password', 'Min. 8 characters'); valid = false; } else clearError('reg-password');
  if (!terms) { showToast('Please accept the Terms of Service', 'error'); valid = false; }

  if (!valid) return;

  /* TODO: POST /api/auth/register
     Sanitize inputs server-side. Hash password (bcrypt/argon2).
     Send email verification. Rate-limit endpoint. */
  showToast('Account created! Check your email to verify. ✉️');
  setTimeout(() => switchAuthTab('login'), 1500);
}

function handleLogout() {
  /* TODO: POST /api/auth/logout — invalidate JWT server-side */
  isLoggedIn = false;
  document.getElementById('userAvatar').style.display = 'none';
  showPage('home'); setActiveNav('home');
  showToast('Signed out successfully.');
}

function markError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('error');
  let err = el.parentElement.querySelector('.form-error') || el.closest('.form-group')?.querySelector('.form-error');
  if (!err) {
    err = document.createElement('div');
    err.className = 'form-error';
    (el.closest('.input-group') || el).insertAdjacentElement('afterend', err);
  }
  err.textContent = msg;
}

function clearError(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('error');
  const err = el.closest('.form-group')?.querySelector('.form-error');
  if (err) err.textContent = '';
}

function togglePw(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

// Password strength meter
document.addEventListener('DOMContentLoaded', () => {
  const pwField = document.getElementById('reg-password');
  if (pwField) {
    pwField.addEventListener('input', () => {
      const v = pwField.value;
      let score = 0;
      if (v.length >= 8) score++;
      if (/[A-Z]/.test(v)) score++;
      if (/[0-9]/.test(v)) score++;
      if (/[^a-zA-Z0-9]/.test(v)) score++;
      const pct = score * 25;
      const fill = document.getElementById('pw-fill');
      if (fill) {
        fill.style.width = pct + '%';
        fill.style.background = pct <= 25 ? 'var(--red)' : pct <= 50 ? 'var(--yellow)' : 'var(--green)';
      }
    });
  }
});

/* ── CART ───────────────────────────────────────────────── */
function addToCart() {
  cartCount++;
  document.getElementById('cartCount').textContent = cartCount;
  showToast('Item added to cart 🛒');
}

/* ── PRESCRIPTIONS ──────────────────────────────────────── */
function filterRx(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('#rxCards .rx-card').forEach(card => {
    const name = card.dataset.name || '';
    card.style.display = name.includes(q) || q === '' ? '' : 'none';
  });
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) addUploadedFile(file);
}

function dragOver(e) {
  e.preventDefault();
  document.getElementById('uploadZone')?.classList.add('drag');
}

function dragLeave() {
  document.getElementById('uploadZone')?.classList.remove('drag');
}

function dropFile(e) {
  e.preventDefault();
  dragLeave();
  const file = e.dataTransfer.files[0];
  if (file) addUploadedFile(file);
}

function addUploadedFile(file) {
  const container = document.getElementById('uploadedFiles');
  if (!container) return;
  const size = (file.size / 1024).toFixed(1) + ' KB';
  const item = document.createElement('div');
  item.className = 'file-item';
  item.innerHTML = `<div class="file-item-icon">📄</div>
    <div class="file-item-name">${escapeHtml(file.name)}</div>
    <div class="file-item-size">${size}</div>
    <span class="badge badge-yellow">Pending Verification</span>
    <button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">✕</button>`;
  container.appendChild(item);
  showToast(`${file.name} uploaded. Awaiting pharmacist verification.`);
  /* TODO: POST /api/prescriptions/upload (multipart/form-data)
     Validate file type server-side. Virus scan. Store encrypted.
     Return prescription ID for status polling. */
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ── MODAL ──────────────────────────────────────────────── */
function openModal() {
  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('m-drug').focus();
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

function submitRx() {
  const drug = document.getElementById('m-drug').value.trim();
  if (!drug) { markError('m-drug', 'Medication name is required'); return; }
  /* TODO: POST /api/prescriptions
     { medicationName, doctorName, prescribedDate, dosage, documentId }
     Server validates doctor license, generates Rx record */
  showToast('Prescription submitted for verification! ✅');
  closeModal();
}

// Keyboard accessibility for modal
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

/* ── PRICING ────────────────────────────────────────────── */
function toggleBilling() {
  billingAnnual = !billingAnnual;
  const toggle = document.getElementById('billingToggle');
  toggle.classList.toggle('on', billingAnnual);
  toggle.setAttribute('aria-checked', billingAnnual.toString());
  const fmt = n => n === 0 ? '₦0' : '₦' + n.toLocaleString();
  const idx = billingAnnual ? 1 : 0;
  document.getElementById('price-basic').innerHTML = fmt(prices.basic[idx]) + '<span class="plan-period">/' + (billingAnnual?'yr':'mo') + '</span>';
  document.getElementById('price-pro').innerHTML = fmt(prices.pro[idx]) + '<span class="plan-period">/' + (billingAnnual?'yr':'mo') + '</span>';
  document.getElementById('price-family').innerHTML = fmt(prices.family[idx]) + '<span class="plan-period">/' + (billingAnnual?'yr':'mo') + '</span>';
}

/* ── CONTACT ────────────────────────────────────────────── */
function handleContact() {
  const name = document.getElementById('c-name').value.trim();
  const email = document.getElementById('c-email').value.trim();
  const msg = document.getElementById('c-msg').value.trim();
  if (!name || !validateEmail(email) || !msg) {
    showToast('Please fill in all required fields', 'error'); return;
  }
  /* TODO: POST /api/contact { name, email, subject, message }
     Rate-limit. CSRF token. Send to CRM/email service. */
  showToast('Message sent! We\'ll get back to you within 24h. 📨');
  document.getElementById('c-name').value = '';
  document.getElementById('c-email').value = '';
  document.getElementById('c-msg').value = '';
}

/* ── TOAST ──────────────────────────────────────────────── */
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type !== 'success' ? type : ''}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span style="font-size:18px">${type==='error'?'❌':type==='warning'?'⚠️':'✅'}</span>
    <div class="toast-text">${escapeHtml(msg)}</div>
    <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Dismiss">✕</button>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4500);
}

/* ── BILLING TOGGLE KEYBOARD ─────────────────────────────── */
document.getElementById('billingToggle')?.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleBilling(); }
});
