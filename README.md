# EcoSphere: ESG Management Platform

EcoSphere is a comprehensive Environmental, Social, and Governance (ESG) Management Platform that integrates ESG reporting and gamification directly into day-to-day corporate operations.

## Technology Stack

- **Frontend**: Single-Page Application (SPA) built with HTML5, Vanilla CSS3 (glassmorphic dark mode), and JavaScript.
- **Visualizations**: Interactive charts powered by Chart.js.
- **Backend**: Node.js and Express.js REST APIs.
- **Database**: Local JSON File Database (`server/db.json`) for persistence, inspectability, and ease of deployment.

---

## Features

1. **Dashboard & Visualizations**:
   - Dynamic Environmental, Social, Governance, and Overall Score panels.
   - Interactive line chart for carbon emissions trends (last 6 months).
   - Dynamic bar chart for department-wise ESG score comparisons.
   - Live activity ticker feeds.

2. **Environmental (Carbon Accounting)**:
   - Configure Scope 1, 2, and 3 Emission Factors.
   - Automatic and manual carbon calculations.
   - Trace carbon transactions down to associated reference IDs.
   - Product ESG profiling (recyclability %, carbon footprint, ethical sourcing).
   - Sustainability Goals tracking with dynamic progress bars and status indicators.

3. **Social (CSR & Diversity)**:
   - CSR Activities Catalog with active employee registration.
   - Admin participation approval queue.
   - Semi-quantitative Diversity dashboards (participation rates, gender ratios).

4. **Governance (Policies & Audits)**:
   - Corporate Policy directory with digital employee signatures (acknowledgements).
   - Internal audit registry tracking findings.
   - Severity-tagged compliance violation logger with automatic overdue reminders.

5. **Gamification (XP, Badges & Rewards)**:
   - Challenge lifecycle manager (Draft → Active → Review → Completed).
   - Automatic badge awarding logic (based on XP, completed challenges, policy checks).
   - Redeemable Rewards Catalog with point deductions and live stock levels.
   - Podium-based department and employee leaderboards.

6. **Reports & Exports**:
   - Custom Report Builder with multiple filtering levels (Date range, Module, Department, Employee).
   - Standard PDF/Excel simulated exports in CSV and JSON formats.

---

## Setup & Running Locally

Ensure you have [Node.js](https://nodejs.org) installed on your system.

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Platform Server**:
   ```bash
   npm start
   ```

3. **Open in Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Testing & Walkthrough Guide

To evaluate the core features out of the box, we have preloaded the database with rich seed data:

1. **Simulate ERP Auto Emission**:
   - Click **Log ERP Transaction** under quick actions on the Dashboard.
   - Input a fleet record (e.g. `100 Liters` of diesel for Logistics).
   - With *Auto Emission Calculation* toggled **ON** in Settings, witness the automatically calculated Carbon Transaction (using the Fleet Emission Factor) logged instantly.
   
2. **Employee Gamification Loop**:
   - Change your acting role from **Administrator** to **Priya Sharma** using the selector in the top bar.
   - Note the XP/Points stats update in the header.
   - Navigate to **Gamification** → **Challenges**, join the **Bike to Work Day** challenge, click **Update Progress** and submit it at `100%`.
   - Now, switch back to **Administrator** role. Navigate to **Gamification** → **Challenges**, click **Review Submissions**, and click **Approve Completion**.
   - Switch back to **Priya Sharma** to witness her XP balance increase.
   - Navigate to **Rewards**, and redeem an **Organic Cotton Tote Bag** using her earned points. Observe the stock count decrease and points deduct.
   
3. **Governance Due Date Alerts**:
   - When viewing notifications, overdue compliance issues will trigger Warning flags alerting the owner and the administrator immediately.
