// EcoSphere Excalidraw UI Frontend Controller

let currentUser = 'Admin';
let activeView = 'dashboard';
let activeTab = 'env-factors';
let employeesList = [];
let systemConfig = {};
let activeCharts = {};
let appStarted = false;
let currentSession = null;
let currentAuthUser = null;
let currentAuthRole = 'Guest';
let activeAuthTab = 'login';

const SUPABASE_URL = 'https://jbwdnlnnrgpnolnlejgz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KOXR-fW63KpUzfVaiyC1QA_jv6HV08G';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const nativeFetch = window.fetch.bind(window);

const ROLE_PERMISSIONS = {
  Administrator: ['dashboard', 'environmental', 'social', 'governance', 'gamification', 'reports', 'settings'],
  'ESG Manager': ['dashboard', 'environmental', 'reports'],
  'HR Manager': ['dashboard', 'social', 'reports'],
  'Compliance Officer': ['dashboard', 'governance', 'reports'],
  'Department Head': ['dashboard', 'environmental', 'social'],
  Employee: ['dashboard', 'social', 'gamification']
};

// Keep track of selected rows
let selectedRowId = {
  'goals': null,
  'emission-factors': null,
  'products': null,
  'carbon-transactions': null,
  'departments': null,
  'categories': null,
  'compliance-issues': null,
  'csr-participation': null
};

const API_BASE = '/api';

// --- Page Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initNavigation();
  
  document.getElementById('notification-bell-btn').addEventListener('click', toggleNotificationsSlideout);
  document.getElementById('notif-close-btn').addEventListener('click', toggleNotificationsSlideout);
  
  // Set intervals to check compliance overdue items
  setInterval(refreshNotifications, 10000);
});

async function initAuth() {
  setupAuthForms();

  if (!supabaseClient) {
    setAuthMessage('Authentication client is unavailable.', 'error');
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  handleAuthState(data.session);

  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      switchAuthTab('change');
      setAuthMessage('Password recovery session detected. Set a new password to finish the reset.', 'info');
    }
    handleAuthState(session);
  });
}

function handleAuthState(session) {
  currentSession = session || null;
  const user = session?.user || null;
  currentAuthUser = user;
  currentAuthRole = normalizeRole(user?.user_metadata?.role || user?.app_metadata?.role || 'Employee');

  updateAuthSessionUi();
  applyRolePermissions();

  if (user) {
    if (user.user_metadata?.full_name) {
      currentUser = user.user_metadata.full_name;
    }
    loadGlobalConfig().then(async () => {
      // Fix #1: Provision employee record on first login if needed
      await provisionEmployeeIfNeeded();
      loadEmployeesSelector();
      enterApp();
      refreshNotifications();
      refreshView();
    });
    recordAuthEvent('login');
    setAuthMessage(`Signed in as ${currentAuthRole}.`, 'success');
    return;
  }

  appStarted = false;
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('welcome-screen').classList.remove('hidden');
}

window.fetch = async (input, init = {}) => {
  const requestUrl = typeof input === 'string' ? input : input?.url || '';
  const shouldAttachAuth = requestUrl.startsWith(API_BASE) || requestUrl.startsWith('/api/');

  if (!shouldAttachAuth || !supabaseClient) {
    return nativeFetch(input, init);
  }

  const { data } = await supabaseClient.auth.getSession();
  const token = data?.session?.access_token;
  const headers = new Headers(init.headers || (typeof input !== 'string' && input.headers) || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return nativeFetch(input, {
    ...init,
    headers
  });
};

async function recordAuthEvent(eventType) {
  if (!supabaseClient || !currentSession) return;

  const { data } = await supabaseClient.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) return;

  await nativeFetch(`${API_BASE}/auth/activity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      eventType,
      email: currentAuthUser?.email || '',
      role: currentAuthRole,
      userId: currentAuthUser?.id || ''
    })
  });
}

// Fix #1: Auto-provision employee record from Supabase metadata
async function provisionEmployeeIfNeeded() {
  if (!currentAuthUser || currentAuthRole === 'Administrator') return;

  const fullName = currentAuthUser.user_metadata?.full_name;
  if (!fullName) return;

  try {
    // Try to provision (idempotent — server won't duplicate)
    const pending = JSON.parse(localStorage.getItem('ecosphere-pending-provision') || 'null');
    await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fullName,
        department: 'Corporate',
        role: pending?.role || currentAuthRole || 'Employee'
      })
    });
    localStorage.removeItem('ecosphere-pending-provision');
  } catch (_) { /* non-blocking */ }
}

function setupAuthForms() {
  const loginForm = document.getElementById('auth-login-form');
  const signupForm = document.getElementById('auth-signup-form');
  const forgotForm = document.getElementById('auth-forgot-form');
  const changeForm = document.getElementById('auth-change-form');
  const logoutButton = document.getElementById('logout-btn');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignupSubmit);
  }
  if (forgotForm) {
    forgotForm.addEventListener('submit', handleForgotSubmit);
  }
  if (changeForm) {
    changeForm.addEventListener('submit', handleChangePasswordSubmit);
  }
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }

  switchAuthTab(activeAuthTab);
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

function setAuthMessage(message, type = 'info') {
  const container = document.getElementById('auth-message');
  if (!container) return;

  container.textContent = message || '';
  container.className = `auth-message-box ${type}`;
}

function updateAuthSessionUi() {
  const pill = document.getElementById('auth-session-pill');
  const label = document.getElementById('auth-role-label');
  const logoutButton = document.getElementById('logout-btn');

  if (!pill || !label || !logoutButton) return;

  if (currentSession && currentAuthUser) {
    pill.classList.remove('hidden');
    label.textContent = `${currentAuthRole} | ${currentAuthUser.email || 'Authenticated user'}`;
    logoutButton.disabled = false;
  } else {
    pill.classList.add('hidden');
  }
}

function normalizeRole(role) {
  const value = String(role || '').toLowerCase();

  if (value.includes('admin')) return 'Administrator';
  if (value.includes('esg')) return 'ESG Manager';
  if (value.includes('hr')) return 'HR Manager';
  if (value.includes('compliance') || value.includes('audit')) return 'Compliance Officer';
  if (value.includes('department')) return 'Department Head';
  return 'Employee';
}

function getAllowedViewsForRole(role) {
  return ROLE_PERMISSIONS[normalizeRole(role)] || ROLE_PERMISSIONS.Employee;
}

function isViewAllowed(viewName) {
  if (!currentSession) return viewName === 'dashboard' ? false : false;
  return getAllowedViewsForRole(currentAuthRole).includes(viewName);
}

function getViewNameFromLink(link) {
  const onclick = link.getAttribute('onclick') || '';
  const match = onclick.match(/switchView\('([^']+)'/);
  return match ? match[1] : null;
}

function getTabNameFromLink(link) {
  const onclick = link.getAttribute('onclick') || '';
  const match = onclick.match(/switchView\('([^']+)',\s*'([^']+)'\)/);
  return match ? match[2] : null;
}

function applyRolePermissions() {
  const allowedViews = new Set(getAllowedViewsForRole(currentAuthRole));

  document.querySelectorAll('.nav-tab-btn').forEach((button) => {
    const viewName = button.id.replace('tab-nav-', '');
    button.classList.toggle('hidden', !allowedViews.has(viewName));
  });

  document.querySelectorAll('.sidebar-link').forEach((link) => {
    const viewName = getViewNameFromLink(link);
    const listItem = link.closest('li');

    if (!viewName) return;

    if (allowedViews.has(viewName)) {
      link.classList.remove('hidden');
      if (listItem) listItem.classList.remove('hidden');
    } else {
      link.classList.add('hidden');
      if (listItem) listItem.classList.add('hidden');
    }
  });

  if (appStarted && !allowedViews.has(activeView)) {
    switchView('dashboard');
  }
}

function validateStrongPassword(password) {
  return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}/.test(password);
}

function getStoredAuthAliases() {
  try {
    return JSON.parse(localStorage.getItem('ecosphere-auth-aliases') || '{}');
  } catch {
    return {};
  }
}

function saveAuthAliases(aliases) {
  localStorage.setItem('ecosphere-auth-aliases', JSON.stringify(aliases));
}

function resolveLoginEmail(identifier) {
  if (identifier.includes('@')) return identifier;

  const aliases = getStoredAuthAliases();
  return aliases[identifier] || '';
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  if (!supabaseClient) {
    setAuthMessage('Authentication client is not ready.', 'error');
    return;
  }

  const identifier = document.getElementById('login-identifier').value.trim();
  const password = document.getElementById('login-password').value;
  const email = resolveLoginEmail(identifier);

  if (!email) {
    setAuthMessage('Use a valid email or a signed-up employee ID alias.', 'error');
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    setAuthMessage(error.message, 'error');
    return;
  }

  setAuthMessage('Login successful.', 'success');
}

async function handleSignupSubmit(event) {
  event.preventDefault();

  if (!supabaseClient) {
    setAuthMessage('Authentication client is not ready.', 'error');
    return;
  }

  const fullName = document.getElementById('signup-name').value.trim();
  const employeeId = document.getElementById('signup-employee-id').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const role = normalizeRole(document.getElementById('signup-role').value);
  const password = document.getElementById('signup-password').value;

  if (!validateStrongPassword(password)) {
    setAuthMessage('Password does not meet the required policy.', 'error');
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
    setAuthMessage(error.message, 'error');
    return;
  }

  const aliases = getStoredAuthAliases();
  aliases[employeeId] = email;
  saveAuthAliases(aliases);

  // Fix #1: Auto-provision employee record on signup
  const newName = fullName;
  if (newName && data.session) {
    // Immediately provision if session is available
    try {
      await fetch(`${API_BASE}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ name: newName, department: 'Corporate', role })
      });
    } catch (_) { /* non-blocking */ }
  } else if (newName) {
    // Store provisioning info for first login
    localStorage.setItem('ecosphere-pending-provision', JSON.stringify({ name: newName, role }));
  }

  if (data.session) {
    setAuthMessage('Account created and signed in.', 'success');
  } else {
    setAuthMessage('Account created. Check your email to verify the account before signing in.', 'success');
  }
}

async function handleForgotSubmit(event) {
  event.preventDefault();

  if (!supabaseClient) {
    setAuthMessage('Authentication client is not ready.', 'error');
    return;
  }

  const email = document.getElementById('forgot-email').value.trim();
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    setAuthMessage(error.message, 'error');
    return;
  }

  setAuthMessage('Password reset instructions sent to your email.', 'success');
}

async function handleChangePasswordSubmit(event) {
  event.preventDefault();

  if (!supabaseClient) {
    setAuthMessage('Authentication client is not ready.', 'error');
    return;
  }

  const password = document.getElementById('change-password').value;
  const confirmPassword = document.getElementById('change-password-confirm').value;

  if (password !== confirmPassword) {
    setAuthMessage('Passwords do not match.', 'error');
    return;
  }

  if (!validateStrongPassword(password)) {
    setAuthMessage('Password does not meet the required policy.', 'error');
    return;
  }

  const { error } = await supabaseClient.auth.updateUser({ password });
  if (error) {
    setAuthMessage(error.message, 'error');
    return;
  }

  setAuthMessage('Password updated successfully.', 'success');
}

