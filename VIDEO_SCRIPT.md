# EcoSphere ESG Platform - Comprehensive Video Script

## INTRO / OPENING (0:00 - 0:30)

**[Host speaking to camera with enthusiasm]**

"Hello! Welcome to **EcoSphere**, an enterprise-grade Environmental, Social, and Governance management platform built for modern organizations. Whether you're tracking carbon emissions, managing compliance policies, running corporate social responsibility programs, or rewarding employee sustainability behavior, EcoSphere brings it all together in one unified workspace.

In this video, I'll walk you through every page, every button, and every feature so you understand exactly how this platform works. Let's get started!"

---

## PAGE 1: LANDING / WELCOME PAGE (0:30 - 2:00)

**[Screen shows the landing page]**

### Top Section - Hero Message
"When you first arrive at EcoSphere, you're greeted with the **Welcome Page**, which serves as the entry point to the platform. At the top, you'll see the **EcoSphere brand** with our tagline: 'One platform for ESG, CSR, compliance, and employee engagement.'

The subtitle explains the core value proposition: 'Track carbon, manage policies, run CSR programs, and reward sustainability behavior from a single internal workspace built for enterprise teams.'"

### Call-to-Action Buttons
"There are two primary buttons here:

1. **'Go to Login' Button** (Green/Emerald colored) - This takes you to the secure login page where you can sign in with your email and password. Click this when you're ready to access your role-based dashboard.

2. **'Explore Features' Button** (Grey) - This smoothly scrolls down to show you all six core capabilities of the platform without logging in, so you can learn about what EcoSphere offers."

### Role Chips Display
"Below the buttons, you'll see six role chips: Admin, ESG Manager, HR, Auditor, Department Head, and Employee. These represent all the different user types that EcoSphere supports. Each role has different permissions and sees different modules tailored to their responsibilities."

### Security Card
"On the right side, there's a **Security Information Card** explaining:
- **Authentication**: You'll log in with your email or employee ID and password on a dedicated secure login page
- **Access Control**: Each role sees only the modules they're authorized to use
- **Security Features**: Session checks, audit logging, and protected API routes keep everything secure
- **Login Flow**: Simply press 'Go to Login' to proceed"

### Statistics Section
"Below that are three key statistics that tell you what to expect:
- **6 Core Modules**: Environmental, Social, Governance, Gamification, Reports, and Settings
- **6+ User Groups**: Each team sees only their authorized areas
- **Real-time Automation**: Automatic emissions calculations, reminders, badge awards, and score updates happen instantly"

### Feature Grid
"At the bottom, you'll see six feature cards, each describing a major capability:

1. **Environmental Management** - Calculate carbon emissions, configure emission factors, compare targets against actual footprints, and track department-wide environmental impact

2. **Social Responsibility** - Run CSR activities, manage employee participation, track volunteering hours, and measure social engagement across your organization

3. **Governance & Compliance** - Share compliance policies, capture employee acknowledgements, schedule audits, and track compliance issues with full traceability

4. **Gamification** - Let employees earn XP points, unlock sustainability badges, join environmental challenges, and redeem rewards for taking green actions

5. **Dashboards & Reports** - Surface your ESG scores in real-time, view trend graphs, and export reports for management and stakeholder communication

6. **Administration & Automation** - Manage departments, categories, system notifications, and settings while automating repetitive tasks"

---

## PAGE 2: LOGIN PAGE (2:00 - 4:30)

**[Screen transitions to login page]**

"Once you click 'Go to Login', you arrive at the **Login & Authentication Page**. This page has four tabs and several forms to handle different authentication scenarios."

### Back Link
"At the top left, there's a **'Back to Home'** link that takes you back to the welcome page if you clicked here by mistake."

### Header & Logo
"The EcoSphere logo and a green shield icon show this is the secure authentication area. The title reads 'Secure Login'."

### Four Authentication Tabs
"There are four tabs at the top, each handling a different authentication workflow:

#### Tab 1: LOG IN (Default tab)
"The first tab is **'Log In'**, which is shown by default. This form asks for:

- **Email or Employee ID field** - You can enter either your company email (like name@company.com) OR your employee ID (like EMP001). The system accepts both.
- **Password field** - Enter your secure password
- **'Remember me' checkbox** - If checked, the system remembers your login on this device
- **Authentication Hint text** - Reminds you that 'RBAC applies after login', meaning your role-based access controls take effect once you're authenticated
- **'Log In' Button** (Green/Emerald) - Submits your credentials and authenticates you

When you click Log In, the system:
1. Verifies your credentials against Supabase (the secure authentication backend)
2. Checks your role (Administrator, ESG Manager, HR Manager, etc.)
3. Records the login event for audit logging
4. Takes you to the main app dashboard with your role-specific modules visible"

#### Tab 2: SIGN UP
"The second tab is **'Sign Up'** for creating a new employee account. This form has several fields:

- **Full Name field** - Your complete name
- **Employee ID field** - Your unique company employee ID (like EMP001)
- **Email field** - Your company email address
- **Role dropdown** - Six options: Employee, Department Head, HR Manager, ESG Manager, Compliance Officer, or Administrator. Your role determines what modules you can access
- **Password field** - Create a secure password
- **Password Requirements text** - Shows the rules: Minimum 8 characters with uppercase, lowercase, numbers, and special characters

When you click **'Create Account'** (Sky blue button):
1. The system validates your password strength
2. Creates your account in Supabase
3. Saves your employee record in the database
4. Assigns you the role you selected
5. Logs you in automatically
6. Takes you to your personalized dashboard"

#### Tab 3: FORGOT PASSWORD
"The third tab is **'Forgot Password'** for account recovery. This form is simple:

- **Email field** - Enter your company email address
- **'Send Reset Link' Button** (Purple) - Sends a password reset email to your inbox

