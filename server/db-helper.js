const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');
const SEED_PATH = path.join(__dirname, 'seed-data.json');

// Initialize database
function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    const seedData = fs.readFileSync(SEED_PATH, 'utf8');
    fs.writeFileSync(DB_PATH, seedData, 'utf8');
  }
}

// Read database
function readDb() {
  initDb();
  const data = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(data);
}

// Write database
function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// Calculate Auto Emission for a transaction
function calculateEmission(sourceType, value, db) {
  if (!db.config.autoEmissionCalculation) return 0;
  const factor = db.emissionFactors.find(
    (f) => f.activity.toLowerCase() === sourceType.toLowerCase() && f.status === 'Active'
  );
  if (!factor) return 0;
  return Number((value * factor.value).toFixed(2));
}

// Helper to run Badge Auto-Award logic
function checkAndAwardBadges(employeeName, db) {
  if (!db.config.badgeAutoAward) return [];

  const employee = db.employees.find((e) => e.name.toLowerCase() === employeeName.toLowerCase());
  if (!employee) return [];

  // Gather metrics for the employee
  const xp = employee.xp || 0;
  
  const completedChallenges = db.challengeParticipation.filter(
    (cp) => cp.employee.toLowerCase() === employeeName.toLowerCase() && cp.approval === 'Approved' && cp.progress === 100
  ).length;

  const policiesAcknowledged = db.policyAcknowledgements.filter(
    (pa) => pa.employee.toLowerCase() === employeeName.toLowerCase()
  ).length;

  const unlockedBadges = [];

  db.badges.forEach((badge) => {
    // If the employee already has the badge, skip
    if (employee.badges && employee.badges.includes(badge.id)) return;

    let unlocked = false;
    const rule = badge.unlockRule;

    if (rule.includes('xp >=') || rule.includes('xp >=')) {
      const targetXp = parseInt(rule.replace(/[^0-9]/g, ''), 10);
      if (xp >= targetXp) unlocked = true;
    } else if (rule.includes('completedChallenges >=') || rule.includes('completedChallenges >=')) {
      const targetChallenges = parseInt(rule.replace(/[^0-9]/g, ''), 10);
      if (completedChallenges >= targetChallenges) unlocked = true;
    } else if (rule.includes('policiesAcknowledged >=') || rule.includes('policiesAcknowledged >=')) {
      const targetPolicies = parseInt(rule.replace(/[^0-9]/g, ''), 10);
      if (policiesAcknowledged >= targetPolicies) unlocked = true;
    }

    if (unlocked) {
      if (!employee.badges) employee.badges = [];
      employee.badges.push(badge.id);
      unlockedBadges.push(badge);

      // Create a notification
      const newNotif = {
        id: `NOT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'Badge',
        message: `${employee.name} unlocked Badge: ${badge.name}! ${badge.icon}`,
        timestamp: new Date().toISOString(),
        read: false
      };
      db.notifications.unshift(newNotif);
    }
  });

  return unlockedBadges;
}

// Calculate ESG scores (Department scores and Organization scores)
function calculateScores(db) {
  const departments = db.departments.filter((d) => d.status === 'Active');
  const weights = db.config.weights || { environmental: 40, social: 30, governance: 30 };

  const deptScores = departments.map((dept) => {
    // 1. Environmental Score Calculation
    // Base: 70
    // + Average progress of environmental goals in this department (30%)
    // - High emissions penalty if emissions are excessive relative to employee count
    const deptGoals = db.goals.filter((g) => g.department.toLowerCase() === dept.name.toLowerCase());
    let goalScore = 80; // default if no goals
    if (deptGoals.length > 0) {
      const totalProgress = deptGoals.reduce((sum, g) => {
        const progress = g.targetCO2 > 0 ? (g.currentCO2 / g.targetCO2) * 100 : 100;
        return sum + Math.min(progress, 100);
      }, 0);
      goalScore = totalProgress / deptGoals.length;
    }

    const deptEmissions = db.carbonTransactions
      .filter((t) => t.department.toLowerCase() === dept.name.toLowerCase())
      .reduce((sum, t) => sum + (t.calculatedEmission || 0), 0);

    // Emission intensity: kg CO2 per employee. Lower is better.
    const intensity = dept.employees > 0 ? deptEmissions / dept.employees : 0;
    const emissionScore = Math.max(0, 100 - intensity * 0.1); // penalty factor

    const environmentalScore = Math.round((goalScore * 0.6) + (emissionScore * 0.4));

    // 2. Social Score Calculation
    // Base: 60
    // + CSR Activity completion count for employees in this department (each approved counts as +5 points)
    // + Challenge completion count (each approved challenge counts as +5 points)
    // Cap at 100
    // Let's identify employees in this department
    const deptEmployees = db.employees.filter((e) => e.department.toLowerCase() === dept.name.toLowerCase());
    const empNames = deptEmployees.map(e => e.name.toLowerCase());

    let approvedCsrCount = 0;
    let approvedChallengeCount = 0;

    if (empNames.length > 0) {
      approvedCsrCount = db.csrParticipation.filter(
        (p) => empNames.includes(p.employee.toLowerCase()) && p.approvalStatus === 'Approved'
      ).length;

      approvedChallengeCount = db.challengeParticipation.filter(
        (cp) => empNames.includes(cp.employee.toLowerCase()) && cp.approval === 'Approved' && cp.progress === 100
      ).length;
    }

    const socialScore = Math.min(100, 70 + (approvedCsrCount * 5) + (approvedChallengeCount * 5));

    // 3. Governance Score Calculation
    // Base: 70
    // + Policy acknowledgement rate: percentage of employees in department acknowledging active policies
    // - Compliance issues penalty: -10 for high severity, -5 for medium severity, -2 for low severity
    const activePolicies = db.policies.filter(p => p.status === 'Active');
    let ackRate = 1.0;
    if (deptEmployees.length > 0 && activePolicies.length > 0) {
      let totalAcks = 0;
      deptEmployees.forEach(emp => {
        const acks = db.policyAcknowledgements.filter(pa => pa.employee.toLowerCase() === emp.name.toLowerCase()).length;
        totalAcks += acks;
      });
      const totalExpected = deptEmployees.length * activePolicies.length;
      ackRate = totalExpected > 0 ? totalAcks / totalExpected : 1.0;
    }

    // Find compliance issues for this department (audit department matches)
    const deptAudits = db.audits.filter(a => a.department.toLowerCase() === dept.name.toLowerCase()).map(a => a.title.toLowerCase());
    const openIssues = db.complianceIssues.filter(
      (ci) => ci.status === 'Open' && deptAudits.includes(ci.audit.toLowerCase())
    );

    const compliancePenalty = openIssues.reduce((sum, ci) => {
      if (ci.severity === 'High') return sum + 10;
      if (ci.severity === 'Medium') return sum + 5;
      return sum + 2;
    }, 0);

    const governanceScore = Math.max(0, Math.min(100, Math.round(ackRate * 100 - compliancePenalty)));

    // Total Score
    const totalScore = Math.round(
      (environmentalScore * weights.environmental +
        socialScore * weights.social +
        governanceScore * weights.governance) / 100
    );

    return {
      department: dept.name,
      environmentalScore,
      socialScore,
      governanceScore,
      totalScore,
      employees: dept.employees
    };
  });

  // Calculate Overall Organization Score (Weighted by Department Employees count)
  let totalEmployees = 0;
  let weightedEnv = 0;
  let weightedSoc = 0;
  let weightedGov = 0;
  let weightedTotal = 0;

  deptScores.forEach((ds) => {
    totalEmployees += ds.employees;
    weightedEnv += ds.environmentalScore * ds.employees;
    weightedSoc += ds.socialScore * ds.employees;
    weightedGov += ds.governanceScore * ds.employees;
    weightedTotal += ds.totalScore * ds.employees;
  });

  const overallScores = {
    environmental: totalEmployees > 0 ? Math.round(weightedEnv / totalEmployees) : 75,
    social: totalEmployees > 0 ? Math.round(weightedSoc / totalEmployees) : 75,
    governance: totalEmployees > 0 ? Math.round(weightedGov / totalEmployees) : 75,
    overall: totalEmployees > 0 ? Math.round(weightedTotal / totalEmployees) : 75
  };

  return {
    departments: deptScores,
    overall: overallScores
  };
}

module.exports = {
  readDb,
  writeDb,
  calculateEmission,
  checkAndAwardBadges,
  calculateScores
};