async function handleLogout() {
  await recordAuthEvent('logout');
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }

  currentSession = null;
  currentAuthUser = null;
  currentAuthRole = 'Guest';
  currentUser = 'Admin';
  appStarted = false;
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('welcome-screen').classList.remove('hidden');
  updateAuthSessionUi();
  applyRolePermissions();
  setAuthMessage('Signed out.', 'info');
}

function enterApp() {
  if (!currentSession) {
    switchAuthTab('login');
    return;
  }

  appStarted = true;
  document.getElementById('welcome-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  refreshView();
  refreshNotifications();
}

// --- Navigation Engine ---
function initNavigation() {
  // No manual user switcher: RBAC derives from authenticated session.
}

// Router to switch view and optional subtab
function switchView(targetView, targetTab = null) {
  if (!isViewAllowed(targetView)) {
    showToast('This section is not available for your role.', 'error');
    return;
  }

  activeView = targetView;
  
  // Set main nav tab state
  const tabs = document.querySelectorAll('.nav-tab-btn');
  tabs.forEach(t => {
    if (t.id === `tab-nav-${targetView}`) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });

  // Set sidebar active state
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  sidebarLinks.forEach(link => {
    const isDashboard = targetView === 'dashboard' && link.innerText.includes('Dashboard');
    const linkView = getViewNameFromLink(link);
    const linkTab = getTabNameFromLink(link);
    const isMatch = linkView === targetView && (targetTab ? linkTab === targetTab : !linkTab);
    if (isDashboard || isMatch) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Toggle panel view
  const panels = document.querySelectorAll('.view-panel');
  panels.forEach(p => p.classList.remove('active'));
  const activePanel = document.getElementById(`view-${targetView}`);
  if (activePanel) {
    activePanel.classList.add('active');
  }

  // Update dynamic titles
  const headerTitle = document.getElementById('wireframe-view-title');
  const windowTitle = document.getElementById('window-title-text');
  
  let headerText = '';
  let windowText = '';

  switch (targetView) {
    case 'dashboard':
      headerText = '① Overview: Analytics Dashboard';
      windowText = 'EcoSphere: Dashboard';
      break;
    case 'environmental':
      headerText = '② Environmental: Emission Tracking & Goals';
      windowText = 'EcoSphere: Environmental';
      break;
    case 'social':
      headerText = '③ Social: CSR & Employee Engagement';
      windowText = 'EcoSphere: Social';
      break;
    case 'governance':
      headerText = '④ Governance: Policies, Audits & Compliance';
      windowText = 'EcoSphere: Governance';
      break;
    case 'gamification':
      headerText = '⑤ Gamification: Challenges, Badges & Leaderboard';
      windowText = 'EcoSphere: Gamification';
      break;
    case 'reports':
      headerText = '⑥ Reports: Analytics & Custom Report Builder';
      windowText = 'EcoSphere: Reports';
      break;
    case 'settings':
      headerText = '⑦ Settings: Configuration & Administration';
      windowText = 'EcoSphere: Settings';
      break;
  }

  headerTitle.innerText = headerText;
  windowTitle.innerText = windowText;

  // Resolve subtabs
  if (targetTab) {
    switchSubTab(targetTab);
  } else {
    // Select first subtab button inside active panel
    if (activePanel) {
      const firstSubtabBtn = activePanel.querySelector('.subtab-btn-sketch');
      if (firstSubtabBtn) {
        const tabId = firstSubtabBtn.id.replace('subtab-', '');
        switchSubTab(tabId);
      }
    }
  }
}

function switchSubTab(tabId) {
  activeTab = tabId;

  // Set subtab button state
  const activePanel = document.getElementById(`view-${activeView}`);
  if (activePanel) {
    const btns = activePanel.querySelectorAll('.subtab-btn-sketch');
    btns.forEach(btn => {
      if (btn.id === `subtab-${tabId}`) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Toggle subtab body block
    const contents = activePanel.querySelectorAll('.tab-content-sketch');
    contents.forEach(content => {
      if (content.id === `tab-${tabId}`) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }

  // Clear selections
  const selectedKeys = Object.keys(selectedRowId);
  selectedKeys.forEach(k => selectedRowId[k] = null);

  refreshView();
}

function refreshView() {
  if (activeView === 'dashboard') {
    loadDashboardScores();
    loadDashboardCharts();
    loadRecentActivities();
  } else {
    loadTabData(activeTab);
  }
}

// --- Fetch Configurations ---
async function loadGlobalConfig() {
  try {
    const res = await fetch(`${API_BASE}/config`);
    systemConfig = await res.json();
  } catch (err) {
    console.error(err);
  }
}

async function loadEmployeesSelector() {
  try {
    const res = await fetch(`${API_BASE}/employees`);
    employeesList = await res.json();

    if (currentAuthUser?.user_metadata?.full_name) {
      currentUser = currentAuthUser.user_metadata.full_name;
    }

    updateUserBadgeDisplay();
  } catch (err) {
    console.error(err);
  }
}

function updateUserBadgeDisplay() {
  const pointsBadge = document.getElementById('user-points-badge');
  if (currentUser === 'Admin') {
    pointsBadge.classList.add('hidden');
    return;
  }
  
  const emp = employeesList.find(e => e.name.toLowerCase() === currentUser.toLowerCase());
  if (emp) {
    pointsBadge.classList.remove('hidden');
    document.getElementById('user-xp').innerHTML = `<i class="fa-solid fa-bolt text-warning"></i> ${emp.xp || 0} XP`;
    document.getElementById('user-pts').innerHTML = `<i class="fa-solid fa-coins text-accent"></i> ${emp.points || 0} Points`;
  } else {
    pointsBadge.classList.add('hidden');
  }
}

// --- Load Content by Subtab ID ---
function loadTabData(tabId) {
  switch (tabId) {
    case 'env-factors':
      loadEmissionFactors();
      break;
    case 'env-products':
      loadProducts();
      break;
    case 'env-transactions':
      loadCarbonTransactions();
      break;
    case 'env-goals':
      loadEnvironmentalGoals();
      break;
      
    case 'soc-activities':
      loadCsrActivities();
      break;
    case 'soc-participation':
      loadCsrParticipationQueue();
      break;
    case 'soc-diversity':
      loadSocialDiversityMetrics();
      break;
      
    case 'gov-policies':
      loadPolicies();
      break;
    case 'gov-acknowledgements':
      loadPolicyAcknowledgements();
      break;
    case 'gov-audits':
      loadAudits();
      break;
    case 'gov-compliance':
      loadComplianceIssues();
      break;
      
    case 'gam-challenges':
      loadChallenges();
      break;
    case 'gam-participation':
      loadChallengeParticipationQueue();
      break;
    case 'gam-badges':
      loadBadges();
      break;
    case 'gam-rewards':
      loadRewards();
      break;
    case 'gam-leaderboard':
      loadLeaderboards();
      break;
      
    case 'rep-summary':
      loadSummaryReport();
      break;
    case 'rep-custom':
      loadCustomReportBuilderFilters();
      break;

    case 'set-departments':
      loadSettingsDepartments();
      break;
    case 'set-categories':
      loadSettingsCategories();
      break;
    case 'set-configuration':
      loadSettingsWeightsConfiguration();
      break;
    case 'set-notifications':
      loadSettingsNotifications();
      break;
  }
}

// --- Row Select helper ---
function bindRowSelection(tableId, stateKey) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  
  tbody.addEventListener('click', (e) => {
    const tr = e.target.closest('tr');
    if (!tr || tr.cells.length <= 1 && tr.cells[0].classList.contains('text-center')) return;

    const id = tr.getAttribute('data-id');
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(r => r.classList.remove('selected'));
    
    if (selectedRowId[stateKey] === id) {
      selectedRowId[stateKey] = null; // Toggle off
    } else {
      tr.classList.add('selected');
      selectedRowId[stateKey] = id;
    }
  });
}

// ==========================================
// 1. DASHBOARD MODULES
// ==========================================
async function loadDashboardScores() {
  try {
    const res = await fetch(`${API_BASE}/scores`);
    const data = await res.json();
    document.getElementById('score-env').innerText = data.overall.environmental;
    document.getElementById('score-soc').innerText = data.overall.social;
    document.getElementById('score-gov').innerText = data.overall.governance;
    document.getElementById('score-overall').innerText = data.overall.overall;
  } catch (err) {
    console.error(err);
  }
}

async function loadDashboardCharts() {
  try {
    const scoresRes = await fetch(`${API_BASE}/scores`);
    const scoresData = await scoresRes.json();
    
    const txRes = await fetch(`${API_BASE}/carbon-transactions`);
    const txData = await txRes.json();
    
    renderDepartmentScoresChart(scoresData.departments);
    renderEmissionsTrendChart(txData);
  } catch (err) {
    console.error(err);
  }
}

function renderDepartmentScoresChart(depts) {
  const ctx = document.getElementById('departmentScoresChart').getContext('2d');
  if (activeCharts.dept) activeCharts.dept.destroy();
  
  activeCharts.dept = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: depts.map(d => d.department),
      datasets: [
        {
          label: 'Environmental',
          data: depts.map(d => d.environmentalScore),
          backgroundColor: '#59b259',
          borderColor: '#ffffff',
          borderWidth: 1.5
        },
        {
          label: 'Social',
          data: depts.map(d => d.socialScore),
          backgroundColor: '#3b82f6',
          borderColor: '#ffffff',
          borderWidth: 1.5
        },
        {
          label: 'Governance',
          data: depts.map(d => d.governanceScore),
          backgroundColor: '#a855f7',
          borderColor: '#ffffff',
          borderWidth: 1.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { color: '#ffffff' } },
        x: { ticks: { color: '#ffffff' } }
      },
      plugins: {
        legend: { labels: { color: '#ffffff' } }
      }
    }
  });
}

function renderEmissionsTrendChart(transactions) {
  const ctx = document.getElementById('emissionsTrendChart').getContext('2d');
  if (activeCharts.emissions) activeCharts.emissions.destroy();

  const months = [];
  const emissionsByMonth = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleString('default', { month: 'short' });
    months.push(label);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    emissionsByMonth[key] = { label, val: 0 };
  }

  transactions.forEach(tx => {
    const txDate = new Date(tx.transactionDate);
    const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
    if (emissionsByMonth[key]) {
      emissionsByMonth[key].val += tx.calculatedEmission || 0;
    }
  });

  activeCharts.emissions = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Emissions (kg CO2)',
        data: months.map(m => {
          const match = Object.values(emissionsByMonth).find(v => v.label === m);
          return match ? Number(match.val.toFixed(1)) : 0;
        }),
        borderColor: '#59b259',
        backgroundColor: 'rgba(89, 178, 89, 0.1)',
        fill: true,
        borderWidth: 2.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { ticks: { color: '#ffffff' } },
        x: { ticks: { color: '#ffffff' } }
      },
      plugins: {
        legend: { labels: { color: '#ffffff' } }
      }
    }
  });
}