When you click Send Reset Link:
1. The system checks if an account exists with that email
2. Generates a secure reset token
3. Sends you an email with a reset link
4. You click the link to access the password change form
5. Set your new password securely"

#### Tab 4: CHANGE PASSWORD
"The fourth tab is **'Change Password'** for updating an existing password. This form requires:

- **New Password field** - Your new secure password
- **Confirm Password field** - Re-enter your new password to make sure it matches
- **'Update Password' Button** (Amber/Gold) - Confirms and updates your password

This is useful if you want to change your password after logging in, or if you're in a password recovery session."

### Security Information
"At the bottom of the login page, there's a security notice explaining:
- **Access control**: Each role sees only authorized modules
- **Security**: Sessions, audit logging, and role checks are enforced after sign-in
- **RBAC**: Role-Based Access Control restricts read/write access by user role"

---

## PAGE 3: MAIN APPLICATION DASHBOARD (4:30 - 15:00)

**[Screen transitions to the main app]**

"Once logged in, you enter the **Main Application Dashboard**. This is where all the action happens. Let me break down every section."

### Left Sidebar Navigation
"On the left, there's a **Sidebar Navigation Panel** with a fixed list of all modules and sub-sections. The sidebar is organized by major areas:

**DASHBOARD**
- Dashboard link (with chart pie icon) - Your main overview and analytics

**ENVIRONMENTAL Section**
- Emission Factors - Configure carbon multipliers for different activities
- Product ESG Profiles - Define sustainability attributes for products
- Carbon Transactions - Log carbon emission events
- Environmental Goals - Set targets for emissions reduction

**SOCIAL Section**
- CSR Activities - Create and manage corporate social responsibility programs
- Employee Participation - View who's joined which CSR activities
- Diversity Dashboard - Track team diversity metrics

**GOVERNANCE Section**
- Policies - Write and publish compliance policies
- Policy Acknowledgements - Track which employees have acknowledged which policies
- Audits - Schedule and manage compliance audits
- Compliance Issues - Log and track compliance problems

**GAMIFICATION Section**
- Challenges - Create sustainability challenges for employees
- Badges - Define achievement badges employees can unlock
- Rewards - Set up rewards employees can redeem with XP points
- Leaderboard - View which employees are winning

**REPORTS Section**
- ESG Summary - Pre-built ESG score reports
- Custom Report Builder - Create your own reports

**SETTINGS Section**
- Departments - Manage company departments
- Categories - Set up emission and activity categories
- ESG Configuration - Adjust system-wide settings"

### Top Header Bar
"At the top of the page, you'll see:

**Left side - Page Title**
'The main heading shows which view you're currently on (for example, '① Overview: Analytics Dashboard'). This updates as you navigate.

