const SUPABASE_URL = 'https://jbwdnlnnrgpnolnlejgz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KOXR-fW63KpUzfVaiyC1QA_jv6HV08G';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const AUTH_ALIAS_KEY = 'ecosphere-auth-aliases';

let activeAuthTab = 'login';

document.addEventListener('DOMContentLoaded', async () => {
  setupForms();
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    window.location.href = 'index.html';
  }
});

function setupForms() {
  document.getElementById('auth-login-form').addEventListener('submit', handleLoginSubmit);
  document.getElementById('auth-signup-form').addEventListener('submit', handleSignupSubmit);
  document.getElementById('auth-forgot-form').addEventListener('submit', handleForgotSubmit);
  document.getElementById('auth-change-form').addEventListener('submit', handleChangeSubmit);
  switchAuthTab('login');
}

function switchAuthTab(tabId) {
  activeAuthTab = tabId;
  document.querySelectorAll('.auth-switcher-btn').forEach((button) => {
    button.classList.toggle('active', button.getAttribute('data-auth-tab') === tabId);
  });
  document.querySelectorAll('.auth-form-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `auth-${tabId}-form`);
  });
}

function setMessage(message, type = 'info') {
  const container = document.getElementById('auth-message');
  container.textContent = message;
  container.className = `auth-message-box ${type}`;
}

function getAliases() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_ALIAS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveAliases(aliases) {
  localStorage.setItem(AUTH_ALIAS_KEY, JSON.stringify(aliases));
}

function resolveEmail(identifier) {
  if (identifier.includes('@')) return identifier;
  const aliases = getAliases();
  return aliases[identifier] || '';
}

function isStrongPassword(password) {
  return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}/.test(password);
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const email = resolveEmail(document.getElementById('login-identifier').value.trim());
  const password = document.getElementById('login-password').value;

  if (!email) {
    setMessage('Use a valid email address or a saved employee ID.', 'error');
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    setMessage(error.message, 'error');
    return;
  }

  setMessage('Login successful. Redirecting...', 'success');
  window.location.href = 'index.html';
}

async function handleSignupSubmit(event) {
  event.preventDefault();
  const fullName = document.getElementById('signup-name').value.trim();
  const employeeId = document.getElementById('signup-employee-id').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const role = document.getElementById('signup-role').value;
  const password = document.getElementById('signup-password').value;

  if (!isStrongPassword(password)) {
    setMessage('Password does not meet the required policy.', 'error');
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        employee_id: employeeId,
        role
      }
    }
  });

  if (error) {
    setMessage(error.message, 'error');
    return;
  }

  const aliases = getAliases();
  aliases[employeeId] = email;
  saveAliases(aliases);

  if (data.session) {
    window.location.href = 'index.html';
    return;
  }

  const { error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (!signInError) {
    window.location.href = 'index.html';
    return;
  }

  setMessage('Account created. You can now log in with email and password.', 'success');
}

async function handleForgotSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('forgot-email').value.trim();
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login.html` });

  if (error) {
    setMessage(error.message, 'error');
    return;
  }

  setMessage('Reset instructions sent to your email.', 'success');
}

async function handleChangeSubmit(event) {
  event.preventDefault();
  const password = document.getElementById('change-password').value;
  const confirmPassword = document.getElementById('change-password-confirm').value;

  if (password !== confirmPassword) {
    setMessage('Passwords do not match.', 'error');
    return;
  }

  if (!isStrongPassword(password)) {
    setMessage('Password does not meet the required policy.', 'error');
    return;
  }

  const { error } = await supabaseClient.auth.updateUser({ password });
  if (error) {
    setMessage(error.message, 'error');
    return;
  }

  setMessage('Password updated successfully.', 'success');
}

window.switchAuthTab = switchAuthTab;