async function loadRecentActivities() {
  try {
    const res = await fetch(`${API_BASE}/notifications`);
    const notifications = await res.json();
    const container = document.getElementById('dashboard-activities');
    container.innerHTML = '';
    
    notifications.slice(0, 4).forEach(n => {
      let code = 'Gam';
      if (n.type === 'Compliance' || n.type === 'Overdue') code = 'G';
      if (n.type === 'Badge') code = 'Gam';
      if (n.type === 'Approval' || n.type === 'Redemption') code = 'S';

      const div = document.createElement('div');
      div.className = 'activity-item';
      div.innerHTML = `
        <div class="activity-dot ${code}"></div>
        <div class="activity-text">
          <p>${n.message}</p>
          <span class="activity-time">${formatTimeAgo(n.timestamp)}</span>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

// ==========================================
// 2. ENVIRONMENTAL DATA LOADERS
// ==========================================

async function loadEmissionFactors() {
  try {
    const res = await fetch(`${API_BASE}/emission-factors`);
    const data = await res.json();
    const tbody = document.querySelector('#emission-factors-table tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', item.id);
      tr.innerHTML = `
        <td><b>${item.activity}</b></td>
        <td><span class="status-pill-sketch completed">${item.scope}</span></td>
        <td>${item.value}</td>
        <td>kg CO2 per ${item.unit}</td>
        <td><span class="status-pill-sketch ${item.status.toLowerCase()}">${item.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
    bindRowSelection('emission-factors-table', 'emission-factors');
  } catch (err) {
    console.error(err);
  }
}

async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    const data = await res.json();
    const tbody = document.querySelector('#products-table tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', item.id);
      tr.innerHTML = `
        <td><b>${item.name}</b></td>
        <td><code>${item.code}</code></td>
        <td>${item.carbonFootprint} kg</td>
        <td>
          <div class="progress-bar-bg" style="width: 100px; height: 16px;">
            <div class="progress-bar-fill" style="width: ${item.recyclability}%; height: 100%;"></div>
          </div>
          <span style="font-size:11px; margin-top:2px; display:block;">${item.recyclability}% Recyclable</span>
        </td>
        <td><span class="status-pill-sketch ${item.ethicalSourcing.toLowerCase() === 'yes' ? 'active' : 'behind'}">${item.ethicalSourcing}</span></td>
        <td><span class="status-pill-sketch ${item.status.toLowerCase()}">${item.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
    bindRowSelection('products-table', 'products');
  } catch (err) {
    console.error(err);
  }
}

async function loadCarbonTransactions() {
  try {
    const res = await fetch(`${API_BASE}/carbon-transactions`);
    const data = await res.json();
    const tbody = document.querySelector('#carbon-transactions-table tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', item.id);
      tr.innerHTML = `
        <td><code>${item.id.slice(-6)}</code></td>
        <td>${item.sourceType}</td>
        <td>${item.value} ${item.unit}</td>
        <td><b>${item.calculatedEmission} kg CO2</b></td>
        <td>${item.department}</td>
        <td>${item.transactionDate}</td>
        <td><code>${item.associatedRecordId}</code></td>
        <td><span class="status-pill-sketch ${item.autoGenerated ? 'completed' : 'pending'}">${item.autoGenerated ? 'Auto-ERP' : 'Manual'}</span></td>
      `;
      tbody.appendChild(tr);
    });
    bindRowSelection('carbon-transactions-table', 'carbon-transactions');
  } catch (err) {
    console.error(err);
  }
}

async function loadEnvironmentalGoals() {
  try {
    const res = await fetch(`${API_BASE}/goals`);
    const data = await res.json();
    const tbody = document.querySelector('#goals-table tbody');
    tbody.innerHTML = '';

    data.forEach(g => {
      const progress = g.targetCO2 > 0 ? Math.min(Math.round((g.currentCO2 / g.targetCO2) * 100), 100) : 100;
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', g.id);
      tr.innerHTML = `
        <td><b>${g.name}</b></td>
        <td>${g.department}</td>
        <td>${g.targetCO2} t</td>
        <td>${g.currentCO2} t</td>
        <td>
          <div class="progress-bar-bg" style="width: 100px; height: 16px;">
            <div class="progress-bar-fill" style="width: ${progress}%; height: 100%; background-color: ${g.status === 'Completed' ? 'var(--color-soc)' : 'var(--color-env)'}"></div>
          </div>
          <span style="font-size:11px; margin-top:2px; display:block;">${progress}% achieved</span>
        </td>
        <td>${g.deadline}</td>
        <td><span class="status-pill-sketch ${g.status.toLowerCase().replace(' ', '-')}">${g.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
    bindRowSelection('goals-table', 'goals');
  } catch (err) {
    console.error(err);
  }
}

function searchGoalsTable() {
  const input = document.getElementById('goal-search-input');
  const filter = input.value.toLowerCase();
  const rows = document.querySelectorAll('#goals-table tbody tr');
  
  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    if (text.includes(filter)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

function exportGoalData(format = 'csv') {
  if (format === 'json') {
    // Fix #3: JSON export — fetch live data
    fetch(`${API_BASE}/goals`)
      .then(r => r.json())
      .then(goals => {
        const blob = new Blob([JSON.stringify(goals, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'EcoSphere_Goals_Export.json';
        link.click();
        URL.revokeObjectURL(url);
        showToast('Goals exported as JSON.', 'success');
      })
      .catch(() => showToast('Export failed.', 'danger'));
    return;
  }
  // CSV export — fetch live data
  fetch(`${API_BASE}/goals`)
    .then(r => r.json())
    .then(goals => {
      const header = 'Goal,Department,Target CO2 (t),Current CO2 (t),Deadline,Status';
      const rows = goals.map(g =>
        `"${g.name}","${g.department}",${g.targetCO2},${g.currentCO2},${g.deadline},"${g.status}"`
      );
      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([header, ...rows].join('\n'));
      const link = document.createElement('a');
      link.setAttribute('href', csvContent);
      link.setAttribute('download', 'EcoSphere_Goals_Export.csv');
      link.click();
      showToast('Goals exported as CSV.', 'success');
    })
    .catch(() => showToast('Export failed.', 'danger'));
}

// Edit or Delete selected row handles
function editSelectedRow(moduleKey) {
  const selectedId = selectedRowId[moduleKey];
  if (!selectedId) {
    showToast('Please select a row in the table first!', 'warning');
    return;
  }

  if (moduleKey === 'goals') openGoalModal(selectedId);
  if (moduleKey === 'emission-factors') openEmissionFactorModal(selectedId);
  if (moduleKey === 'products') openProductModal(selectedId);
  if (moduleKey === 'departments') openDepartmentModal(selectedId);
}

async function deleteSelectedRow(moduleKey) {
  const selectedId = selectedRowId[moduleKey];
  if (!selectedId) {
    showToast('Please select a row first!', 'warning');
    return;
  }

  if (confirm('Are you sure you want to delete the selected item?')) {
    let url = '';
    if (moduleKey === 'goals') url = `${API_BASE}/goals/${selectedId}`;
    if (moduleKey === 'emission-factors') url = `${API_BASE}/emission-factors/${selectedId}`;
    if (moduleKey === 'products') url = `${API_BASE}/products/${selectedId}`;
    if (moduleKey === 'carbon-transactions') url = `${API_BASE}/carbon-transactions/${selectedId}`;
    if (moduleKey === 'departments') url = `${API_BASE}/departments/${selectedId}`;
    
    const res = await fetch(url, { method: 'DELETE' });
    if (res.ok) {
      showToast('Selected registry item deleted.', 'success');
      selectedRowId[moduleKey] = null;
      refreshView();
    }
  }
}

// ==========================================
// 3. SOCIAL DATA LOADERS
// ==========================================
async function loadCsrActivities() {
  try {
    const actRes = await fetch(`${API_BASE}/csr-activities`);
    const activities = await actRes.json();
    
    const partRes = await fetch(`${API_BASE}/csr-participation`);
    const participations = await partRes.json();

    const grid = document.getElementById('csr-activities-grid');
    grid.innerHTML = '';

    activities.forEach(act => {
      const joinedCount = participations.filter(p => p.activityId === act.id && p.approvalStatus === 'Approved').length;
      const hasJoined = participations.find(p => p.activityId === act.id && p.employee.toLowerCase() === currentUser.toLowerCase());
      
      let joinButtonHtml = '';
      if (currentAuthRole !== 'Administrator') {
        if (hasJoined) {
          joinButtonHtml = `<button class="btn-sketch btn-grey w-100" disabled>Requested (${hasJoined.approvalStatus})</button>`;
        } else if (act.status === 'Closed') {
          joinButtonHtml = `<button class="btn-sketch btn-grey w-100" disabled>Closed</button>`;
        } else {
          joinButtonHtml = `<button class="btn-sketch btn-sky w-100" onclick="openCsrJoinModal('${act.id}', '${act.title}')">Join</button>`;
        }
      } else {
        joinButtonHtml = `<button class="btn-sketch btn-grey w-100" disabled>Admin Mode</button>`;
      }

      const isEvidence = act.description.includes('Evidence') || act.pointsAwarded >= 50;

      const card = document.createElement('div');
      card.className = 'csr-card-sketch';
      card.innerHTML = `
        <div>
          <h4 class="csr-title-sketch">${act.title}</h4>
          <div class="csr-meta-sketch">
            <span>${joinedCount} joined</span> | <span>${isEvidence ? 'Evidence Required' : 'Open'}</span>
          </div>
        </div>
        <div>
          ${joinButtonHtml}
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadCsrParticipationQueue() {
  try {
    const partRes = await fetch(`${API_BASE}/csr-participation`);
    const parts = await partRes.json();
    const actRes = await fetch(`${API_BASE}/csr-activities`);
    const acts = await actRes.json();

    const tbody = document.querySelector('#csr-participation-table tbody');
    tbody.innerHTML = '';

    parts.forEach(p => {
      const act = acts.find(a => a.id === p.activityId);
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', p.id);
      tr.innerHTML = `
        <td><b>${p.employee}</b></td>
        <td>${act ? act.title : 'CSR Activity'}</td>
        <td>${p.proof ? `<code>${p.proof}</code>` : '<span class="text-muted">None</span>'}</td>
        <td>${act ? act.pointsAwarded : 0}</td>
        <td><span class="status-pill-sketch ${p.approvalStatus.toLowerCase()}">${p.approvalStatus}</span></td>
      `;
      tbody.appendChild(tr);
    });
    
    bindRowSelection('csr-participation-table', 'csr-participation');

    // Also populate full logs table in subtab
    const logTbody = document.querySelector('#csr-participation-log-table tbody');
    if (logTbody) {
      logTbody.innerHTML = '';
      parts.forEach(p => {
        const act = acts.find(a => a.id === p.activityId);
        logTbody.innerHTML += `
          <tr>
            <td><b>${p.employee}</b></td>
            <td>${act ? act.title : 'CSR Activity'}</td>
            <td>${p.proof || 'None'}</td>
            <td><span class="status-pill-sketch ${p.approvalStatus.toLowerCase()}">${p.approvalStatus}</span></td>
            <td>${p.completionDate}</td>
          </tr>
        `;
      });
    }
  } catch (err) {
    console.error(err);
  }
}

async function handleCsrQueueApproval(approved) {
  const selectedId = selectedRowId['csr-participation'];
  if (!selectedId) {
    showToast('Please select a queue row first!', 'warning');
    return;
  }

  const res = await fetch(`${API_BASE}/csr-participation/${selectedId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved })
  });

  if (res.ok) {
    const data = await res.json();
    showToast(`Participation claim ${approved ? 'approved' : 'rejected'}.`, 'success');
    selectedRowId['csr-participation'] = null;
    
    if (data.unlockedBadges && data.unlockedBadges.length > 0) {
      data.unlockedBadges.forEach(b => showBadgeUnlockModal(b));
    }
    
    loadEmployeesSelector();
    refreshView();
  }
}

async function loadSocialDiversityMetrics() {
  try {
    // Fix #2: Use live /api/diversity-metrics endpoint instead of hardcoded values
    const res = await fetch(`${API_BASE}/diversity-metrics`);
    const metrics = await res.json();

    // CSR participation rate
    const csrEl = document.getElementById('div-csr-participation-rate');
    if (csrEl) {
      csrEl.innerHTML = `${metrics.csrParticipationRate}% <small>of Staff</small>`;
    }

    // Gender breakdown
    const genderEl = document.getElementById('div-gender-breakdown');
    if (genderEl) {
      genderEl.innerHTML = metrics.genderBreakdown.map(g =>
        `<div class="diversity-stat">
          <span class="diversity-label">${g.label}</span>
          <div class="progress-bar-bg" style="height:10px; width:120px; display:inline-block; vertical-align:middle;">
            <div class="progress-bar-fill" style="width:${g.pct}%; height:100%;"></div>
          </div>
          <span style="margin-left:8px; font-size:13px;"><b>${g.pct}%</b> (${g.count})</span>
        </div>`
      ).join('');
    }

    // Training completion rate
    const trainEl = document.getElementById('div-training-completion');
    if (trainEl) {
      if (metrics.trainingCompletionRate !== null) {
        trainEl.innerHTML = `${metrics.trainingCompletionRate}% <small>(${metrics.trainingCompletions}/${metrics.totalTrainings} completed)</small>`;
      } else {
        trainEl.innerHTML = `<span class="text-muted">No training data</span>`;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

// ==========================================
// 4. GOVERNANCE DATA LOADERS
// ==========================================
async function loadPolicies() {
  try {
    const pRes = await fetch(`${API_BASE}/policies`);
    const policies = await pRes.json();
    
    const aRes = await fetch(`${API_BASE}/policy-acknowledgements`);
    const acks = await aRes.json();

    const container = document.getElementById('policies-container');
    container.innerHTML = '';

    policies.forEach(p => {
      const ackCount = acks.filter(a => a.policy.toLowerCase() === p.name.toLowerCase()).length;
      const hasAcked = acks.some(a => a.policy.toLowerCase() === p.name.toLowerCase() && a.employee.toLowerCase() === currentUser.toLowerCase());
      
      let ackBtnHtml = '';
      if (currentUser !== 'Admin') {
        if (hasAcked) {
          ackBtnHtml = `<button class="btn-sketch btn-grey w-100" disabled>Acknowledged</button>`;
        } else {
          ackBtnHtml = `<button class="btn-sketch btn-purple w-100" onclick="acknowledgePolicy('${p.name}')">Acknowledge</button>`;
        }
      } else {
        ackBtnHtml = `<button class="btn-sketch btn-grey w-100" disabled>${ackCount} Signed</button>`;
      }

      const card = document.createElement('div');
      card.className = 'policy-card-sketch';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span style="font-weight:bold; font-size:12px; text-transform:uppercase; color:var(--color-gov);">${p.category} Metric</span>
          <span class="status-pill-sketch completed" style="font-size:10px;">Active</span>
        </div>
        <h4 style="font-size:17px; font-weight:bold; margin-bottom:6px;">${p.name}</h4>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px; line-height:1.4;">${p.description}</p>
        ${ackBtnHtml}
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadPolicyAcknowledgements() {
  try {
    const res = await fetch(`${API_BASE}/policy-acknowledgements`);
    const data = await res.json();
    const tbody = document.querySelector('#policy-acknowledgements-table tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><b>${item.employee}</b></td>
        <td>${item.policy}</td>
        <td>${item.acknowledgedDate}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadAudits() {
  try {
    const res = await fetch(`${API_BASE}/audits`);
    const data = await res.json();
    const tbody = document.querySelector('#audits-table tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><b>${item.title}</b></td>
        <td>${item.department}</td>
        <td>${item.auditor}</td>
        <td>${item.date}</td>
        <td>${item.findings}</td>
        <td><span class="status-pill-sketch ${item.status.toLowerCase().replace(' ', '-')}">${item.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
    
    // Also load compliance issues under audits tab
    loadComplianceIssues();
  } catch (err) {
    console.error(err);
  }
}

function exportAuditsData(format = 'csv') {
  if (format === 'json') {
    // Fix #3: JSON export — fetch live data
    fetch(`${API_BASE}/audits`)
      .then(r => r.json())
      .then(audits => {
        const blob = new Blob([JSON.stringify(audits, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'EcoSphere_Audits_Export.json';
        link.click();
        URL.revokeObjectURL(url);
        showToast('Audits exported as JSON.', 'success');
      })
      .catch(() => showToast('Export failed.', 'danger'));
    return;
  }
  // CSV export — fetch live data
  fetch(`${API_BASE}/audits`)
    .then(r => r.json())
    .then(audits => {
      const header = 'Title,Department,Auditor,Date,Findings,Status';
      const rows = audits.map(a =>
        `"${a.title}","${a.department}","${a.auditor}",${a.date},"${(a.findings || '').replace(/"/g, "''")}","${a.status}"`
      );
      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([header, ...rows].join('\n'));
      const link = document.createElement('a');
      link.setAttribute('href', csvContent);
      link.setAttribute('download', 'EcoSphere_Audits_Export.csv');
      link.click();
      showToast('Audits exported as CSV.', 'success');
    })
    .catch(() => showToast('Export failed.', 'danger'));
}

async function loadComplianceIssues() {
  try {
    const res = await fetch(`${API_BASE}/compliance-issues`);
    const data = await res.json();
    
    // 1. Audit tab mini table
    const tbody = document.querySelector('#compliance-issues-table tbody');
    if (tbody) {
      tbody.innerHTML = '';
      data.forEach(item => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', item.id);
        tr.innerHTML = `
          <td>${item.description}</td>
          <td><span class="status-pill-sketch ${item.severity.toLowerCase()}">${item.severity}</span></td>
          <td>${item.audit.includes('Waste') ? 'Manufacturing' : 'Logistics'}</td>
          <td><span class="status-pill-sketch ${item.status.toLowerCase()}">${item.status}</span></td>
        `;
        tbody.appendChild(tr);
      });
      bindRowSelection('compliance-issues-table', 'compliance-issues');
    }

    // 2. Full compliance detail tab table
    const detailTbody = document.querySelector('#compliance-issues-details-table tbody');
    if (detailTbody) {
      detailTbody.innerHTML = '';
      data.forEach(item => {
        detailTbody.innerHTML += `
          <tr>
            <td><code>${item.id.slice(-6)}</code></td>
            <td>${item.audit}</td>
            <td><span class="status-pill-sketch ${item.severity.toLowerCase()}">${item.severity}</span></td>
            <td>${item.description}</td>
            <td>${item.owner}</td>
            <td>${item.dueDate}</td>
            <td><span class="status-pill-sketch ${item.status.toLowerCase()}">${item.status}</span></td>
          </tr>
        `;
      });
    }
  } catch (err) {
    console.error(err);
  }
}

async function resolveSelectedComplianceIssue() {
  const selectedId = selectedRowId['compliance-issues'];
  if (!selectedId) {
    showToast('Please select a compliance issue in the table first!', 'warning');
    return;
  }

  const res = await fetch(`${API_BASE}/compliance-issues/${selectedId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Resolved' })
  });

  if (res.ok) {
    showToast('Compliance issue resolved.', 'success');
    selectedRowId['compliance-issues'] = null;
    refreshView();
  }
}

// ==========================================
// 5. GAMIFICATION DATA LOADERS
// ==========================================
let allChallenges = [];
let challengeFilterStatus = 'All';

async function loadChallenges() {
  try {
    const chRes = await fetch(`${API_BASE}/challenges`);
    allChallenges = await chRes.json();
    
    const partRes = await fetch(`${API_BASE}/challenge-participation`);
    const participations = await partRes.json();

    renderFilteredChallenges(participations);
    loadBadgeGalleryWidget();
    loadLeaderboardWidget();
  } catch (err) {
    console.error(err);
  }
}

function filterChallenges(status) {
  challengeFilterStatus = status;
  
  // Set tab styling
  const tabs = document.querySelectorAll('.challenge-filters-sketch .filter-tab');
  tabs.forEach(t => {
    if (t.getAttribute('data-status') === status) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });

  fetch(`${API_BASE}/challenge-participation`)
    .then(res => res.json())
    .then(parts => renderFilteredChallenges(parts));
}

function renderFilteredChallenges(participations) {
  const container = document.getElementById('challenges-container');
  container.innerHTML = '';

  const filtered = allChallenges.filter(ch => {
    if (challengeFilterStatus === 'All') return true;
    return ch.status.toLowerCase() === challengeFilterStatus.toLowerCase();
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="text-muted text-center py-4 w-100">No challenges in this lifecycle state.</div>';
    return;
  }

  filtered.forEach(ch => {
    const userPart = participations.find(p => p.challengeId === ch.id && p.employee.toLowerCase() === currentUser.toLowerCase());
    
    let joinButtonHtml = '';
    if (currentAuthRole !== 'Administrator') {
      if (userPart) {
        if (userPart.approval === 'Approved') {
          joinButtonHtml = `<button class="btn-sketch btn-grey w-100" disabled>Approved</button>`;
        } else if (userPart.approval === 'Pending') {
          joinButtonHtml = `<button class="btn-sketch btn-grey w-100" disabled>Pending Validation</button>`;
        } else {
          joinButtonHtml = `<button class="btn-sketch btn-amber w-100" onclick="updateChallengeProgress('${userPart.id}', ${userPart.progress}, ${ch.evidenceRequired})">Progress (${userPart.progress}%)</button>`;
        }
      } else {
        joinButtonHtml = `<button class="btn-sketch btn-amber w-100" onclick="joinChallenge('${ch.id}')">Join Challenge</button>`;
      }
    } else {
      joinButtonHtml = `
        <div class="challenge-admin-actions">
          <button class="btn-sketch btn-small btn-grey" onclick="updateChallengeLifecycle('${ch.id}', 'Draft')">Draft</button>
          <button class="btn-sketch btn-small btn-emerald" onclick="updateChallengeLifecycle('${ch.id}', 'Active')">Active</button>
          <button class="btn-sketch btn-small btn-amber" onclick="updateChallengeLifecycle('${ch.id}', 'Under Review')">Under Review</button>
          <button class="btn-sketch btn-small btn-sky" onclick="updateChallengeLifecycle('${ch.id}', 'Completed')">Completed</button>
          <button class="btn-sketch btn-small btn-danger" onclick="updateChallengeLifecycle('${ch.id}', 'Archived')">Archived</button>
        </div>
      `;
    }

    const card = document.createElement('div');
    card.className = 'challenge-card-sketch';
    card.innerHTML = `
      <div>
        <h4 class="csr-title-sketch">${ch.title}</h4>
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">XP: ${ch.xp} • ${ch.difficulty} | Deadline ${ch.deadline.slice(-5)}</p>
        <span class="status-pill-sketch ${ch.status.toLowerCase().replace(' ', '-')}">${ch.status}</span>
      </div>
      <div style="margin-top:14px;">
        ${joinButtonHtml}
      </div>
    `;
    container.appendChild(card);
  });
}

async function loadBadgeGalleryWidget() {
  try {
    const res = await fetch(`${API_BASE}/badges`);
    const badges = await res.json();
    
    let unlocked = [];
    if (currentUser !== 'Admin') {
      const emp = employeesList.find(e => e.name.toLowerCase() === currentUser.toLowerCase());
      if (emp && emp.badges) unlocked = emp.badges;
    }

    const container = document.getElementById('badge-gallery-container');
    container.innerHTML = '';

    // Take first 4 badges for widget
    badges.slice(0, 4).forEach(b => {
      const isUnlocked = currentUser === 'Admin' || unlocked.includes(b.id);
      const isGreen = b.name.includes('Carbon') || b.name.includes('Beginner');

      const div = document.createElement('div');
      div.className = `badge-item-sketch ${isUnlocked ? 'unlocked' : 'locked'}`;
      
      // Determine outline color matching mockup
      let badgeOutline = 'var(--color-gam)';
      if (isGreen) badgeOutline = 'var(--color-env)';
      else if (b.name.includes('Champion')) badgeOutline = 'var(--color-gam)';
      
      div.style.borderColor = badgeOutline;

      div.innerHTML = `
        <span style="font-size:18px;">${b.icon}</span>
        <span style="font-size:14px; font-weight:bold; color: ${isGreen ? 'var(--color-env)' : 'var(--color-gam)'};">${b.name}</span>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadLeaderboardWidget() {
  try {
    const res = await fetch(`${API_BASE}/employees`);
    const emps = await res.json();
    const sorted = emps.sort((a,b) => (b.xp || 0) - (a.xp || 0));

    const tbody = document.querySelector('#leaderboard-table-widget tbody');
    tbody.innerHTML = '';

    sorted.slice(0, 3).forEach((emp, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><b>${emp.name}</b><br><small style="color:var(--text-muted);">${emp.department} Dept</small></td>
        <td><b>${(emp.xp || 0).toLocaleString()}</b></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadChallengeParticipationQueue() {
  try {
    const res = await fetch(`${API_BASE}/challenge-participation`);
    const parts = await res.json();
    const chRes = await fetch(`${API_BASE}/challenges`);
    const chs = await chRes.json();

    const tbody = document.querySelector('#challenge-participation-queue-table tbody');
    tbody.innerHTML = '';

    parts.forEach(p => {
      const ch = chs.find(c => c.id === p.challengeId);
      
      let actionsHtml = '-';
      if (currentUser === 'Admin' && p.approval === 'Pending') {
        actionsHtml = `
          <button class="btn-sketch btn-emerald btn-small" onclick="approveChallengeSub('${p.id}', true)">Approve</button>
          <button class="btn-sketch btn-danger btn-small" onclick="approveChallengeSub('${p.id}', false)">Reject</button>
        `;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><b>${p.employee}</b></td>
        <td>${ch ? ch.title : 'Challenge'}</td>
        <td>${p.progress}%</td>
        <td>${p.proof ? `<code>${p.proof}</code>` : 'None'}</td>
        <td><span class="status-pill-sketch ${p.approval.toLowerCase()}">${p.approval}</span></td>
        <td>${actionsHtml}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadBadges() {
  try {
    const res = await fetch(`${API_BASE}/badges`);
    const badges = await res.json();
    
    let unlocked = [];
    if (currentUser !== 'Admin') {
      const emp = employeesList.find(e => e.name.toLowerCase() === currentUser.toLowerCase());
      if (emp && emp.badges) unlocked = emp.badges;
    }

    const container = document.getElementById('badges-container');
    container.innerHTML = '';

    badges.forEach(b => {
      const isLocked = currentUser !== 'Admin' && !unlocked.includes(b.id);
      const card = document.createElement('div');
      card.className = 'card-sketch';
      card.style.borderColor = 'var(--color-gam)';
      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:16px;">
          <div style="font-size:32px;">${b.icon}</div>
          <div>
            <h4 style="margin:0;">${b.name}</h4>
            <p style="font-size:12px; color:var(--text-muted); margin:4px 0;">${b.description}</p>
            <span class="status-pill-sketch ${isLocked ? 'draft' : 'active'}" style="font-size:10px;">${isLocked ? 'Locked' : 'Unlocked'}</span>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadRewards() {
  try {
    const res = await fetch(`${API_BASE}/rewards`);
    const rewards = await res.json();
    const container = document.getElementById('rewards-container');
    container.innerHTML = '';

    let userPoints = 0;
    if (currentUser !== 'Admin') {
      const emp = employeesList.find(e => e.name.toLowerCase() === currentUser.toLowerCase());
      if (emp) userPoints = emp.points || 0;
    }

    rewards.forEach(r => {
      let actionBtn = '';
      if (currentUser !== 'Admin') {
        if (r.stock <= 0) {
          actionBtn = `<button class="btn-sketch btn-grey w-100" disabled>Out of Stock</button>`;
        } else if (userPoints < r.pointsRequired) {
          actionBtn = `<button class="btn-sketch btn-grey w-100" disabled>${r.pointsRequired} Pts Required</button>`;
        } else {
          actionBtn = `<button class="btn-sketch btn-amber w-100" onclick="redeemReward('${r.id}', '${r.name}', ${r.pointsRequired})">Redeem for ${r.pointsRequired} Pts</button>`;
        }
      } else {
        actionBtn = `<button class="btn-sketch btn-grey w-100" disabled>Admin spec</button>`;
      }

      const card = document.createElement('div');
      card.className = 'card-sketch';
      card.innerHTML = `
        <h4>${r.name}</h4>
        <p style="font-size:12px; color:var(--text-muted); margin:6px 0;">${r.description}</p>
        <div style="font-size:13px; display:flex; justify-content:space-between; margin-bottom:12px;">
          <span>Required: <b>${r.pointsRequired} Points</b></span>
          <span>Stock: <b>${r.stock}</b></span>
        </div>
        ${actionBtn}
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadLeaderboards() {
  try {
    const res = await fetch(`${API_BASE}/employees`);
    const emps = await res.json();
    const sorted = emps.sort((a,b) => (b.xp || 0) - (a.xp || 0));

    const tbody = document.querySelector('#leaderboard-table tbody');
    tbody.innerHTML = '';

    sorted.forEach((emp, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><b>#${index + 1}</b></td>
        <td><b>${emp.name}</b></td>
        <td>${emp.department}</td>
        <td><b>${(emp.xp || 0).toLocaleString()} XP</b></td>
        <td><span class="status-pill-sketch completed">${emp.badges ? emp.badges.length : 0} Badges</span></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}

// ==========================================
// 6. REPORTS ENGINE
// ==========================================
async function loadSummaryReport() {
  try {
    const txRes = await fetch(`${API_BASE}/carbon-transactions`);
    const transactions = await txRes.json();
    const sumCarbon = transactions.reduce((sum, t) => sum + (t.calculatedEmission || 0), 0);
    document.getElementById('rep-env-total').innerText = `${sumCarbon.toLocaleString()} kg CO2`;

    const csrRes = await fetch(`${API_BASE}/csr-participation`);
    const parts = await csrRes.json();
    document.getElementById('rep-soc-total-participations').innerText = `${parts.length} entries`;

    const policiesRes = await fetch(`${API_BASE}/policies`);
    const policies = await policiesRes.json();
    document.getElementById('rep-gov-policies').innerText = `${policies.length} corporate policies`;

    const complRes = await fetch(`${API_BASE}/compliance-issues`);
    const compl = await complRes.json();
    document.getElementById('rep-gov-compliance').innerText = `${compl.length} total issues`;
  } catch (err) {
    console.error(err);
  }
}

async function loadCustomReportBuilderFilters() {
  try {
    const res = await fetch(`${API_BASE}/departments`);
    const depts = await res.json();
    const select = document.getElementById('filter-department');
    select.innerHTML = '<option value="">All Departments</option>';
    depts.forEach(d => {
      select.innerHTML += `<option value="${d.name}">${d.name}</option>`;
    });
  } catch (err) {
    console.error(err);
  }
}

async function generateCustomReport(e) {
  e.preventDefault();
  const module = document.getElementById('filter-module').value;
  const dept = document.getElementById('filter-department').value;
  const start = document.getElementById('filter-start-date').value;
  const emp = document.getElementById('filter-employee').value;
  const challenge = document.getElementById('filter-challenge').value;
  const esgCategory = document.getElementById('filter-esg-category').value;

  let query = `?dummy=1`;
  if (module) query += `&module=${module}`;
  if (dept) query += `&department=${dept}`;
  if (start) query += `&startDate=${start}`;
  if (emp) query += `&employee=${emp}`;
  if (challenge) query += `&challenge=${challenge}`;
  if (esgCategory) query += `&esgCategory=${esgCategory}`;

  try {
    const res = await fetch(`${API_BASE}/reports${query}`);
    const data = await res.json();
    
    // Save last queried data to global variable for export options
    window.lastCustomReportData = data;
    
    const tbody = document.querySelector('#custom-report-results-table tbody');
    tbody.innerHTML = '';

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No records match the filter criteria.</td></tr>';
      return;
    }

    data.forEach(item => {
      tbody.innerHTML += `
        <tr>
          <td><span class="status-pill-sketch completed">${item.module}</span></td>
          <td><b>${item.name}</b></td>
          <td>${item.valueDisplay}</td>
          <td>${item.date}</td>
          <td>${item.department || 'Corporate'}</td>
        </tr>
      `;
    });
  } catch (err) {
    console.error(err);
  }
}

function exportCustomReport(format) {
  const data = window.lastCustomReportData;
  if (!data || data.length === 0) {
    showToast('No report data to export. Run the report first!', 'warning');
    return;
  }

  const filename = `EcoSphere_Custom_Report_${new Date().toISOString().split('T')[0]}`;

  if (format === 'JSON') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Custom report exported as JSON.', 'success');
  } else if (format === 'CSV') {
    const header = 'Module,Name,Value,Date,Department';
    const rows = data.map(item =>
      `"${item.module}","${item.name}","${item.valueDisplay}",${item.date},"${item.department || 'Corporate'}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([header, ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${filename}.csv`);
    link.click();
    showToast('Custom report exported as CSV.', 'success');
  } else if (format === 'Excel') {
    const header = 'Module\tName\tValue\tDate\tDepartment';
    const rows = data.map(item =>
      `${item.module}\t${item.name}\t${item.valueDisplay}\t${item.date}\t${item.department || 'Corporate'}`
    );
    const content = [header, ...rows].join('\n');
    const blob = new Blob([content], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Custom report exported as Excel.', 'success');
  } else if (format === 'PDF') {
    const printContent = `
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h2>EcoSphere Custom ESG Report</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>Transaction Name</th>
                <th>Details / Metrics</th>
                <th>Date</th>
                <th>Department</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td>${item.module}</td>
                  <td>${item.name}</td>
                  <td>${item.valueDisplay}</td>
                  <td>${item.date}</td>
                  <td>${item.department || 'Corporate'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    showToast('Sent custom report to printer / PDF viewer.', 'success');
  }
}

// ==========================================
// 7. SETTINGS READ/WRITE
// ==========================================
async function loadSettingsDepartments() {
  try {
    const res = await fetch(`${API_BASE}/departments`);
    const data = await res.json();
    const tbody = document.querySelector('#departments-table tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', item.id);
      tr.innerHTML = `
        <td><b>${item.name}</b></td>
        <td><code>${item.code}</code></td>
        <td>${item.head}</td>
        <td>${item.parent || '—'}</td>
        <td>${item.employees}</td>
        <td><span class="status-pill-sketch ${item.status.toLowerCase()}">${item.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
    bindRowSelection('departments-table', 'departments');
    
    // Dynamically update config toggles checked state
    document.getElementById('toggle-auto-emissions').checked = systemConfig.autoEmissionCalculation;
    document.getElementById('toggle-evidence-req').checked = systemConfig.evidenceRequirement;
    document.getElementById('toggle-badge-auto').checked = systemConfig.badgeAutoAward;
    document.getElementById('toggle-notif-compliance').checked = systemConfig.notifications.complianceIssues;
  } catch (err) {
    console.error(err);
  }
}

async function loadSettingsCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    const tbody = document.querySelector('#categories-table tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', item.id);
      tr.innerHTML = `
        <td><b>${item.name}</b></td>
        <td>${item.type}</td>
        <td><span class="status-pill-sketch ${item.status.toLowerCase()}">${item.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}

function loadSettingsWeightsConfiguration() {
  document.getElementById('weight-env').value = systemConfig.weights.environmental;
  document.getElementById('weight-soc').value = systemConfig.weights.social;
  document.getElementById('weight-gov').value = systemConfig.weights.governance;
}

async function saveWeightsConfig() {
  const wEnv = parseInt(document.getElementById('weight-env').value, 10);
  const wSoc = parseInt(document.getElementById('weight-soc').value, 10);
  const wGov = parseInt(document.getElementById('weight-gov').value, 10);

  if (wEnv + wSoc + wGov !== 100) {
    showToast('Score weights must sum to exactly 100%!', 'danger');
    return;
  }

  const payload = {
    weights: { environmental: wEnv, social: wSoc, governance: wGov }
  };

  const res = await fetch(`${API_BASE}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    showToast('ESG weights updated.', 'success');
    await loadGlobalConfig();
  }
}

async function submitGlobalConfigToggles() {
  const payload = {
    autoEmissionCalculation: document.getElementById('toggle-auto-emissions').checked,
    evidenceRequirement: document.getElementById('toggle-evidence-req').checked,
    badgeAutoAward: document.getElementById('toggle-badge-auto').checked,
    notifications: {
      ...systemConfig.notifications,
      complianceIssues: document.getElementById('toggle-notif-compliance').checked,
      approvals: document.getElementById('toggle-notif-approvals').checked,
      reminders: document.getElementById('toggle-notif-reminders').checked,
      badgeUnlocks: document.getElementById('toggle-notif-badges').checked
    }
  };

  const res = await fetch(`${API_BASE}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    showToast('Automation configurations updated.', 'success');
    await loadGlobalConfig();
  }
}

function loadSettingsNotifications() {
  document.getElementById('toggle-notif-compliance-issues').checked = systemConfig.notifications?.complianceIssues ?? true;
  document.getElementById('toggle-notif-approvals').checked = systemConfig.notifications?.approvals ?? true;
  document.getElementById('toggle-notif-reminders').checked = systemConfig.notifications?.reminders ?? true;
  document.getElementById('toggle-notif-badges').checked = systemConfig.notifications?.badgeUnlocks ?? true;
}

// ==========================================
// 8. NOTIFICATION CENTER
// ==========================================
async function refreshNotifications() {
  try {
    const res = await fetch(`${API_BASE}/notifications`);
    const notifications = await res.json();
    
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notification-count');
    badge.innerText = unreadCount;
    badge.style.display = unreadCount === 0 ? 'none' : 'flex';

    const container = document.getElementById('notif-list-container');
    container.innerHTML = '';
    
    if (notifications.length === 0) {
      container.innerHTML = '<div class="text-muted text-center py-4">No notifications.</div>';
      return;
    }

    notifications.forEach(n => {
      container.innerHTML += `
        <div class="notif-item-sketch ${n.read ? '' : 'unread'}">
          <p>${n.message}</p>
          <span style="font-size:10px; color:var(--text-muted);">${new Date(n.timestamp).toLocaleTimeString()}</span>
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
  }
}

function toggleNotificationsSlideout() {
  const slideout = document.getElementById('notif-slideout');
  slideout.classList.toggle('active');
  if (slideout.classList.contains('active')) {
    refreshNotifications();
  }
}

async function markAllNotificationsRead() {
  const res = await fetch(`${API_BASE}/notifications/read`, { method: 'POST' });
  if (res.ok) {
    refreshNotifications();
    showToast('Notifications marked as read.', 'success');
  }
}

// ==========================================
// 9. MODALS SYSTEM
// ==========================================
function openModal(title, bodyHtml) {
  document.getElementById('modal-title').innerText = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-backdrop').classList.add('active');
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('active');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => container.removeChild(toast), 300);
  }, 4000);
}

function showBadgeUnlockModal(badge) {
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.top = '50%';
  div.style.left = '50%';
  div.style.transform = 'translate(-50%, -50%)';
  div.style.backgroundColor = 'var(--bg-secondary)';
  div.style.border = '2px solid var(--color-gam)';
  div.style.borderRadius = '12px';
  div.style.padding = '30px';
  div.style.textAlign = 'center';
  div.style.zIndex = '2000';
  div.style.boxShadow = '6px 6px 0px rgba(255,255,255,0.05)';
  div.style.maxWidth = '340px';
  div.style.width = '90%';
  
  div.innerHTML = `
    <div style="font-size: 64px; margin-bottom: 16px;">${badge.icon}</div>
    <h2 style="font-size: 22px; color: var(--color-gam); font-weight:bold; margin-bottom: 8px;">Badge Unlocked!</h2>
    <h3 style="font-size: 16px; margin-bottom: 10px;">${badge.name}</h3>
    <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">${badge.description}</p>
    <button class="btn-sketch btn-amber w-100" id="close-badge-pop-btn">Awesome!</button>
  `;
  document.body.appendChild(div);
  document.getElementById('close-badge-pop-btn').onclick = () => document.body.removeChild(div);
}

// Modal Builders
function openErpModal() {
  const html = `
    <form id="erp-transaction-form" onsubmit="submitErpTransaction(event)">
      <div class="form-group">
        <label>ERP Source Category / Activity</label>
        <select id="erp-source-type" class="styled-select" required>
          <option value="Purchase">Purchase (Material & Cargo Scope 3)</option>
          <option value="Manufacturing">Manufacturing (Factory Electricity Scope 1)</option>
          <option value="Fleet">Fleet (Transport Logistics Diesel Scope 1)</option>
          <option value="Expense">Expense (Business Travel Commutes Scope 3)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Operational Quantity / Value</label>
        <input type="number" id="erp-value" class="styled-input" placeholder="e.g. 500" required min="1">
      </div>
      <div class="form-group">
        <label>Measurement Unit</label>
        <select id="erp-unit" class="styled-select" required>
          <option value="USD">USD ($)</option>
          <option value="kWh">kWh</option>
          <option value="Liter">Liter (l)</option>
          <option value="km">km</option>
        </select>
      </div>
      <div class="form-group">
        <label>Target Department</label>
        <select id="erp-department" class="styled-select" required>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Logistics">Logistics</option>
          <option value="Corporate">Corporate</option>
          <option value="R&D">R&D</option>
        </select>
      </div>
      <div class="form-group">
        <label>ERP Document Ref ID</label>
        <input type="text" id="erp-ref" class="styled-input" placeholder="e.g. INV-9040" required>
      </div>
      <button type="submit" class="btn-sketch btn-emerald w-100">Post ERP Log & Calculate Carbon</button>
    </form>
  `;
  openModal('Log ERP Operations Record', html);
}

async function submitErpTransaction(e) {
  e.preventDefault();
  const payload = {
    sourceType: document.getElementById('erp-source-type').value,
    value: parseFloat(document.getElementById('erp-value').value),
    unit: document.getElementById('erp-unit').value,
    department: document.getElementById('erp-department').value,
    associatedRecordId: document.getElementById('erp-ref').value
  };

  const res = await fetch(`${API_BASE}/erp-transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    closeModal();
    showToast('ERP log recorded successfully.', 'success');
    refreshView();
  }
}

function openCsrJoinModal(activityId, activityTitle) {
  const html = `
    <form onsubmit="submitCsrJoin(event, '${activityId}')">
      <p style="font-size:13px; color:var(--text-muted); margin-bottom:12px;">Signing up for: <b>${activityTitle}</b></p>
      <div class="form-group">
        <label>Evidence / Proof file name or link</label>
        <input type="text" id="csr-join-proof" class="styled-input" placeholder="e.g. self_photo.jpg or drive link">
        <small style="color:var(--text-muted); display:block; margin-top:6px;">Use this field to submit your proof now. Accepted examples: photo filename, document filename, or cloud link.</small>
      </div>
      <button type="submit" class="btn-sketch btn-sky w-100">Sign Up</button>
    </form>
  `;
  openModal('CSR Activity Join', html);
}

async function submitCsrJoin(e, activityId) {
  e.preventDefault();
  const proof = document.getElementById('csr-join-proof').value;
  const employeeName = currentAuthUser?.user_metadata?.full_name || currentUser;

  if (!employeeName || currentAuthRole === 'Administrator') {
    showToast('Please sign in as an employee account to join CSR activities.', 'warning');
    return;
  }
  
  if (systemConfig.evidenceRequirement && !proof) {
    showToast('Evidence is required. Add proof in this form field before submitting.', 'danger');
    return;
  }

  const res = await fetch(`${API_BASE}/csr-participation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activityId, employee: employeeName, proof })
  });

  if (res.ok) {
    closeModal();
    showToast('Signed up successfully. Claim queued for validation.', 'success');
    refreshView();
  }
}

function openChallengeProgressModal(partId, currentProgress, proofRequired) {
  const html = `
    <form onsubmit="submitChallengeProgress(event, '${partId}', ${proofRequired})">
      <div class="form-group">
        <label>Progress percentage (%)</label>
        <input type="number" id="ch-prog-val" class="styled-input" min="0" max="100" value="${currentProgress}">
      </div>
      <div class="form-group">
        <label>Evidence file name or link ${proofRequired ? '(required at 100%)' : ''}</label>
        <input type="text" id="ch-prog-proof" class="styled-input" placeholder="e.g. proof.pdf or drive link">
        <small style="color:var(--text-muted); display:block; margin-top:6px;">Submit evidence in this field before pressing Update Progress.</small>
      </div>
      <button type="submit" class="btn-sketch btn-amber w-100">Update Progress</button>
    </form>
  `;
  openModal('Update Progress', html);
}

async function submitChallengeProgress(e, partId, proofRequired) {
  e.preventDefault();
  const prog = parseInt(document.getElementById('ch-prog-val').value, 10);
  const proof = document.getElementById('ch-prog-proof').value;

  if (prog === 100 && proofRequired && !proof) {
    showToast('Proof is mandatory to complete this challenge. Enter it in the Evidence field in this modal.', 'danger');
    return;
  }

  const res = await fetch(`${API_BASE}/challenge-participation/${partId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ progress: prog, proof })
  });

  if (res.ok) {
    closeModal();
    showToast('Progress updated successfully.', 'success');
    refreshView();
  }
}

async function approveChallengeSub(partId, approved) {
  const res = await fetch(`${API_BASE}/challenge-participation/${partId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved })
  });
  if (res.ok) {
    const data = await res.json();
    showToast(`Challenge submittal reviewed.`, 'success');
    if (data.unlockedBadges && data.unlockedBadges.length > 0) {
      data.unlockedBadges.forEach(b => showBadgeUnlockModal(b));
    }
    loadEmployeesSelector();
    refreshView();
  }
}

// REST helper builders
function openGoalModal(id = null) {
  let goal = { name: '', department: 'Manufacturing', targetCO2: '', currentCO2: 0, deadline: '', status: 'Active' };
  if (id) {
    fetch(`${API_BASE}/goals`).then(r=>r.json()).then(goals => {
      const match = goals.find(g => g.id === id);
      if (match) {
        goal = match;
        triggerGoalForm(id, goal);
      }
    });
  } else {
    triggerGoalForm(null, goal);
  }
}

function triggerGoalForm(id, goal) {
  const html = `
    <form onsubmit="submitGoalForm(event, ${id ? `'${id}'` : 'null'})">
      <div class="form-group">
        <label>Goal Target Name</label>
        <input type="text" id="g-name" class="styled-input" value="${goal.name}" required>
      </div>
      <div class="form-group">
        <label>Department</label>
        <select id="g-dept" class="styled-select">
          <option value="Manufacturing" ${goal.department === 'Manufacturing' ? 'selected' : ''}>Manufacturing</option>
          <option value="Logistics" ${goal.department === 'Logistics' ? 'selected' : ''}>Logistics</option>
          <option value="Corporate" ${goal.department === 'Corporate' ? 'selected' : ''}>Corporate</option>
          <option value="R&D" ${goal.department === 'R&D' ? 'selected' : ''}>R&D</option>
        </select>
      </div>
      <div class="form-group">
        <label>Target CO2 (tons)</label>
        <input type="number" id="g-target" class="styled-input" value="${goal.targetCO2}" required>
      </div>
      <div class="form-group">
        <label>Current CO2 (tons)</label>
        <input type="number" id="g-current" class="styled-input" value="${goal.currentCO2}">
      </div>
      <div class="form-group">
        <label>Deadline Date</label>
        <input type="date" id="g-deadline" class="styled-input" value="${goal.deadline}" required>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="g-status" class="styled-select">
          <option value="Active" ${goal.status === 'Active' ? 'selected' : ''}>Active</option>
          <option value="On Track" ${goal.status === 'On Track' ? 'selected' : ''}>On Track</option>
          <option value="Completed" ${goal.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Behind" ${goal.status === 'Behind' ? 'selected' : ''}>Behind</option>
        </select>
      </div>
      <button type="submit" class="btn-sketch btn-emerald w-100">${id ? 'Save Goal' : 'Create Goal'}</button>
    </form>
  `;
  openModal(id ? 'Edit Environmental Goal' : 'Create Environmental Goal', html);
}

async function submitGoalForm(e, id) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('g-name').value,
    department: document.getElementById('g-dept').value,
    targetCO2: parseFloat(document.getElementById('g-target').value),
    currentCO2: parseFloat(document.getElementById('g-current').value || 0),
    deadline: document.getElementById('g-deadline').value,
    status: document.getElementById('g-status').value
  };

  const res = await fetch(id ? `${API_BASE}/goals/${id}` : `${API_BASE}/goals`, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    closeModal();
    showToast('Sustainability Goal saved.', 'success');
    refreshView();
  }
}

// General Modal builders (Dummy modal targets to complete settings / inputs CRUD)
function openEmissionFactorModal(id = null) {
  let ef = { activity: '', scope: 'Scope 1', value: '', unit: '', status: 'Active' };
  const html = `
    <form onsubmit="submitEfForm(event, ${id ? `'${id}'` : 'null'})">
      <div class="form-group">
        <label>Activity Category</label>
        <input type="text" id="ef-act" class="styled-input" value="${ef.activity}" required>
      </div>
      <div class="form-group">
        <label>Scope Group</label>
        <select id="ef-sc" class="styled-select">
          <option value="Scope 1">Scope 1</option>
          <option value="Scope 2">Scope 2</option>
          <option value="Scope 3">Scope 3</option>
        </select>
      </div>
      <div class="form-group">
        <label>Value</label>
        <input type="number" id="ef-val" class="styled-input" required step="0.01">
      </div>
      <div class="form-group">
        <label>Unit</label>
        <input type="text" id="ef-un" class="styled-input" placeholder="e.g. Liter" required>
      </div>
      <button type="submit" class="btn-sketch btn-emerald w-100">Save Factor</button>
    </form>
  `;
  openModal('Configure Emission Factor', html);
}

async function submitEfForm(e, id) {
  e.preventDefault();
  const payload = {
    activity: document.getElementById('ef-act').value,
    scope: document.getElementById('ef-sc').value,
    value: parseFloat(document.getElementById('ef-val').value),
    unit: document.getElementById('ef-un').value,
    status: 'Active'
  };
  const res = await fetch(id ? `${API_BASE}/emission-factors/${id}` : `${API_BASE}/emission-factors`, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    closeModal();
    showToast('Emission Factor configured.', 'success');
    refreshView();
  }
}

function openProductModal() {
  const html = `
    <form onsubmit="submitProductForm(event)">
      <div class="form-group">
        <label>Name</label>
        <input type="text" id="p-name" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Code</label>
        <input type="text" id="p-code" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Carbon Footprint (kg)</label>
        <input type="number" id="p-carb" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Recyclability (%)</label>
        <input type="number" id="p-rec" class="styled-input" min="0" max="100" required>
      </div>
      <div class="form-group">
        <label>Ethical Sourcing (Yes/No)</label>
        <input type="text" id="p-eth" class="styled-input" placeholder="Yes" required>
      </div>
      <button type="submit" class="btn-sketch btn-emerald w-100">Register Product Profile</button>
    </form>
  `;
  openModal('Add Product Profile', html);
}

async function submitProductForm(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('p-name').value,
    code: document.getElementById('p-code').value,
    carbonFootprint: parseFloat(document.getElementById('p-carb').value),
    recyclability: parseInt(document.getElementById('p-rec').value, 10),
    ethicalSourcing: document.getElementById('p-eth').value,
    status: 'Active'
  };
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    closeModal();
    showToast('Product registered.', 'success');
    refreshView();
  }
}

function openCarbonTxModal() {
  const html = `
    <form onsubmit="submitCarbonTxForm(event)">
      <div class="form-group">
        <label>Source Type</label>
        <input type="text" id="ctx-source" class="styled-input" placeholder="e.g. Office Commutes" required>
      </div>
      <div class="form-group">
        <label>Quantity</label>
        <input type="number" id="ctx-value" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Unit</label>
        <input type="text" id="ctx-unit" class="styled-input" placeholder="km" required>
      </div>
      <div class="form-group">
        <label>Calculated Emissions (kg CO2)</label>
        <input type="number" id="ctx-calc" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Department</label>
        <input type="text" id="ctx-dept" class="styled-input" placeholder="Corporate" required>
      </div>
      <button type="submit" class="btn-sketch btn-purple w-100">Submit Manual Entry</button>
    </form>
  `;
  openModal('Log Manual Carbon Ledger', html);
}

async function submitCarbonTxForm(e) {
  e.preventDefault();
  const payload = {
    sourceType: document.getElementById('ctx-source').value,
    value: parseFloat(document.getElementById('ctx-value').value),
    unit: document.getElementById('ctx-unit').value,
    calculatedEmission: parseFloat(document.getElementById('ctx-calc').value),
    department: document.getElementById('ctx-dept').value,
    autoGenerated: false
  };
  const res = await fetch(`${API_BASE}/carbon-transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    closeModal();
    showToast('Footprint transaction logged.', 'success');
    refreshView();
  }
}

function openCsrActivityModal() {
  const html = `
    <form onsubmit="submitCsrActivityForm(event)">
      <div class="form-group">
        <label>Title</label>
        <input type="text" id="c-title" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Category</label>
        <input type="text" id="c-cat" class="styled-input" placeholder="Community Service" required>
      </div>
      <div class="form-group">
        <label>XP / Points reward</label>
        <input type="number" id="c-pts" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Deadline Date</label>
        <input type="date" id="c-date" class="styled-input" required>
      </div>
      <button type="submit" class="btn-sketch btn-sky w-100">Create Activity</button>
    </form>
  `;
  openModal('Add CSR Activity specs', html);
}

async function submitCsrActivityForm(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('c-title').value,
    category: document.getElementById('c-cat').value,
    description: 'Participation required.',
    pointsAwarded: parseInt(document.getElementById('c-pts').value, 10),
    date: document.getElementById('c-date').value,
    capacity: 50,
    status: 'Open'
  };
  const res = await fetch(`${API_BASE}/csr-activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    closeModal();
    showToast('Activity added to catalog.', 'success');
    refreshView();
  }
}

function openPolicyModal() {
  const html = `
    <form onsubmit="submitPolicyForm(event)">
      <div class="form-group">
        <label>Name</label>
        <input type="text" id="pol-n" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Description</label>
        <input type="text" id="pol-d" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Category (E / S / G)</label>
        <input type="text" id="pol-c" class="styled-input" placeholder="G" required>
      </div>
      <button type="submit" class="btn-sketch btn-purple w-100">Publish Policy</button>
    </form>
  `;
  openModal('Publish Corporate Policy', html);
}

async function submitPolicyForm(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('pol-n').value,
    description: document.getElementById('pol-d').value,
    category: document.getElementById('pol-c').value,
    effectiveDate: new Date().toISOString().split('T')[0],
    status: 'Active'
  };
  const res = await fetch(`${API_BASE}/policies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    closeModal();
    showToast('Governance policy published.', 'success');
    refreshView();
  }
}

function openAuditModal() {
  const html = `
    <form onsubmit="submitAuditForm(event)">
      <div class="form-group">
        <label>Title</label>
        <input type="text" id="aud-t" class="styled-input" placeholder="e.g. Q3 Compliance Check" required>
      </div>
      <div class="form-group">
        <label>Department Target</label>
        <input type="text" id="aud-dept" class="styled-input" placeholder="Logistics" required>
      </div>
      <div class="form-group">
        <label>Lead Auditor</label>
        <input type="text" id="aud-lead" class="styled-input" placeholder="R. Iyer" required>
      </div>
      <button type="submit" class="btn-sketch btn-purple w-100">Schedule internal Audit</button>
    </form>
  `;
  openModal('Schedule Internal Audit', html);
}

async function submitAuditForm(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('aud-t').value,
    department: document.getElementById('aud-dept').value,
    auditor: document.getElementById('aud-lead').value,
    date: new Date().toISOString().split('T')[0],
    findings: 'No critical violations logged yet.',
    status: 'Under Review'
  };
  const res = await fetch(`${API_BASE}/audits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    closeModal();
    showToast('Internal ESG Audit scheduled.', 'success');
    refreshView();
  }
}

function openComplianceModal() {
  const html = `
    <form onsubmit="submitComplianceForm(event)">
      <div class="form-group">
        <label>Violating Audit context</label>
        <input type="text" id="ci-aud" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Severity (High/Medium/Low)</label>
        <input type="text" id="ci-sev" class="styled-input" placeholder="High" required>
      </div>
      <div class="form-group">
        <label>Infraction Description</label>
        <input type="text" id="ci-desc" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Assignee Owner</label>
        <input type="text" id="ci-own" class="styled-input" required>
      </div>
      <button type="submit" class="btn-sketch btn-danger w-100">Raise incident alert</button>
    </form>
  `;
  openModal('Raise Governance Compliance Violation', html);
}

async function submitComplianceForm(e) {
  e.preventDefault();
  const payload = {
    audit: document.getElementById('ci-aud').value,
    severity: document.getElementById('ci-sev').value,
    description: document.getElementById('ci-desc').value,
    owner: document.getElementById('ci-own').value,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] // +7 days
  };
  const res = await fetch(`${API_BASE}/compliance-issues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    closeModal();
    showToast('Violation logged. Alerts dispatched.', 'success');
    refreshView();
  }
}

function openChallengeModal(id = null) {
  const html = `
    <form onsubmit="submitChallengeForm(event)">
      <div class="form-group">
        <label>Title</label>
        <input type="text" id="ch-t" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Category</label>
        <input type="text" id="ch-cat" class="styled-input" placeholder="Carbon Reduction" required>
      </div>
      <div class="form-group">
        <label>Description</label>
        <input type="text" id="ch-desc" class="styled-input" placeholder="Describe the challenge" required>
      </div>
      <div class="form-group">
        <label>XP Points</label>
        <input type="number" id="ch-xp" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Difficulty (Easy/Medium/Hard)</label>
        <input type="text" id="ch-diff" class="styled-input" placeholder="Easy" required>
      </div>
      <div class="form-group">
        <label>Deadline</label>
        <input type="date" id="ch-deadline" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="ch-status" class="styled-select" required>
          <option value="Draft">Draft</option>
          <option value="Active" selected>Active</option>
          <option value="Under Review">Under Review</option>
          <option value="Completed">Completed</option>
          <option value="Archived">Archived</option>
        </select>
      </div>
      <div class="form-group">
        <label class="auth-check-row"><input type="checkbox" id="ch-evidence" checked> Evidence required</label>
      </div>
      <button type="submit" class="btn-sketch btn-amber w-100">Publish Challenge specs</button>
    </form>
  `;
  openModal('Publish Sustainability Challenge', html);
}

async function submitChallengeForm(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('ch-t').value,
    category: document.getElementById('ch-cat').value,
    description: document.getElementById('ch-desc').value,
    xp: parseInt(document.getElementById('ch-xp').value, 10),
    difficulty: document.getElementById('ch-diff').value,
    evidenceRequired: document.getElementById('ch-evidence').checked,
    deadline: document.getElementById('ch-deadline').value,
    status: document.getElementById('ch-status').value
  };
  const res = await fetch(`${API_BASE}/challenges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    closeModal();
    showToast('New Challenge registered.', 'success');
    refreshView();
  }
}

function openBadgeModal() {
  const html = `
    <form onsubmit="submitBadgeForm(event)">
      <div class="form-group">
        <label>Badge Name</label>
        <input type="text" id="b-name" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Description</label>
        <input type="text" id="b-desc" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Unlock rule condition</label>
        <input type="text" id="b-rule" class="styled-input" placeholder="completedChallenges >= 3" required>
      </div>
      <div class="form-group">
        <label>Emoji Icon</label>
        <input type="text" id="b-icon" class="styled-input" placeholder="♻️" required>
      </div>
      <button type="submit" class="btn-sketch btn-amber w-100">Create Badge</button>
    </form>
  `;
  openModal('Add Achievement Badge', html);
}

async function submitBadgeForm(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('b-name').value,
    description: document.getElementById('b-desc').value,
    unlockRule: document.getElementById('b-rule').value,
    icon: document.getElementById('b-icon').value
  };
  const res = await fetch(`${API_BASE}/badges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    closeModal();
    showToast('Achievement badge registered.', 'success');
    refreshView();
  }
}

function openRewardModal() {
  const html = `
    <form onsubmit="submitRewardForm(event)">
      <div class="form-group">
        <label>Name</label>
        <input type="text" id="r-name" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Description</label>
        <input type="text" id="r-desc" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Points Required</label>
        <input type="number" id="r-pts" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Stock Count</label>
        <input type="number" id="r-stk" class="styled-input" required>
      </div>
      <button type="submit" class="btn-sketch btn-amber w-100">Add Reward incentive</button>
    </form>
  `;
  openModal('Add Reward Item', html);
}

async function submitRewardForm(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('r-name').value,
    description: document.getElementById('r-desc').value,
    pointsRequired: parseInt(document.getElementById('r-pts').value, 10),
    stock: parseInt(document.getElementById('r-stk').value, 10),
    status: 'Active'
  };
  const res = await fetch(`${API_BASE}/rewards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    closeModal();
    showToast('Reward item published.', 'success');
    refreshView();
  }
}

async function redeemReward(rewardId, name, cost) {
  if (confirm(`Redeem reward: "${name}" for ${cost} points?`)) {
    const res = await fetch(`${API_BASE}/rewards/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rewardId, employeeName: currentUser })
    });
    if (res.ok) {
      showToast('Reward redeemed successfully.', 'success');
      loadEmployeesSelector();
      refreshView();
    } else {
      const errorData = await res.json();
      showToast(errorData.error, 'danger');
    }
  }
}

function openDepartmentModal(id = null) {
  // Fix #6: Load existing departments to populate parent dropdown
  fetch(`${API_BASE}/departments`)
    .then(r => r.json())
    .then(depts => {
      let existingDept = { name: '', code: '', head: '', parent: '', employees: '', status: 'Active' };
      if (id) {
        const found = depts.find(d => d.id === id);
        if (found) existingDept = found;
      }

      const parentOptions = depts
        .filter(d => d.id !== id) // can't be own parent
        .map(d => `<option value="${d.name}" ${existingDept.parent === d.name ? 'selected' : ''}>${d.name}</option>`)
        .join('');

      const html = `
        <form onsubmit="submitDeptForm(event, ${id ? `'${id}'` : 'null'})">
          <div class="form-group">
            <label>Name</label>
            <input type="text" id="d-name" class="styled-input" value="${existingDept.name}" required>
          </div>
          <div class="form-group">
            <label>Code Tag</label>
            <input type="text" id="d-code" class="styled-input" value="${existingDept.code}" required>
          </div>
          <div class="form-group">
            <label>Department Head</label>
            <input type="text" id="d-head" class="styled-input" value="${existingDept.head}" required>
          </div>
          <div class="form-group">
            <label>Parent Department (optional)</label>
            <select id="d-parent" class="styled-select">
              <option value="">— None (top-level) —</option>
              ${parentOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Staff headcount</label>
            <input type="number" id="d-employees" class="styled-input" value="${existingDept.employees}" required>
          </div>
          <button type="submit" class="btn-sketch btn-emerald w-100">Save registry</button>
        </form>
      `;
      openModal(id ? 'Edit Department' : 'Register Department', html);
    })
    .catch(() => {
      showToast('Failed to load departments for form.', 'danger');
    });
}

async function submitDeptForm(e, id) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('d-name').value,
    code: document.getElementById('d-code').value,
    head: document.getElementById('d-head').value,
    parent: document.getElementById('d-parent')?.value || null,
    employees: parseInt(document.getElementById('d-employees').value, 10),
    status: 'Active'
  };
  const res = await fetch(id ? `${API_BASE}/departments/${id}` : `${API_BASE}/departments`, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    closeModal();
    showToast('Department registry saved.', 'success');
    refreshView();
  } else {
    const err = await res.json().catch(() => ({ error: 'Save failed.' }));
    showToast(err.error || 'Save failed.', 'danger');
  }
}

function openCategoryModal() {
  const html = `
    <form onsubmit="submitCategoryForm(event)">
      <div class="form-group">
        <label>Category Label</label>
        <input type="text" id="cat-n" class="styled-input" required>
      </div>
      <div class="form-group">
        <label>Module Type (Challenge / CSR Activity)</label>
        <input type="text" id="cat-t" class="styled-input" placeholder="Challenge" required>
      </div>
      <button type="submit" class="btn-sketch btn-emerald w-100">Save Category</button>
    </form>
  `;
  openModal('Add Category', html);
}

async function submitCategoryForm(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('cat-n').value,
    type: document.getElementById('cat-t').value,
    status: 'Active'
  };
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    closeModal();
    showToast('Category created.', 'success');
    refreshView();
  }
}

// Join challenge logic
async function joinChallenge(challengeId) {
  const employeeName = currentAuthUser?.user_metadata?.full_name || currentUser;
  if (!employeeName || currentAuthRole === 'Administrator') {
    showToast('Please sign in as a non-admin employee to join a challenge.', 'warning');
    return;
  }

  const res = await fetch(`${API_BASE}/challenge-participation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId, employee: employeeName, progress: 0 })
  });

  if (res.ok) {
    showToast('Challenge joined successfully.', 'success');
    refreshView();
    return;
  }

  const errorData = await res.json().catch(() => ({ error: 'Unable to join challenge.' }));
  showToast(errorData.error || 'Unable to join challenge.', 'danger');
}

async function updateChallengeLifecycle(challengeId, status) {
  const res = await fetch(`${API_BASE}/challenges/${challengeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });

  if (res.ok) {
    showToast(`Challenge moved to ${status}.`, 'success');
    loadChallenges();
    return;
  }

  const errorData = await res.json().catch(() => ({ error: 'Unable to update challenge status.' }));
  showToast(errorData.error || 'Unable to update challenge status.', 'danger');
}

// Generate reports — supports both CSV and JSON (Fix #3)
function exportReport(reportType, format = 'csv') {
  const module = reportType;
  const queryMap = { environmental: 'Environmental', social: 'Social', governance: 'Governance' };
  const moduleParam = queryMap[reportType.toLowerCase()] || reportType;

  fetch(`${API_BASE}/reports?module=${moduleParam}`)
    .then(r => r.json())
    .then(data => {
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `EcoSphere_${module}_Report.json`;
        link.click();
        URL.revokeObjectURL(url);
        showToast('Report downloaded as JSON.', 'success');
      } else {
        const header = 'Module,Name,Value,Date,Department';
        const rows = data.map(item =>
          `"${item.module}","${item.name}","${item.valueDisplay}",${item.date},"${item.department || 'N/A'}"`
        );
        const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([header, ...rows].join('\n'));
        const link = document.createElement('a');
        link.setAttribute('href', csvContent);
        link.setAttribute('download', `EcoSphere_${module}_Report.csv`);
        link.click();
        showToast('Report downloaded as CSV.', 'success');
      }
    })
    .catch(() => showToast('Export failed.', 'danger'));
}

// Date time formatter helper
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}
