const express = require('express');
const cors = require('cors');
const path = require('path');
const dbHelper = require('./db-helper');

const app = express();
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jbwdnlnnrgpnolnlejgz.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_KOXR-fW63KpUzfVaiyC1QA_jv6HV08G';

app.use(cors());
app.use(express.json());

function normalizeRole(role) {
  const value = String(role || '').toLowerCase();
  if (value.includes('admin')) return 'Administrator';
  if (value.includes('esg')) return 'ESG Manager';
  if (value.includes('hr')) return 'HR Manager';
  if (value.includes('compliance') || value.includes('audit')) return 'Compliance Officer';
  if (value.includes('department')) return 'Department Head';
  return 'Employee';
}

function ensureAuditLogStore(db) {
  if (!Array.isArray(db.auditLogs)) {
    db.auditLogs = [];
  }
}

function isLocalDevRequest(req) {
  return process.env.DISABLE_AUTH === 'true' || req.hostname === 'localhost' || req.hostname === '127.0.0.1' || (req.headers.host || '').startsWith('localhost');
}

function appendAuditLog(db, entry) {
  ensureAuditLogStore(db);
  db.auditLogs.unshift({
    id: `AUTH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    ...entry
  });
}

async function authenticateRequest(req, res, next) {
  if (req.path === '/auth/activity') {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    if (isLocalDevRequest(req)) {
      req.authUser = {
        id: 'local-dev',
        email: 'local-demo@ecosphere.local',
        role: 'Administrator',
        metadata: {},
        appMetadata: {}
      };
      return next();
    }
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (isLocalDevRequest(req)) {
        req.authUser = {
          id: 'local-dev',
          email: 'local-demo@ecosphere.local',
          role: 'Administrator',
          metadata: {},
          appMetadata: {}
        };
        return next();
      }
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    const user = await response.json();
    req.authUser = {
      id: user.id,
      email: user.email,
      role: normalizeRole(user.user_metadata?.role || user.app_metadata?.role || 'Employee'),
      metadata: user.user_metadata || {},
      appMetadata: user.app_metadata || {}
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication verification failed.' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (req.authUser?.role === 'Administrator' || allowedRoles.includes(req.authUser?.role)) {
      return next();
    }

    const db = dbHelper.readDb();
    appendAuditLog(db, {
      actor: req.authUser?.email || 'unknown',
      role: req.authUser?.role || 'Unknown',
      eventType: 'ACCESS_DENIED',
      route: req.originalUrl,
      method: req.method,
      details: { allowedRoles }
    });
    dbHelper.writeDb(db);
    return res.status(403).json({ error: 'You do not have permission to access this resource.' });
  };
}

function requireWriteRole(...args) {
  let allowedRoles = args;
  let allowPaths = [];
  if (args.length > 0 && Array.isArray(args[args.length - 1])) {
    allowPaths = args[args.length - 1];
    allowedRoles = args.slice(0, -1);
  }
  return (req, res, next) => {
    if (req.method === 'GET') return next();
    if (allowPaths.some((allowedPath) => req.path === allowedPath || req.path.startsWith(allowedPath))) {
      return next();
    }
    return requireRole(...allowedRoles)(req, res, next);
  };
}

app.use('/api', authenticateRequest);

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../public')));

app.post('/api/auth/activity', (req, res) => {
  const db = dbHelper.readDb();
  ensureAuditLogStore(db);
  appendAuditLog(db, {
    actor: req.authUser?.email || req.body.email || 'unknown',
    role: req.authUser?.role || normalizeRole(req.body.role || 'Employee'),
    eventType: String(req.body.eventType || 'SESSION_EVENT').toUpperCase(),
    route: '/api/auth/activity',
    method: 'POST',
    details: {
      userId: req.body.userId || req.authUser?.id || '',
      email: req.body.email || req.authUser?.email || ''
    }
  });
  dbHelper.writeDb(db);
  res.json({ message: 'Auth activity recorded.' });
});

app.get('/api/audit-logs', requireRole('Administrator'), (req, res) => {
  const db = dbHelper.readDb();
  ensureAuditLogStore(db);
  res.json(db.auditLogs);
});

app.use('/api/config', requireWriteRole('Administrator'));
app.use('/api/departments', requireRole('Administrator'));
app.use('/api/categories', requireRole('Administrator'));
app.use('/api/emission-factors', requireWriteRole('ESG Manager', 'Administrator', 'Department Head'));
app.use('/api/products', requireWriteRole('ESG Manager', 'Administrator', 'Department Head'));
app.use('/api/goals', requireWriteRole('ESG Manager', 'Administrator', 'Department Head'));
app.use('/api/carbon-transactions', requireWriteRole('ESG Manager', 'Administrator', 'Department Head'));
app.use('/api/erp-transaction', requireWriteRole('ESG Manager', 'Administrator', 'Department Head'));
app.use('/api/csr-activities', requireWriteRole('HR Manager', 'Administrator'));
app.use('/api/csr-participation', (req, res, next) => {
  if (req.path.includes('/approve')) {
    return requireRole('HR Manager', 'Department Head', 'Administrator')(req, res, next);
  }
  return next();
});
app.use('/api/policies', requireWriteRole('Compliance Officer', 'Administrator'));
app.use('/api/policy-acknowledgements', requireWriteRole('Compliance Officer', 'Administrator', 'HR Manager', 'Department Head', 'ESG Manager', 'Employee'));
app.use('/api/audits', requireWriteRole('Compliance Officer', 'Administrator'));
app.use('/api/compliance-issues', requireWriteRole('Compliance Officer', 'Administrator'));
app.use('/api/badges', requireWriteRole('HR Manager', 'ESG Manager', 'Administrator'));
app.use('/api/rewards', (req, res, next) => {
  if (req.path === '/redeem') return next();
  return requireWriteRole('HR Manager', 'ESG Manager', 'Administrator')(req, res, next);
});
app.use('/api/challenges', requireWriteRole('HR Manager', 'ESG Manager', 'Administrator'));
app.use('/api/challenge-participation', (req, res, next) => {
  if (req.path.includes('/approve')) {
    return requireRole('HR Manager', 'Department Head', 'Administrator')(req, res, next);
  }
  return next();
});
app.use('/api/notifications/read', requireRole('Administrator', 'ESG Manager', 'HR Manager', 'Compliance Officer', 'Department Head', 'Employee'));
app.use('/api/notifications', requireRole('Administrator', 'ESG Manager', 'HR Manager', 'Compliance Officer', 'Department Head', 'Employee'));
app.use('/api/reports', requireRole('Administrator', 'ESG Manager', 'HR Manager', 'Compliance Officer', 'Department Head', 'Employee'));
app.use('/api/employees', requireRole('Administrator', 'ESG Manager', 'HR Manager', 'Compliance Officer', 'Department Head', 'Employee'));

// ==========================================
// 1. SYSTEM CONFIGURATION & SCORES
// ==========================================

// Get master config
app.get('/api/config', (req, res) => {
  try {
    const db = dbHelper.readDb();
    res.json(db.config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update master config
app.post('/api/config', (req, res) => {
  try {
    const db = dbHelper.readDb();
    db.config = { ...db.config, ...req.body };
    dbHelper.writeDb(db);
    res.json(db.config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dynamically calculated ESG scores
app.get('/api/scores', (req, res) => {
  try {
    const db = dbHelper.readDb();
    const scores = dbHelper.calculateScores(db);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. MASTER DATA ENDPOINTS
// ==========================================

// --- DEPARTMENTS ---
app.get('/api/departments', (req, res) => {
  const db = dbHelper.readDb();
  res.json(db.departments);
});

app.post('/api/departments', (req, res) => {
  const db = dbHelper.readDb();

  // Validate parent FK if provided
  if (req.body.parent) {
    const parentExists = db.departments.some(
      (d) => d.name.toLowerCase() === req.body.parent.toLowerCase()
    );
    if (!parentExists) {
      return res.status(400).json({ error: `Parent department '${req.body.parent}' does not exist.` });
    }
  }

  const newDept = {
    id: `DEPT-${Date.now()}`,
    ...req.body,
    status: req.body.status || 'Active'
  };
  db.departments.push(newDept);
  dbHelper.writeDb(db);
  res.status(201).json(newDept);
});

app.put('/api/departments/:id', (req, res) => {
  const db = dbHelper.readDb();
  const index = db.departments.findIndex((d) => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Department not found' });

  // Validate parent FK if provided
  if (req.body.parent) {
    const parentExists = db.departments.some(
      (d) => d.name.toLowerCase() === req.body.parent.toLowerCase() && d.id !== req.params.id
    );
    if (!parentExists) {
      return res.status(400).json({ error: `Parent department '${req.body.parent}' does not exist.` });
    }
  }

  db.departments[index] = { ...db.departments[index], ...req.body };
  dbHelper.writeDb(db);
  res.json(db.departments[index]);
});

app.delete('/api/departments/:id', (req, res) => {
  const db = dbHelper.readDb();
  db.departments = db.departments.filter((d) => d.id !== req.params.id);
  dbHelper.writeDb(db);
  res.json({ message: 'Department deleted successfully' });
});

// --- CATEGORIES ---
app.get('/api/categories', (req, res) => {
  const db = dbHelper.readDb();
  res.json(db.categories);
});

app.post('/api/categories', (req, res) => {
  const db = dbHelper.readDb();
  const newCat = {
    id: `CAT-${Date.now()}`,
    ...req.body,
    status: req.body.status || 'Active'
  };
  db.categories.push(newCat);
  dbHelper.writeDb(db);
  res.status(201).json(newCat);
});

app.put('/api/categories/:id', (req, res) => {
  const db = dbHelper.readDb();
  const index = db.categories.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Category not found' });
  db.categories[index] = { ...db.categories[index], ...req.body };
  dbHelper.writeDb(db);
  res.json(db.categories[index]);
});

app.delete('/api/categories/:id', (req, res) => {
  const db = dbHelper.readDb();
  db.categories = db.categories.filter((c) => c.id !== req.params.id);
  dbHelper.writeDb(db);
  res.json({ message: 'Category deleted successfully' });
});

// --- EMISSION FACTORS ---
app.get('/api/emission-factors', (req, res) => {
  const db = dbHelper.readDb();
  res.json(db.emissionFactors);
});

app.post('/api/emission-factors', (req, res) => {
  const db = dbHelper.readDb();
  const newEf = {
    id: `EF-${Date.now()}`,
    ...req.body,
    status: req.body.status || 'Active'
  };
  db.emissionFactors.push(newEf);
  dbHelper.writeDb(db);
  res.status(201).json(newEf);
});

app.put('/api/emission-factors/:id', (req, res) => {
  const db = dbHelper.readDb();
  const index = db.emissionFactors.findIndex((e) => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Emission factor not found' });
  db.emissionFactors[index] = { ...db.emissionFactors[index], ...req.body };
  dbHelper.writeDb(db);
  res.json(db.emissionFactors[index]);
});

app.delete('/api/emission-factors/:id', (req, res) => {
  const db = dbHelper.readDb();
  db.emissionFactors = db.emissionFactors.filter((e) => e.id !== req.params.id);
  dbHelper.writeDb(db);
  res.json({ message: 'Emission factor deleted successfully' });
});

// --- PRODUCTS ESG PROFILES ---
app.get('/api/products', (req, res) => {
  const db = dbHelper.readDb();
  res.json(db.products);
});

app.post('/api/products', (req, res) => {
  const db = dbHelper.readDb();
  const newProduct = {
    id: `P-${Date.now()}`,
    ...req.body,
    status: req.body.status || 'Active'
  };
  db.products.push(newProduct);
  dbHelper.writeDb(db);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const db = dbHelper.readDb();
  const index = db.products.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });
  db.products[index] = { ...db.products[index], ...req.body };
  dbHelper.writeDb(db);
  res.json(db.products[index]);
});

app.delete('/api/products/:id', (req, res) => {
  const db = dbHelper.readDb();
  db.products = db.products.filter((p) => p.id !== req.params.id);
  dbHelper.writeDb(db);
  res.json({ message: 'Product deleted successfully' });
});

// --- ENVIRONMENTAL GOALS ---
app.get('/api/goals', (req, res) => {
  const db = dbHelper.readDb();
  res.json(db.goals);
});

app.post('/api/goals', (req, res) => {
  const db = dbHelper.readDb();
  const newGoal = {
    id: `G-${Date.now()}`,
    name: req.body.name,
    department: req.body.department,
    targetCO2: Number(req.body.targetCO2),
    currentCO2: Number(req.body.currentCO2 || 0),
    deadline: req.body.deadline,
    status: req.body.status || 'Active'
  };
  db.goals.push(newGoal);
  dbHelper.writeDb(db);
  res.status(201).json(newGoal);
});

app.put('/api/goals/:id', (req, res) => {
  const db = dbHelper.readDb();
  const index = db.goals.findIndex((g) => g.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Goal not found' });
  db.goals[index] = {
    ...db.goals[index],
    ...req.body,
    targetCO2: req.body.targetCO2 !== undefined ? Number(req.body.targetCO2) : db.goals[index].targetCO2,
    currentCO2: req.body.currentCO2 !== undefined ? Number(req.body.currentCO2) : db.goals[index].currentCO2
  };
  dbHelper.writeDb(db);
  res.json(db.goals[index]);
});

app.delete('/api/goals/:id', (req, res) => {
  const db = dbHelper.readDb();
  db.goals = db.goals.filter((g) => g.id !== req.params.id);
  dbHelper.writeDb(db);
  res.json({ message: 'Goal deleted successfully' });
});

// --- ESG POLICIES ---
app.get('/api/policies', (req, res) => {
  const db = dbHelper.readDb();
  res.json(db.policies);
});

app.post('/api/policies', (req, res) => {
  const db = dbHelper.readDb();
  const newPolicy = {
    id: `POL-${Date.now()}`,
    ...req.body,
    status: req.body.status || 'Active'
  };
  db.policies.push(newPolicy);
  dbHelper.writeDb(db);
  res.status(201).json(newPolicy);
});

app.put('/api/policies/:id', (req, res) => {
  const db = dbHelper.readDb();
  const index = db.policies.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Policy not found' });
  db.policies[index] = { ...db.policies[index], ...req.body };
  dbHelper.writeDb(db);
  res.json(db.policies[index]);
});

app.delete('/api/policies/:id', (req, res) => {
  const db = dbHelper.readDb();
  db.policies = db.policies.filter((p) => p.id !== req.params.id);
  dbHelper.writeDb(db);
  res.json({ message: 'Policy deleted successfully' });
});

// --- BADGES ---
app.get('/api/badges', (req, res) => {
  const db = dbHelper.readDb();
  res.json(db.badges);
});

app.post('/api/badges', (req, res) => {
  const db = dbHelper.readDb();
  const newBadge = {
    id: `BDG-${Date.now()}`,
    ...req.body
  };
  db.badges.push(newBadge);
  dbHelper.writeDb(db);
  res.status(201).json(newBadge);
});

// --- REWARDS ---
app.get('/api/rewards', (req, res) => {
  const db = dbHelper.readDb();
  res.json(db.rewards);
});

app.post('/api/rewards', (req, res) => {
  const db = dbHelper.readDb();
  const newReward = {
    id: `REW-${Date.now()}`,
    name: req.body.name,
    description: req.body.description,
    pointsRequired: Number(req.body.pointsRequired),
    stock: Number(req.body.stock),
    status: req.body.status || 'Active'
  };
  db.rewards.push(newReward);
  dbHelper.writeDb(db);
  res.status(201).json(newReward);
});

app.put('/api/rewards/:id', (req, res) => {
  const db = dbHelper.readDb();
  const index = db.rewards.findIndex((r) => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Reward not found' });
  db.rewards[index] = {
    ...db.rewards[index],
    ...req.body,
    pointsRequired: req.body.pointsRequired !== undefined ? Number(req.body.pointsRequired) : db.rewards[index].pointsRequired,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : db.rewards[index].stock
  };
  dbHelper.writeDb(db);
  res.json(db.rewards[index]);
});

app.delete('/api/rewards/:id', (req, res) => {
  const db = dbHelper.readDb();
  db.rewards = db.rewards.filter((r) => r.id !== req.params.id);
  dbHelper.writeDb(db);
  res.json({ message: 'Reward deleted successfully' });
});


// ==========================================
// 3. TRANSACTIONAL ENDPOINTS
// ==========================================

// --- CARBON TRANSACTIONS ---
app.get('/api/carbon-transactions', (req, res) => {
  const db = dbHelper.readDb();
  res.json(db.carbonTransactions);
});

// Standard Logging endpoint
app.post('/api/carbon-transactions', (req, res) => {
  const db = dbHelper.readDb();
  const value = Number(req.body.value);
  const calculated = req.body.calculatedEmission !== undefined ? Number(req.body.calculatedEmission) : dbHelper.calculateEmission(req.body.sourceType, value, db);
  
  const newTx = {
    id: `T-${Date.now()}`,
    sourceType: req.body.sourceType,
    value: value,
    unit: req.body.unit,
    calculatedEmission: calculated,
    department: req.body.department,
    transactionDate: req.body.transactionDate || new Date().toISOString().split('T')[0],
    associatedRecordId: req.body.associatedRecordId || `MANUAL-${Date.now()}`,
    autoGenerated: req.body.autoGenerated || false
  };

  db.carbonTransactions.unshift(newTx);
  dbHelper.writeDb(db);
  res.status(201).json(newTx);
});

// Simulating automatic emission calculations from ERP
app.post('/api/erp-transaction', (req, res) => {
  try {
    const db = dbHelper.readDb();
    const value = Number(req.body.value);
    
    // Auto Emission lookup
    const calculated = dbHelper.calculateEmission(req.body.sourceType, value, db);
    
    const newTx = {
      id: `T-${Date.now()}`,
      sourceType: req.body.sourceType,
      value: value,
      unit: req.body.unit,
      calculatedEmission: calculated,
      department: req.body.department,
      transactionDate: req.body.transactionDate || new Date().toISOString().split('T')[0],
      associatedRecordId: req.body.associatedRecordId || `ERP-${Date.now()}`,
      autoGenerated: true
    };
    
    db.carbonTransactions.unshift(newTx);
    
    // Also update current carbon values of goals for this department
    const deptGoals = db.goals.filter(
      (g) => g.department.toLowerCase() === req.body.department.toLowerCase() && g.status === 'On Track'
    );
    
    if (deptGoals.length > 0) {
      // Find the first goal and simulate emission impact
      deptGoals[0].currentCO2 = Number((deptGoals[0].currentCO2 + (calculated / 1000)).toFixed(2)); // convert kg to tons
    }

    dbHelper.writeDb(db);
    res.status(201).json({ transaction: newTx, autoCalculated: db.config.autoEmissionCalculation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/carbon-transactions/:id', (req, res) => {
  const db = dbHelper.readDb();
  db.carbonTransactions = db.carbonTransactions.filter((t) => t.id !== req.params.id);
  dbHelper.writeDb(db);
  res.json({ message: 'Transaction deleted successfully' });
});

// --- CSR ACTIVITIES ---
app.get('/api/csr-activities', (req, res) => {
  const db = dbHelper.readDb();
  res.json(db.csrActivities);
});

app.post('/api/csr-activities', (req, res) => {
  const db = dbHelper.readDb();
  const newActivity = {
    id: `CSR-${Date.now()}`,
    title: req.body.title,
    category: req.body.category,
    description: req.body.description,
    pointsAwarded: Number(req.body.pointsAwarded),
    date: req.body.date,
    capacity: Number(req.body.capacity),
    status: req.body.status || 'Open'
  };
  db.csrActivities.push(newActivity);
  dbHelper.writeDb(db);
  res.status(201).json(newActivity);
});

// --- CSR PARTICIPATION & APPROVAL ---
app.get('/api/csr-participation', (req, res) => {
  const db = dbHelper.readDb();
  res.json(db.csrParticipation);
});

app.post('/api/csr-participation', (req, res) => {
  const db = dbHelper.readDb();

  // Validate evidence requirement
  if (db.config.evidenceRequirement && !req.body.proof) {
    return res.status(400).json({ error: 'Evidence is required to participate in CSR Activities.' });
  }

  const newParticipation = {
    id: `CSRP-${Date.now()}`,
    employee: req.body.employee,
    activityId: req.body.activityId,
    proof: req.body.proof || '',
    approvalStatus: 'Pending',
    pointsEarned: 0,
    completionDate: req.body.completionDate || new Date().toISOString().split('T')[0]
  };

  db.csrParticipation.unshift(newParticipation);
  dbHelper.writeDb(db);
  res.status(201).json(newParticipation);
});

// Admin Approve/Reject CSR Participation
app.post('/api/csr-participation/:id/approve', (req, res) => {
  const db = dbHelper.readDb();
  const part = db.csrParticipation.find((p) => p.id === req.params.id);
  if (!part) return res.status(404).json({ error: 'Participation record not found' });

  const isApprove = req.body.approved; // true or false
  part.approvalStatus = isApprove ? 'Approved' : 'Rejected';

  let unlockedBadges = [];

  if (isApprove) {
    const activity = db.csrActivities.find((a) => a.id === part.activityId);
    if (activity) {
      part.pointsEarned = activity.pointsAwarded;
      // Award employee XP and points
      const emp = db.employees.find((e) => e.name.toLowerCase() === part.employee.toLowerCase());
      if (emp) {
        emp.xp = (emp.xp || 0) + activity.pointsAwarded;
        emp.points = (emp.points || 0) + activity.pointsAwarded;
      } else {
        // Create dynamic employee if they didn't exist in seed data
        db.employees.push({
          name: part.employee,
          department: 'Corporate', // default
          xp: activity.pointsAwarded,
          points: activity.pointsAwarded,
          badges: []
        });
      }
      
      // Auto-award badges check
      unlockedBadges = dbHelper.checkAndAwardBadges(part.employee, db);

      // Create notification
      db.notifications.unshift({
        id: `NOT-${Date.now()}`,
        type: 'Approval',
        message: `CSR Activity '${activity.title}' approved for ${part.employee}. +${activity.pointsAwarded} XP/Points!`,
        timestamp: new Date().toISOString(),
        read: false
      });
    }
  } else {
    // Create notification for rejection
    const activity = db.csrActivities.find((a) => a.id === part.activityId);
    db.notifications.unshift({
      id: `NOT-${Date.now()}`,
      type: 'Approval',
      message: `CSR Activity '${activity ? activity.title : 'Unknown'}' participation rejected for ${part.employee}.`,
      timestamp: new Date().toISOString(),
      read: false
    });
  }

  dbHelper.writeDb(db);
  res.json({ participation: part, unlockedBadges });
});

// --- CHALLENGES ---
app.get('/api/challenges', (req, res) => {
  const db = dbHelper.readDb();
  res.json(db.challenges);
});

app.post('/api/challenges', (req, res) => {
  const db = dbHelper.readDb();
  const newChallenge = {
    id: `CH-${Date.now()}`,
    title: req.body.title,
    category: req.body.category,
    description: req.body.description,
    xp: Number(req.body.xp),
    difficulty: req.body.difficulty,
    evidenceRequired: req.body.evidenceRequired || false,
    deadline: req.body.deadline,
    status: req.body.status || 'Draft' // Draft, Active, Under Review, Completed, Archived
  };
  db.challenges.push(newChallenge);
  dbHelper.writeDb(db);
  res.status(201).json(newChallenge);
});

app.put('/api/challenges/:id', (req, res) => {
  const db = dbHelper.readDb();
  const index = db.challenges.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Challenge not found' });
  db.challenges[index] = {
    ...db.challenges[index],
    ...req.body,
    xp: req.body.xp !== undefined ? Number(req.body.xp) : db.challenges[index].xp
  };
  dbHelper.writeDb(db);
  res.json(db.challenges[index]);
});

// --- CHALLENGE PARTICIPATION & APPROVAL ---
app.get('/api/challenge-participation', (req, res) => {
  const db = dbHelper.readDb();
  res.json(db.challengeParticipation);
});

app.post('/api/challenge-participation', (req, res) => {
  const db = dbHelper.readDb();
  const challenge = db.challenges.find((c) => c.id === req.body.challengeId);
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

  if (req.authUser?.role === 'Administrator') {
    return res.status(403).json({ error: 'Administrators cannot join challenges as participants.' });
  }

  if (challenge.status !== 'Active') {
    return res.status(400).json({ error: 'You can only join challenges that are currently Active.' });
  }

  // Validate evidence rule
  if (challenge.evidenceRequired && !req.body.proof) {
    return res.status(400).json({ error: 'Evidence is required to submit this challenge.' });
  }

  const newPart = {
    id: `CHPN-${Date.now()}`,
    challengeId: req.body.challengeId,
    employee: req.body.employee,
    progress: Number(req.body.progress || 0),
    proof: req.body.proof || '',
    proofFilename: req.body.proofFilename || '',
    approval: req.body.progress == 100 ? 'Pending' : 'Open', // wait for admin if 100%
    xpAwarded: 0
  };

  db.challengeParticipation.unshift(newPart);
  dbHelper.writeDb(db);
  res.status(201).json(newPart);
});

// Update challenge progress
app.put('/api/challenge-participation/:id', (req, res) => {
  const db = dbHelper.readDb();
  const part = db.challengeParticipation.find((p) => p.id === req.params.id);
  if (!part) return res.status(404).json({ error: 'Participation not found' });

  const challenge = db.challenges.find((c) => c.id === part.challengeId);
  if (challenge && challenge.evidenceRequired && Number(req.body.progress) === 100 && !req.body.proof && !part.proof) {
    return res.status(400).json({ error: 'Evidence file is required for challenge completion.' });
  }

  part.progress = Number(req.body.progress);
  if (req.body.proof) part.proof = req.body.proof;
  if (req.body.proofFilename) part.proofFilename = req.body.proofFilename;
  
  if (part.progress === 100) {
    part.approval = 'Pending';
  }

  dbHelper.writeDb(db);
  res.json(part);
});

// Admin Approve/Reject Challenge completion
app.post('/api/challenge-participation/:id/approve', (req, res) => {
  const db = dbHelper.readDb();
  const part = db.challengeParticipation.find((p) => p.id === req.params.id);
  if (!part) return res.status(404).json({ error: 'Participation record not found' });

  const isApprove = req.body.approved;
  part.approval = isApprove ? 'Approved' : 'Rejected';

  let unlockedBadges = [];

  if (isApprove) {
    const challenge = db.challenges.find((c) => c.id === part.challengeId);
    if (challenge) {
      part.xpAwarded = challenge.xp;
      // Update employee
      const emp = db.employees.find((e) => e.name.toLowerCase() === part.employee.toLowerCase());
      if (emp) {
        emp.xp = (emp.xp || 0) + challenge.xp;
        emp.points = (emp.points || 0) + challenge.xp; // Points balance scales with XP
      } else {
        db.employees.push({
          name: part.employee,
          department: 'Corporate',
          xp: challenge.xp,
          points: challenge.xp,
          badges: []
        });
      }

      // Check auto-award badges
      unlockedBadges = dbHelper.checkAndAwardBadges(part.employee, db);

      // Create notification
      db.notifications.unshift({
        id: `NOT-${Date.now()}`,
        type: 'Approval',
        message: `Challenge '${challenge.title}' approved for ${part.employee}. +${challenge.xp} XP!`,
        timestamp: new Date().toISOString(),
        read: false
      });
    }
  } else {
    const challenge = db.challenges.find((c) => c.id === part.challengeId);
    db.notifications.unshift({
      id: `NOT-${Date.now()}`,
      type: 'Approval',
      message: `Challenge '${challenge ? challenge.title : 'Unknown'}' completion rejected for ${part.employee}.`,
      timestamp: new Date().toISOString(),
      read: false
    });
  }

  dbHelper.writeDb(db);
  res.json({ participation: part, unlockedBadges });
});

// --- POLICY ACKNOWLEDGEMENTS ---
app.get('/api/policy-acknowledgements', (req, res) => {
  const db = dbHelper.readDb();
  res.json(db.policyAcknowledgements);
});

app.post('/api/policy-acknowledgements', (req, res) => {
  const db = dbHelper.readDb();

  // Avoid duplicate acknowledgements
  const exists = db.policyAcknowledgements.some(
    (pa) => pa.employee.toLowerCase() === req.body.employee.toLowerCase() && pa.policy.toLowerCase() === req.body.policy.toLowerCase()
  );

  if (exists) {
    return res.status(400).json({ error: 'Policy already acknowledged by this employee.' });
  }

  const newAck = {
    id: `PA-${Date.now()}`,
    employee: req.body.employee,
    policy: req.body.policy,
    acknowledgedDate: new Date().toISOString().split('T')[0]
  };

  db.policyAcknowledgements.push(newAck);

  // Check auto-award badges (e.g. Policy Acknowledger)
  const unlockedBadges = dbHelper.checkAndAwardBadges(req.body.employee, db);

  dbHelper.writeDb(db);
  res.status(201).json({ acknowledgement: newAck, unlockedBadges });
});

// --- AUDITS ---
app.get('/api/audits', (req, res) => {
  const db = dbHelper.readDb();
  res.json(db.audits);
});

app.post('/api/audits', (req, res) => {
  const db = dbHelper.readDb();
  const newAudit = {
    id: `AUD-${Date.now()}`,
    title: req.body.title,
    department: req.body.department,
    auditor: req.body.auditor,
    date: req.body.date || new Date().toISOString().split('T')[0],
    findings: req.body.findings || '',
    status: req.body.status || 'Pending'
  };
  db.audits.push(newAudit);
  dbHelper.writeDb(db);
  res.status(201).json(newAudit);
});

app.put('/api/audits/:id', (req, res) => {
  const db = dbHelper.readDb();
  const index = db.audits.findIndex((a) => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Audit not found' });
  db.audits[index] = { ...db.audits[index], ...req.body };
  dbHelper.writeDb(db);
  res.json(db.audits[index]);
});

// --- COMPLIANCE ISSUES ---
app.get('/api/compliance-issues', (req, res) => {
  const db = dbHelper.readDb();
  res.json(db.complianceIssues);
});

app.post('/api/compliance-issues', (req, res) => {
  const db = dbHelper.readDb();
  const newIssue = {
    id: `CI-${Date.now()}`,
    audit: req.body.audit,
    severity: req.body.severity,
    description: req.body.description,
    owner: req.body.owner,
    dueDate: req.body.dueDate,
    status: 'Open'
  };
  db.complianceIssues.push(newIssue);

  // Send Notification if config allows
  if (db.config.notifications.complianceIssues) {
    db.notifications.unshift({
      id: `NOT-${Date.now()}`,
      type: 'Compliance',
      message: `New High Severity Compliance Issue raised: '${req.body.description}' (Owner: ${req.body.owner}).`,
      timestamp: new Date().toISOString(),
      read: false
    });
  }

  dbHelper.writeDb(db);
  res.status(201).json(newIssue);
});

app.put('/api/compliance-issues/:id', (req, res) => {
  const db = dbHelper.readDb();
  const index = db.complianceIssues.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Compliance issue not found' });
  
  const oldStatus = db.complianceIssues[index].status;
  db.complianceIssues[index] = { ...db.complianceIssues[index], ...req.body };

  // Notify of resolution
  if (oldStatus === 'Open' && req.body.status === 'Resolved') {
    db.notifications.unshift({
      id: `NOT-${Date.now()}`,
      type: 'Compliance',
      message: `Compliance Issue owned by ${db.complianceIssues[index].owner} has been Resolved.`,
      timestamp: new Date().toISOString(),
      read: false
    });
  }

  dbHelper.writeDb(db);
  res.json(db.complianceIssues[index]);
});

app.delete('/api/compliance-issues/:id', (req, res) => {
  const db = dbHelper.readDb();
  db.complianceIssues = db.complianceIssues.filter((c) => c.id !== req.params.id);
  dbHelper.writeDb(db);
  res.json({ message: 'Compliance issue deleted' });
});


// ==========================================
// 4. EMPLOYEES & GAMIFICATION EXTRAS
// ==========================================

app.get('/api/employees', (req, res) => {
  const db = dbHelper.readDb();
  res.json(db.employees);
});

// Provision a new employee record (called on signup or first login)
app.post('/api/employees', (req, res) => {
  const db = dbHelper.readDb();
  const { name, department, role, gender } = req.body;

  if (!name) return res.status(400).json({ error: 'Employee name is required.' });

  // Idempotent: don't duplicate if already exists
  const existing = db.employees.find((e) => e.name.toLowerCase() === name.toLowerCase());
  if (existing) return res.json(existing);

  const newEmployee = {
    name,
    department: department || 'Corporate',
    role: role || 'Employee',
    gender: gender || 'Unspecified',
    xp: 0,
    points: 0,
    badges: []
  };

  db.employees.push(newEmployee);
  dbHelper.writeDb(db);
  res.status(201).json(newEmployee);
});

// Update an existing employee (admin only)
app.put('/api/employees/:name', requireRole('Administrator', 'HR Manager'), (req, res) => {
  const db = dbHelper.readDb();
  const index = db.employees.findIndex(
    (e) => e.name.toLowerCase() === req.params.name.toLowerCase()
  );
  if (index === -1) return res.status(404).json({ error: 'Employee not found.' });

  db.employees[index] = { ...db.employees[index], ...req.body };
  dbHelper.writeDb(db);
  res.json(db.employees[index]);
});

// Delete an employee record (admin only)
app.delete('/api/employees/:name', requireRole('Administrator'), (req, res) => {
  const db = dbHelper.readDb();
  const before = db.employees.length;
  db.employees = db.employees.filter(
    (e) => e.name.toLowerCase() !== req.params.name.toLowerCase()
  );
  if (db.employees.length === before) return res.status(404).json({ error: 'Employee not found.' });
  dbHelper.writeDb(db);
  res.json({ message: 'Employee record deleted.' });
});

// Diversity metrics – computed live from employee data
app.get('/api/diversity-metrics', (req, res) => {
  const db = dbHelper.readDb();

  const total = db.employees.length;
  const genderCounts = { Male: 0, Female: 0 };
  db.employees.forEach((e) => {
    const genderValue = (e.gender || '').trim();
    if (genderValue === 'Male' || genderValue === 'Female') {
      genderCounts[genderValue] += 1;
    }
  });

  const genderBreakdown = ['Male', 'Female'].map((label) => ({
    label,
    count: genderCounts[label],
    pct: total > 0 ? Math.round((genderCounts[label] / total) * 100) : 0
  }));

  // Training completions
  const trainingCompletions = Array.isArray(db.trainingCompletions) ? db.trainingCompletions : [];
  const completedTrainings = trainingCompletions.filter((t) => t.status === 'Completed').length;
  const totalTrainings = trainingCompletions.length;
  const trainingCompletionRate = totalTrainings > 0
    ? Math.round((completedTrainings / totalTrainings) * 100)
    : null;

  // CSR participation rate
  const uniqueParticipants = new Set(
    db.csrParticipation
      .filter((p) => p.approvalStatus === 'Approved')
      .map((p) => p.employee.toLowerCase())
  ).size;
  const csrParticipationRate = total > 0 ? Math.round((uniqueParticipants / total) * 100) : 0;

  res.json({
    totalEmployees: total,
    genderBreakdown,
    trainingCompletionRate,
    trainingCompletions: completedTrainings,
    totalTrainings,
    csrParticipationRate
  });
});

// Reward catalog redemption logic
app.post('/api/rewards/redeem', (req, res) => {
  const db = dbHelper.readDb();
  const { rewardId, employeeName } = req.body;

  const reward = db.rewards.find((r) => r.id === rewardId);
  if (!reward) return res.status(404).json({ error: 'Reward not found.' });

  if (reward.stock <= 0) {
    return res.status(400).json({ error: 'Reward is currently out of stock.' });
  }

  const employee = db.employees.find((e) => e.name.toLowerCase() === employeeName.toLowerCase());
  if (!employee) {
    return res.status(404).json({ error: 'Employee profile not found.' });
  }

  if (employee.points < reward.pointsRequired) {
    return res.status(400).json({
      error: `Insufficient points. Required: ${reward.pointsRequired}, Available: ${employee.points}`
    });
  }

  // Deduct points, decrease stock
  employee.points -= reward.pointsRequired;
  reward.stock -= 1;

  // Add notification
  db.notifications.unshift({
    id: `NOT-${Date.now()}`,
    type: 'Redemption',
    message: `${employee.name} successfully redeemed reward: ${reward.name} (-${reward.pointsRequired} points).`,
    timestamp: new Date().toISOString(),
    read: false
  });

  dbHelper.writeDb(db);
  res.json({ employee, reward });
});

// ==========================================
// 5. NOTIFICATION CENTER
// ==========================================

app.get('/api/notifications', (req, res) => {
  const db = dbHelper.readDb();
  
  // Dynamic overdue checks during get
  const today = new Date().toISOString().split('T')[0];
  db.complianceIssues.forEach((issue) => {
    if (issue.status === 'Open' && issue.dueDate < today) {
      // Check if already notified
      const alreadyNotified = db.notifications.some(
        (n) => n.type === 'Overdue' && n.message.includes(issue.id)
      );
      if (!alreadyNotified) {
        db.notifications.unshift({
          id: `NOT-${Date.now()}-${issue.id}`,
          type: 'Overdue',
          message: `OVERDUE WARNING: Compliance Issue [${issue.id}] owned by ${issue.owner} has passed its due date (${issue.dueDate}).`,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    }
  });

  if (db.config.notifications?.reminders) {
    const activePolicies = db.policies.filter((policy) => policy.status === 'Active');
    activePolicies.forEach((policy) => {
      const acknowledgedCount = db.policyAcknowledgements.filter(
        (ack) => ack.policy.toLowerCase() === policy.name.toLowerCase()
      ).length;

      const shouldRemind = acknowledgedCount < db.employees.length;
      const reminderId = `NOT-REM-${policy.id}`;
      const alreadyNotified = db.notifications.some((notification) => notification.id === reminderId);

      if (shouldRemind && !alreadyNotified) {
        db.notifications.unshift({
          id: reminderId,
          type: 'Reminder',
          message: `Policy acknowledgement reminder: '${policy.name}' still needs employee acknowledgements.`,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    });
  }
  
  dbHelper.writeDb(db);
  res.json(db.notifications);
});

// Mark all as read
app.post('/api/notifications/read', (req, res) => {
  const db = dbHelper.readDb();
  db.notifications.forEach((n) => (n.read = true));
  dbHelper.writeDb(db);
  res.json({ message: 'All notifications marked as read' });
});


// ==========================================
// 6. REPORTS ENGINE
// ==========================================

app.get('/api/reports', (req, res) => {
  const db = dbHelper.readDb();
  const { department, module, startDate, endDate, employee, challenge, category } = req.query;

  let results = [];

  // Determine source data
  if (module === 'Environmental' || !module) {
    results = results.concat(
      db.carbonTransactions.map((item) => ({
        ...item,
        module: 'Environmental',
        name: `Emissions log: ${item.sourceType} (${item.value} ${item.unit})`,
        valueDisplay: `${item.calculatedEmission} kg CO2`,
        date: item.transactionDate
      }))
    );
  }

  if (module === 'Social' || !module) {
    // CSR activity participation
    results = results.concat(
      db.csrParticipation.map((part) => {
        const activity = db.csrActivities.find((a) => a.id === part.activityId);
        return {
          id: part.id,
          module: 'Social',
          department: 'Corporate', // default placeholder
          name: `CSR Participation: ${activity ? activity.title : 'CSR Activity'} (${part.employee})`,
          valueDisplay: `${part.pointsEarned} Points`,
          date: part.completionDate,
          employee: part.employee,
          status: part.approvalStatus
        };
      })
    );
  }

  if (module === 'Governance' || !module) {
    // Audits and Policy acknowledgements
    results = results.concat(
      db.audits.map((a) => ({
        id: a.id,
        module: 'Governance',
        department: a.department,
        name: `Governance Audit: ${a.title}`,
        valueDisplay: a.findings,
        date: a.date,
        status: a.status
      }))
    );

    results = results.concat(
      db.policyAcknowledgements.map((pa) => ({
        id: pa.id,
        module: 'Governance',
        department: 'Corporate',
        name: `Policy Acknowledged: ${pa.policy} (${pa.employee})`,
        valueDisplay: 'Acknowledged',
        date: pa.acknowledgedDate,
        employee: pa.employee
      }))
    );
  }

  if (module === 'Gamification' || !module) {
    // Challenge completions
    results = results.concat(
      db.challengeParticipation.map((part) => {
        const challengeItem = db.challenges.find((c) => c.id === part.challengeId);
        return {
          id: part.id,
          module: 'Gamification',
          department: 'Corporate',
          name: `Challenge Completion: ${challengeItem ? challengeItem.title : 'Challenge'} (${part.employee})`,
          valueDisplay: `${part.xpAwarded} XP`,
          date: new Date().toISOString().split('T')[0], // placeholder
          employee: part.employee,
          challenge: challengeItem ? challengeItem.title : '',
          status: part.approval
        };
      })
    );
  }

  // Apply filters
  let filtered = results;

  if (department) {
    filtered = filtered.filter(
      (item) => item.department && item.department.toLowerCase() === department.toLowerCase()
    );
  }

  if (employee) {
    filtered = filtered.filter(
      (item) => item.employee && item.employee.toLowerCase() === employee.toLowerCase()
    );
  }

  if (challenge) {
    filtered = filtered.filter(
      (item) => item.challenge && item.challenge.toLowerCase().includes(challenge.toLowerCase())
    );
  }

  if (startDate) {
    filtered = filtered.filter((item) => item.date >= startDate);
  }

  if (endDate) {
    filtered = filtered.filter((item) => item.date <= endDate);
  }

  res.json(filtered);
});

// Catch-all: Serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start Express Server
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`==================================================`);
    console.log(`EcoSphere ESG Management Platform Server started.`);
    console.log(`Running locally at: http://localhost:${port}`);
    console.log(`==================================================`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error(err);
    }
  });
}

if (require.main === module) {
  startServer(PORT);
}

module.exports = app;