**Right side - User Information Panel**
- **XP/Points Badge** (if you're an employee) - Shows your current XP points and reward points balance. XP increases when you participate in CSR activities or win challenges. Points are the virtual currency you use to redeem rewards.
- **Auth Session Pill** - Displays your current role (like 'Administrator') with a **Log Out button** to exit the platform securely
- **Notification Bell Icon** - Shows the number of unread notifications (0, 5, 10, etc.). Click this to open a slideout panel with your notifications"

### macOS-Style Window Frame
"The main content area is styled like a macOS window with:
- **Red/Yellow/Green traffic light dots** at the top (just for visual design, they don't do anything)
- **Window title text** that shows the current page (like 'EcoSphere: Dashboard')
- **Tabs navigation bar** below the titlebar showing: Dashboard, Environmental, Social, Governance, Gamification, Reports, Settings"

---

## SECTION 1: DASHBOARD VIEW (5:00 - 6:30)

**[Screen shows dashboard]**

"When you first enter the app or click the **Dashboard tab/link**, you see the **Analytics Dashboard**. This is your at-a-glance view of the entire ESG operation.

### Dashboard Elements:

**1. ESG Score Cards** - Three prominent cards at the top showing:
   - **Environmental Score** (out of 100) with a color indicator (red = low, yellow = medium, green = high)
   - **Social Score** (out of 100)
   - **Governance Score** (out of 100)
   
These scores are calculated in real-time based on your activities, emissions, policies, and compliance data.

**2. Overall ESG Index** - A combined score that summarizes all three pillars

**3. Carbon Emissions Trend Chart** - A line graph showing your carbon footprint over time:
   - X-axis: Time periods (weeks, months)
   - Y-axis: Tons of CO2 equivalent
   - Shows whether you're trending up or down
   - Helps you visualize if reduction initiatives are working

**4. Department Performance Chart** - A horizontal bar chart comparing:
   - Each department's carbon output
   - Each department's ESG compliance status
   - Departments with highest impact and highest compliance

**5. Policy Compliance Status** - Shows:
   - Total policies in the system
   - Percentage of employees who've acknowledged each policy
   - Color coding: green for high compliance, orange/red for low

**6. Recent Activity Feed** - A timeline of recent events:
   - 'John Smith completed CSR activity: Beach Cleanup'
   - 'Sarah Johnson approved Compliance Audit'
   - 'New policy: Sustainability Travel Guidelines published'
   
Each entry has a timestamp and icon indicating the type of activity

**7. Quick Stats Summary** - At the bottom:
   - Total employees engaged
   - Total CSR hours logged
   - Total compliance issues (with status breakdown)
   - Active challenges running"

---

## SECTION 2: ENVIRONMENTAL MODULE (6:30 - 9:00)

**[Screen navigates to Environmental > Emission Factors]**

"Let's click on the **Environmental tab** to explore carbon tracking. The Environmental section has four sub-views."

### Sub-View 1: EMISSION FACTORS
"**Emission Factors** is where you define the carbon cost of different activities. This is the foundation of your carbon calculations.

The page shows a **table of emission factors** with columns:
- **Activity Name** - What activity generates emissions (e.g., 'Flight Travel', 'Electricity Usage', 'Vehicle Commute')
- **Category** - Broader grouping (e.g., 'Transportation', 'Energy')
- **Unit** - How it's measured ('Miles', 'kWh', 'Gallons')
- **Emission Factor** - The CO2 multiplier ('0.21 kg CO2 per mile')
- **Last Updated** - When this was last modified

**Action Buttons on each row:**
- **Edit button** - Click to modify the factor value
- **Delete button** - Remove this factor from the system

**Top-right buttons:**
- **Add Emission Factor button** - Opens a form to create a new factor:
  - Activity Name field
  - Category dropdown
  - Unit field
  - Emission Factor (decimal) field
  - Submit button
  
**How it works:**
When an employee logs a carbon transaction (like 'I drove 50 miles'), the system multiplies 50 miles × 0.21 kg CO2/mile = 10.5 kg CO2 automatically."

### Sub-View 2: PRODUCT ESG PROFILES
"Click **Product ESG Profiles** to see a table of company products with their sustainability ratings:

**Table columns:**
- **Product Name** - Official product name
- **Category** - Product type
- **ESG Rating** - Score from 1-100 (or A-F rating)
- **Carbon Footprint** - Estimated emissions for this product
- **Recyclability** - Percentage of product that can be recycled
- **Certifications** - Standards the product meets (ISO, B-Corp, etc.)
- **Last Updated** - Modification date

**Action Buttons:**
- **Edit button** - Update the product's ESG profile
- **Delete button** - Remove a product

**Add button:**
- **Add Product button** - Opens a form:
  - Product Name
  - Category dropdown
  - ESG Rating (0-100 slider)
  - Carbon Footprint (kg CO2 field)
  - Recyclability percentage
  - Certifications (multi-select)
  - Submit button

**Purpose:** Helps procurement teams choose lower-impact products when making purchasing decisions."

### Sub-View 3: CARBON TRANSACTIONS
"**Carbon Transactions** is the log of actual carbon emissions. Think of this as your 'emissions journal'.

**Table shows:**
- **Transaction ID** - Unique identifier
- **Date** - When the activity happened
- **Department** - Which department created this emission
- **Activity** - What caused the emission ('Flight', 'Company Car', 'Electricity')
- **Quantity** - How much ('50 miles', '200 kWh')
- **Emission Factor** - Which factor was applied
- **Total CO2 (kg)** - The calculated result
- **Approver** - Who validated this entry
- **Status** - 'Pending Review', 'Approved', or 'Rejected'

**Action buttons:**
- **View** - See full transaction details
- **Edit** - Change quantity or activity (if still pending)
- **Delete** - Remove the transaction
- **Approve** - If you're a manager, approve this pending entry

**Add Transaction button:**
- Opens a form to manually log emissions:
  - Date picker
  - Department dropdown
  - Activity dropdown (populated from emission factors)
  - Quantity input
  - Approver assignment
  - Submit button

**Automation:** Alternatively, if your company has integrated systems (like ERP), transactions can be imported automatically from purchase orders, travel expense reports, etc."

### Sub-View 4: ENVIRONMENTAL GOALS
"**Environmental Goals** lets you set and track carbon reduction targets.

**Table displays:**
- **Goal Name** - What you're trying to achieve (e.g., 'Reduce Scope 1 Emissions by 25% by 2025')
- **Target** - The specific number (e.g., '1000 tons CO2 reduction')
- **Current Progress** - How much you've achieved so far (e.g., '350 tons CO2')
- **Progress %** - Visual progress bar
- **Deadline** - Target date
- **Owner** - Who's responsible
- **Status** - 'On Track', 'At Risk', 'Achieved'

**Action Buttons:**
- **View** - See goal details and history
- **Edit** - Modify the goal
- **Delete** - Remove the goal
- **Update Progress** - Manually increment progress if not auto-calculated

**Add Goal button:**
- Opens a form:
  - Goal Name
  - Target (numeric)
  - Current Progress (starts at 0)
  - Deadline (date picker)
  - Owner (employee dropdown)
  - Description
  - Submit button

**Real-time Updates:** Environmental Goals automatically update as carbon transactions are approved. For example, if you've set a goal to reduce emissions and employees log lower-carbon activities, the progress bar advances automatically."

---

## SECTION 3: SOCIAL MODULE (9:00 - 11:00)

**[Screen navigates to Social > CSR Activities]**

"Now let's explore the **Social section**, which handles Corporate Social Responsibility and employee engagement."

### Sub-View 1: CSR ACTIVITIES
"**CSR Activities** is where administrators and managers set up volunteer programs and social initiatives.

**Table shows existing activities:**
- **Activity Title** - Name (e.g., 'Beach Cleanup', 'Mentorship Program')
- **Category** - Type of activity ('Volunteering', 'Donation', 'Mentorship')
- **Description** - What the activity entails
- **Participation Points** - XP reward for completing it (e.g., '50 XP')
- **Scheduled Date** - When it's happening
- **Location** - Where it takes place
- **Status** - 'Draft', 'Active', 'Completed', or 'Cancelled'
- **Participants** - How many have joined (e.g., '23 / 50 spots')

**Action Buttons:**
- **Edit** - Modify activity details
- **Delete** - Remove the activity
- **View Participants** - See who joined

**Add Activity button:**
- Opens a form:
  - Activity Title
  - Category dropdown
  - Description (text area)
  - Participation Points (number)
  - Scheduled Date (date/time picker)
  - Location
  - Max Participants (number)
  - Status dropdown
  - Submit button

**Example Flow:** An HR manager clicks 'Add Activity', creates a 'Tree Planting Day' scheduled for next Saturday with 50 XP reward and 50 participant slots. Once saved, employees can see it in the Social section and sign up."

### Sub-View 2: EMPLOYEE PARTICIPATION
"**Employee Participation** shows who's joined which activities and their participation status.

**Table displays:**
- **Employee Name** - Who participated
- **Activity** - Which activity they joined
- **Status** - 'Registered', 'Completed', 'No-Show', or 'Cancelled'
- **Hours Logged** - Volunteering hours they contributed
- **Points Awarded** - XP given (blank if still pending)
- **Approval Status** - 'Pending', 'Approved', or 'Rejected'
- **Date Joined** - When they registered

**Action Buttons:**
- **View Details** - See full participation record
- **Edit** - Adjust hours or status
- **Approve** - Manager button to approve completion and award XP
- **Reject** - Decline the participation claim
- **Delete** - Remove the record

**Manager Workflow:**
When an employee logs participation in an activity, it shows as 'Pending Approval'. The manager reviews the claim and clicks 'Approve'. The system then:
1. Validates the participation is legitimate
2. Awards the promised XP points to the employee's account
3. Updates the employee's total XP and Points balance
4. Checks if the employee has unlocked any new badges
5. Sends the employee a notification: 'Beach Cleanup participation approved! +50 XP!'"

### Sub-View 3: DIVERSITY DASHBOARD
"**Diversity Dashboard** visualizes your organization's diversity across multiple dimensions.

**Charts and metrics shown:**
- **Department Breakdown** - Pie chart showing distribution of employees by department
- **Gender Distribution** - Pie or bar chart (Female/Male/Other/Prefer not to say)
- **Age Groups** - Bar chart of employees by age range (18-25, 26-35, etc.)
- **Years of Service** - Histogram showing tenure distribution
- **Role Distribution** - Who works in each role (HR, Finance, Engineering, etc.)
- **Underrepresented Groups** - Highlights areas that could be more diverse
- **Diversity Score** - Composite score showing overall organizational diversity (0-100)
- **Retention Rate** - Percentage of women, minorities, and other groups retained year-over-year

**Interactive Elements:**
- Hover over sections to see exact numbers
- Click on a section to drill down (e.g., click on 'Engineering' to see breakdown of engineers by demographics)
- Filter by department or time period

**Purpose:** Helps HR teams track progress on diversity, equity, and inclusion goals and identify areas needing more attention."

---

## SECTION 4: GOVERNANCE MODULE (11:00 - 13:00)

**[Screen navigates to Governance > Policies]**

"The **Governance section** manages compliance, policies, and audit trails."

### Sub-View 1: POLICIES
"**Policies** is the central repository for compliance documents.

**Table of policies:**
- **Policy Name** - Title (e.g., 'Data Protection Policy', 'Sustainability Travel Guidelines')
- **Category** - Type (e.g., 'Data Privacy', 'Environmental', 'HR')
- **Effective Date** - When policy goes live
- **Last Updated** - Last modification date
- **Version** - Policy version number
- **Published Status** - 'Draft' or 'Published'
- **Acknowledgement Rate** - % of employees who've read and signed it (e.g., '92%')

**Action Buttons:**
- **View** - Read the full policy document
- **Edit** - Modify the policy
- **Publish** - Make it official (if still in draft)
- **Archive** - Hide old policies
- **Delete** - Remove entirely

**Publish Workflow:**
When you click Publish:
1. The system locks the policy (no more edits)
2. Sends notifications to all employees: 'New policy published: Data Protection Policy. Please read and acknowledge within 7 days.'
3. Employees get a deadline to acknowledge
4. System tracks acknowledgements

**Add Policy button:**
- Opens a form:
  - Policy Title
  - Category dropdown
  - Description / Policy Text (rich text editor with formatting)
  - Category dropdown
  - Effective Date (date picker)
  - Acknowledgement Deadline (date picker)
  - Attachment (optional PDF upload)
  - Submit button

**Compliance Tracking:** After publishing, the system automatically monitors acknowledgement rates. If someone hasn't acknowledged within the deadline, they get reminders."

### Sub-View 2: POLICY ACKNOWLEDGEMENTS
"**Policy Acknowledgements** tracks which employees have read and agreed to each policy.

**Table shows:**
- **Employee Name** - Who acknowledged
- **Policy** - Which policy
- **Acknowledged Date** - When they clicked 'I Agree'
- **Acknowledgement Status** - 'Acknowledged' or 'Pending'
- **Days Overdue** - If they missed the deadline (blank if on time)

**Action Buttons:**
- **View** - See full acknowledgement record
- **Mark as Acknowledged** - Admin override to manually mark as done
- **Send Reminder** - Re-notify the employee

**Employee Experience:**
When an employee logs in and sees an unacknowledged policy, a notification appears: 'You have 1 policy to acknowledge: Data Protection Policy (Due in 3 days)'. They click 'Acknowledge' and see the policy text. At the bottom is a checkbox 'I have read and agree to this policy' and a button 'Submit Acknowledgement'. Once clicked, their record is marked complete.

**Compliance Report:**
A compliance officer can generate a report showing:
- Which employees are non-compliant
- Which policies have the lowest acknowledgement rates
- Average time to acknowledgement
- Overdue reminders sent"

### Sub-View 3: AUDITS
"**Audits** schedules and tracks compliance audits.

**Table displays:**
- **Audit ID** - Unique identifier
- **Audit Type** - What's being audited (e.g., 'Environmental Compliance', 'Data Privacy', 'Safety')
- **Status** - 'Scheduled', 'In Progress', 'Completed'
- **Audit Date** - When it happened
- **Auditor** - Who conducted it
- **Department** - Which department was audited
- **Findings** - Summary of results
- **Priority** - 'Low', 'Medium', 'High'

**Action Buttons:**
- **View Report** - See full audit details
- **Edit** - Modify pending audits
- **Complete Audit** - Mark as done and finalize report
- **Delete** - Remove entry

**Add Audit button:**
- Opens a form:
  - Audit Type dropdown
  - Department dropdown
  - Scheduled Date (date picker)
  - Auditor (employee dropdown)
  - Description
  - Submit button

**Audit Workflow:**
1. Compliance officer schedules an audit
2. System sends notice to the department: 'Environmental Audit scheduled for Oct 15'
3. On audit date, auditor collects evidence, documents findings
4. Completes the audit and uploads report
5. System archives audit for regulatory proof
6. Findings flow into Compliance Issues for follow-up"

### Sub-View 4: COMPLIANCE ISSUES
"**Compliance Issues** tracks problems found during audits or reported by employees.

**Table shows:**
- **Issue ID** - Tracking number
- **Title** - Problem description (e.g., 'Unapproved chemical disposal')
- **Severity** - 'Critical', 'High', 'Medium', 'Low'
- **Status** - 'Open', 'In Progress', 'Resolved', 'Closed'
- **Assigned To** - Who's fixing it
- **Due Date** - Deadline for resolution
- **Department** - Which area is affected
- **Days Open** - How long it's been unresolved (in red if past due)

**Action Buttons:**
- **View** - See full issue details and conversation
- **Edit** - Update status or reassign
- **Resolve** - Mark as fixed
- **Delete** - Remove if duplicate

**Add Issue button:**
- Form fields:
  - Issue Title
  - Description (text area)
  - Severity dropdown
  - Department dropdown
  - Assigned To (dropdown of managers)
  - Due Date (date picker)
  - Submit button

**Tracking System:** Issues have a full audit trail:
- Created: 'Sep 12 by Sarah Johnson: Found non-compliant waste disposal'
- Updated: 'Sep 13: Assigned to Mike Davis'
- Updated: 'Sep 15: Mike comments: Ordered new disposal containers'
- Resolved: 'Sep 20: Mike marks resolved'
- Final status: 'Resolved on Sep 20 by Mike Davis'

Each step is timestamped and logged for regulatory compliance."

---

## SECTION 5: GAMIFICATION MODULE (13:00 - 14:30)

**[Screen navigates to Gamification > Challenges]**

"The **Gamification section** motivates employees through challenges, badges, and rewards."

### Sub-View 1: CHALLENGES
"**Challenges** are short-term competitions that motivate employees to take sustainability actions.

**Table displays:**
- **Challenge Title** - Name (e.g., 'Meatless Monday', 'Zero Waste Week')
- **Category** - Type ('Environmental', 'Social', 'Health')
- **Description** - What to do
- **Difficulty** - 'Easy', 'Medium', 'Hard'
- **XP Reward** - Points for completing (e.g., '100 XP')
- **Start Date** - When challenge begins
- **End Date** - Deadline to complete
- **Participants** - How many joined (e.g., '45 / 100')
- **Status** - 'Draft', 'Active', 'Completed', 'Archived'

**Action Buttons:**
- **View** - See full details and leaderboard
- **Edit** - Modify challenge
- **Delete** - Remove it
- **View Participants** - Who's joined

**Add Challenge button:**
- Form fields:
  - Challenge Title
  - Category dropdown
  - Description (text area)
  - Difficulty (Easy/Medium/Hard)
  - XP Reward (number)
  - Evidence Required? (checkbox - some challenges need proof, like a photo of a reusable water bottle)
  - Start Date (date picker)
  - End Date (date picker)
  - Max Participants (number)
  - Submit button

**Employee Experience:**
When an employee sees an active challenge:
1. They click 'Join Challenge'
2. See the rules and XP reward
3. Track their progress (e.g., 'Days without single-use plastic: 5/7')
4. If evidence is required (like for 'Carpooling Challenge'), they upload a photo
5. Submit completion
6. Manager reviews and approves
7. XP is awarded, badge unlocked, leaderboard updated"

### Sub-View 2: BADGES
"**Badges** are achievements employees unlock for sustainability actions.

**Table shows:**
- **Badge Name** - Title (e.g., 'Carbon Warrior', 'CSR Champion')
- **Icon** - Visual representation
- **Description** - What you did to earn it
- **Unlock Criteria** - Requirements (e.g., '500+ XP earned')
- **Total Unlocked** - How many employees have it
- **Rarity** - 'Common', 'Uncommon', 'Rare', 'Legendary'

**Action Buttons:**
- **View Recipients** - See who has earned it
- **Edit** - Modify criteria
- **Delete** - Remove badge

**Add Badge button:**
- Form fields:
  - Badge Name
  - Description
  - Icon (image upload or selection from library)
  - Unlock Criteria (text description)
  - Rarity level (dropdown)
  - Submit button

**Auto-Award System:**
Badges are often awarded automatically. For example:
- 'Bronze Contributor': Unlocked when employee joins their first CSR activity
- 'Green Thumb': Unlocked after 5 environmental challenges completed
- 'Policy Pioneer': Unlocked after acknowledging all policies within 1 day of publication
- 'Sustainability Champion': Unlocked at 1000 XP

When a badge is earned, employees get a notification with confetti animation and a message: 'Congratulations! You've unlocked the Carbon Warrior badge!'"

### Sub-View 3: REWARDS
"**Rewards** are prizes employees can redeem using their XP/Points balance.

**Table displays:**
- **Reward Name** - What you can get (e.g., 'Starbucks $10 Gift Card', 'Extra Day Off')
- **Description** - Details about the reward
- **Cost** - How many points needed (e.g., '500 Points')
- **Available Quantity** - How many are left to give out (e.g., '23 / 50')
- **Redeemed By** - How many employees have already claimed it
- **Status** - 'Active', 'Sold Out', 'Archived'

**Action Buttons:**
- **View** - See redemption history
- **Edit** - Update cost or description
- **Delete** - Remove reward

**Add Reward button:**
- Form fields:
  - Reward Name
  - Description (text area)
  - Cost in Points (number)
  - Available Quantity (number)
  - Reward Image (upload)
  - Status (dropdown)
  - Redemption Instructions (e.g., 'Present code to HR Manager')
  - Submit button

**Employee Redemption Flow:**
Employee has 750 Points. They see a 'Starbucks $10 Gift Card' for 500 Points. They click:
1. 'Redeem Reward'
2. System confirms: 'This costs 500 Points. You will have 250 Points left. Continue?'
3. Employee clicks 'Confirm Redemption'
4. System:
   - Deducts 500 points from their balance
   - Creates a redemption code (e.g., 'ESG-REWARD-12345')
   - Sends email: 'Your reward is ready! Code: ESG-REWARD-12345. Present this to the HR desk to claim your Starbucks gift card.'
   - Marks reward inventory down by 1
5. Employee takes their code to HR and receives their gift card
6. HR scans code to mark as fulfilled

**Incentive Design:** Companies use rewards to reinforce sustainability behavior. Examples:
- Low-cost digital rewards: Early Friday dismissal, parking spot, featured in newsletter
- Medium rewards: Gift cards, merchandise with company logo
- Premium rewards: Paid time off, conference attendance"

### Sub-View 4: LEADERBOARD
"**Leaderboard** shows who's winning in the gamification system.

**Display shows:**
- **Ranking** - Position (1st, 2nd, 3rd, etc.)
- **Employee Name** - Their name
- **Department** - Where they work
- **Total XP** - Cumulative lifetime XP earned
- **Badges Earned** - Number of badges unlocked
- **Challenges Completed** - How many challenges they've finished
- **Current Tier** - 'Bronze', 'Silver', 'Gold', 'Platinum'
- **Trending** - Up/down arrow if they moved positions

**Filter/Sort Options:**
- Filter by 'All Time' vs 'This Month' vs 'This Quarter'
- Sort by XP, Badges, Challenges, or Tier
- Filter by Department

**Real-time Updates:**
The leaderboard refreshes in real-time. When someone completes a challenge and earns 100 XP, their position updates instantly.

**Recognition Element:**
The top 3 earn a special badge for the month:
- 🥇 'Top Performer' for #1
- 🥈 'Rising Star' for #2
- 🥉 'Solid Contributor' for #3

These appear on their profile and are highlighted in the company newsletter as positive reinforcement."

---

## SECTION 6: REPORTS MODULE (14:30 - 15:15)

**[Screen navigates to Reports > ESG Summary]**

"The **Reports section** generates exportable data for leadership and stakeholders."

### Sub-View 1: ESG SUMMARY
"**ESG Summary** produces pre-built reports on your ESG performance.

**Report Contains:**
- **Executive Summary** - One-page overview of key metrics
- **ESG Scores** - Environmental, Social, Governance ratings over time
- **Performance Trends** - Charts showing improvement/decline
- **Scorecard Comparison** - Year-over-year (2023 vs 2024)
- **Department Rankings** - Which departments performed best
- **Carbon Footprint Breakdown** - By source (energy, travel, waste)
- **Policies & Compliance** - Acknowledgement rates
- **CSR Impact** - Volunteering hours, cost equivalents
- **Employee Engagement** - Participation in gamification
- **Key Achievements** - Milestones hit this period
- **Recommendations** - AI-generated suggestions for improvement

**Export Options:**
- Download as PDF (formatted for printing/sharing)
- Download as Excel (data tables, ready for analysis)
- Email to stakeholders (with recipient list)
- Schedule recurring reports (monthly, quarterly)

**Time Period Selection:**
- Date range picker (Start Date, End Date)
- Preset options: 'Last Month', 'Last Quarter', 'Year-to-Date', 'Last Year', 'Custom'
- Generate button

**Use Case:** ESG Summary reports are sent to:
- Board of Directors (quarterly)
- External auditors (annually)
- Investor relations (for sustainability reporting standards like GRI, SASB, TCFD)
- Employees (annual 'State of Sustainability')"

### Sub-View 2: CUSTOM REPORT BUILDER
"**Custom Report Builder** lets you create your own reports by selecting specific data.

**Report Builder Interface:**

**Step 1: Choose Report Type**
- Report name (text field)
- Options: 'Scorecard', 'Trend Analysis', 'Comparison', 'Audit Trail'

**Step 2: Select Data**
- Checkboxes for which metrics to include:
  - Environmental (Emissions, Goals, Products)
  - Social (CSR Hours, Participation, Diversity)
  - Governance (Policies, Audits, Compliance)
  - Gamification (XP, Badges, Challenges)
  - Employee Engagement
  - Financial Impact

**Step 3: Choose Filters**
- Department (multi-select or 'All')
- Employee Role (filter by who created data)
- Date Range
- Status (Approved/Pending)

**Step 4: Select Visualizations**
- Charts: Pie, Bar, Line, Trend
- Tables: Raw data export
- Heatmaps: Department performance matrix
- Trends: Year-over-year change

**Step 5: Formatting**
- Report Title
- Include company logo (checkbox)
- Color scheme
- Header/Footer text
- Recipient list for emailing

**Generate and Export:**
- Click 'Generate Report'
- System builds the report (may take a few seconds for large datasets)
- Download PDF or Excel
- Or schedule automatic delivery (daily/weekly/monthly)

**Example Custom Report:**
HR Manager creates a report for hiring compliance:
- Report name: 'Q3 Diversity Progress'
- Data: Only 'Diversity Metrics'
- Filter: All Departments, Q3 only
- Visualizations: Pie charts by gender/ethnicity, trend line for retention
- Export as PDF with company logo
- Share with D&I committee"

---

## SECTION 7: SETTINGS MODULE (15:15 - 15:50)

**[Screen navigates to Settings > Departments]**

"The **Settings section** is for administrators to configure the platform."

### Sub-View 1: DEPARTMENTS
"**Departments** lets you organize your company's structure.

**Table shows:**
- **Department Name** - Official name (e.g., 'Engineering', 'Finance', 'Sustainability')
- **Department Lead** - Manager's name
- **Employee Count** - How many work there
- **Location** - Physical office or 'Remote'
- **Budget Allocated** - CSR/sustainability budget for this department
- **Carbon Target** - Department-specific emissions goal
- **Status** - 'Active' or 'Inactive'

**Action Buttons:**
- **View** - See department profile
- **Edit** - Change details
- **Delete** - Remove (if no employees)
- **View Members** - List of employees in department

**Add Department button:**
- Form fields:
  - Department Name
  - Department Lead (employee dropdown)
  - Location (text)
  - Budget (currency)
  - Carbon Target (numeric)
  - Description
  - Submit button

**Hierarchy Setup:**
- You can set up sub-departments (e.g., Engineering > Frontend, Backend, DevOps)
- Each tracks its own metrics and emissions independently
- Roll-up reporting shows consolidated company totals"

### Sub-View 2: CATEGORIES
"**Categories** organize emission activities and CSR programs into logical groups.

**Table displays two sections:**

**Emission Categories:**
- **Category Name** - (e.g., 'Transportation', 'Energy', 'Waste')
- **Description** - What falls under it
- **Active?** - Yes/No

**Activity Categories:**
- **Category Name** - (e.g., 'Volunteering', 'Fundraising', 'Environmental')
- **Description** - What falls under it
- **Active?** - Yes/No

**Add Category buttons:**
- Emission Category form:
  - Category Name
  - Description
  - Submit button
- Activity Category form:
  - Category Name
  - Description
  - Submit button

**Usage:**
When you create an emission factor or CSR activity, you choose a category from these lists. This organizes your data for filtering and reporting."

### Sub-View 3: ESG CONFIGURATION
"**ESG Configuration** is the nerve center for system-wide settings.

**Settings Panels:**

**1. Scoring Configuration**
- Environmental Score Weight (0-100%, default 33%)
- Social Score Weight (0-100%, default 33%)
- Governance Score Weight (0-100%, default 34%)
- Note: Weights must total 100%
- [Save button]

When weights are adjusted, overall ESG Index scores recalculate automatically.

**2. Gamification Settings**
- Enable/Disable Gamification (toggle)
- XP per CSR Hour (number, default 10)
- Badge Auto-Award? (toggle on/off)
- Leaderboard Visibility (Everyone/Department Only/Hidden)
- Points Conversion Rate (e.g., 1 XP = 0.5 Points)
- [Save button]

**3. Notification Preferences**
- Send email on policy publication? (toggle)
- Send reminder for pending policies? (toggle) + days before deadline
- Notify on CSR participation approval? (toggle)
- Notify on badge unlock? (toggle)
- Digest frequency: Immediate/Daily/Weekly
- [Save button]

**4. Data Retention**
- Archive completed challenges after X days (dropdown)
- Archive old policies after X years (dropdown)
- Archive CSR records after X years (dropdown)
- [Save button]

**5. Integration Settings** (if applicable)
- Connected to ERP system? (toggle) + API key field
- Connected to HRIS? (toggle) + API credentials
- Data sync frequency: Real-time/Daily/Manual
- [Save button]

**6. Audit Logging**
- Enable audit trail? (toggle, usually always on)
- Log details level: Minimal/Detailed/Maximum
- Retention: 1 year/3 years/7 years
- Export audit logs (button)
- [Save button]

**7. Custom Branding**
- Company logo upload
- Primary color (color picker)
- Secondary color (color picker)
- Theme: Light/Dark
- [Save button]

**8. Access Control Rules**
- Role-based permissions table:
  - Role name | Dashboard | Environmental | Social | Governance | Gamification | Reports | Settings | Read/Write
  - Each cell has a checkbox or permission level dropdown
- [Save button]"

---

## GLOBAL FEATURES (15:50 - 16:20)

**[Screen shows various elements]**

"Across the entire application, there are some global features that work everywhere."

### NOTIFICATIONS SYSTEM
"At the top right of every page, there's a **Notification Bell icon** with a badge count.

**Click the bell to open the Notifications Slideout panel:**

The panel shows a list of notifications, newest first, with:
- Icon indicating notification type (green checkmark for approval, red X for rejection, etc.)
- Title: 'Your CSR participation was approved'
- Time: '2 hours ago'
- [Mark as read] button
- [Delete] button

**Common notifications:**
- 'New policy published: You have 7 days to acknowledge'
- 'Your CSR application was approved! +50 XP awarded!'
- 'Badge unlocked: Carbon Warrior! 🏅'
- 'Challenge invite: Join the Zero Waste Week challenge'
- 'Reminder: Compliance audit scheduled for Oct 15'
- 'Your manager left feedback on your diversity report'

**Mark as Read:**
Clicking a notification can mark it read (it fades from bold to normal). The badge count decreases.

**Delete:**
Removes notification from your list.

**Clear All:**
A button at the bottom of the slideout clears all notifications at once (with a confirmation)."

### AUTHENTICATION & LOGOUT
"The **Auth Session Pill** in the top right shows your current role and a **Log Out button**.

**Log Out Flow:**
1. Click 'Log Out'
2. System confirms: 'Are you sure you want to log out?'
3. Click 'Yes'
4. Session is destroyed (Supabase auth cleared)
5. Application returns to the Welcome Page
6. Browser returns to login form

**Security:** After logout, the back button won't re-enter the app—the session is truly ended."

### USER ROLE DISPLAY & PERMISSIONS
"Your role determines what you see. Examples:

**Administrator sees:**
- All 7 modules: Dashboard, Environmental, Social, Governance, Gamification, Reports, Settings
- All data across all departments
- Full CRUD (Create, Read, Update, Delete) permissions
- Can approve/reject any transaction
- Can modify system settings
- Full audit log access

**ESG Manager sees:**
- Dashboard, Environmental, Reports, Settings
- Cannot see Social (CSR/HR stuff) or Governance (Compliance policies)
- Can create/edit emission factors and products
- Can approve carbon transactions
- Can create environmental goals
- Read-only access to Settings

**HR Manager sees:**
- Dashboard, Social, Reports, Settings
- Can create CSR activities
- Can approve/reject participation
- Can send policy reminders
- Cannot modify compliance policies

**Employee sees:**
- Dashboard, Social, Gamification, Settings
- Can see overall scores and trends
- Can join CSR activities
- Can join challenges
- Can view badges and rewards
- Cannot create/edit anything
- Cannot see Compliance or Environmental modules

**If an unauthorized role tries to access a restricted area, they see:**
'Access Denied. This module is restricted to [Required Roles]. Contact your administrator if you believe this is an error.'"

### XP / POINTS DISPLAY (For Employees)
"Employees see an **XP/Points badge** in the top right:

'⚡ 340 XP  🪙 220 Points'

This shows their accumulated XP and their point balance for redemption. It updates in real-time when:
- They complete a CSR activity (manager approves)
- They win a challenge (manager approves)
- They unlock a new badge
- They redeem a reward (points decrease)

Clicking it opens their personal **Profile & Progress page** showing:
- Lifetime XP earned
- Badges earned (visual grid with tooltips)
- Challenges participated in (sorted by completion date)
- CSR activities joined (with hours contributed)
- Current tier/rank (e.g., 'Gold - 5,000+ XP')
- Points balance and redemption history"

---

## CONCLUSION / OUTRO (16:20 - 16:30)

**[Host speaking directly to camera]**

"And that's a complete walkthrough of **EcoSphere**! You've seen:

✅ How to log in securely with role-based access
✅ The Dashboard overview with real-time ESG scores
✅ How to track carbon emissions and set environmental goals
✅ How to run CSR programs and measure employee engagement
✅ How to manage policies and compliance issues
✅ How to gamify sustainability with challenges, badges, and rewards
✅ How to generate ESG reports for stakeholders
✅ How administrators configure the entire system

**EcoSphere brings together all aspects of ESG management in one unified platform**, eliminating silos and making sustainability management easy, engaging, and transparent.

Whether you're an Administrator managing the whole system, an ESG Manager tracking carbon, an HR Manager running CSR programs, a Compliance Officer enforcing policies, or an Employee participating in sustainability initiatives—everyone has a role to play.

If you have questions or want to set up EcoSphere for your organization, feel free to reach out. Thanks for watching!"

---

## END OF SCRIPT

---

# SCRIPT SUMMARY BY PAGE/BUTTON

| Page | Key Buttons/Elements | What It Does |
|------|----------------------|-------------|
| **Welcome** | "Go to Login" | Navigate to auth page |
| | "Explore Features" | Smooth scroll to feature grid |
| **Login** | "Log In" | Authenticate with email/password |
| | "Sign Up" | Create new employee account |
| | "Forgot Password" | Request password reset |
| | "Change Password" | Update existing password |
| **Dashboard** | Score Cards | Display E/S/G scores |
| | Carbon Trend Chart | Show emissions over time |
| | Department Performance | Compare departments |
| | Policy Compliance | Acknowledgement rates |
| | Recent Activity Feed | Activity timeline |
| **Environmental** | Add Emission Factor | Create carbon multiplier |
| | Edit/Delete Factors | Manage factors |
| | Add Product | Define product sustainability |
| | Log Transaction | Record carbon activity |
| | Approve Transaction | Verify and approve emissions |
| | Set Environmental Goals | Create reduction targets |
| | Update Progress | Track goal advancement |
| **Social** | Add CSR Activity | Create volunteer program |
| | Join Activity | Employee signup |
| | Approve Participation | Manager confirms + awards XP |
| | Diversity Dashboard | View demographic data |
| **Governance** | Publish Policy | Make policy official |
| | Acknowledge Policy | Employee signs off |
| | Schedule Audit | Create compliance audit |
| | Log Compliance Issue | Track problems |
| | Resolve Issue | Mark as fixed |
| **Gamification** | Create Challenge | Start competition |
| | Join Challenge | Employee participates |
| | Complete Challenge | Submit with evidence |
| | Approve Completion | Manager awards XP |
| | Add Badge | Define achievement |
| | Add Reward | Create redeemable prize |
| | Redeem Reward | Employee claims reward |
| | View Leaderboard | See rankings |
| **Reports** | Generate ESG Summary | Create pre-built report |
| | Export PDF/Excel | Download report |
| | Custom Report Builder | Create custom report |
| **Settings** | Add Department | Create org unit |
| | Add Category | Create classification |
| | Configure ESG Weights | Adjust scoring |
| | Set Gamification Rules | Configure XP system |
| **Global** | Notification Bell | View notifications |
| | Log Out | End session |
| | View Profile | See XP/Badges |

This comprehensive script covers every page, button, and feature in EcoSphere with detailed explanations of how each one works and what happens when users interact with them. You can use this for creating video narration, presentations, or training materials!
