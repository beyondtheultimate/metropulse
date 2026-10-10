# MetroPulse 🚇
> **Every Voice Matters. Every Journey Matters.**
> **Problem Statement PS-07: "Every Complaint Heard"**

MetroPulse is an offline-first, client-side Metro Passenger Complaint Intelligence & Management System built with **HTML5, CSS3, and vanilla JavaScript**. It runs with zero external dependencies, zero CDNs, and zero backend services, making it ideally suited for deployment on **GitHub Pages** or **Vercel**.

---

## 🚀 Key Highlights & Features

1. **100% Offline & Air-Gapped Resilient:**
   - Pure static web application (HTML, CSS, JS).
   - Once loaded, requires 0% internet connection.
   - Preserves complaints locally across browser restarts and page refreshes using `localStorage`.

2. **Deterministic Safety-First Triage Engine:**
   - Dual-factor analysis prioritizing passenger life-safety keywords above user categorization.
   - Detects serious emergencies (unconscious passengers, fatalities, fires, smoke, people on tracks, active weapons) and escalates them to **Critical / High** priority with prominent emergency dispatch guidance.
   - Negation-aware regex engine: correctly distinguishes *"No fire or smoke observed; the bin is dirty"* from active fires, avoiding false emergency alarms.

3. **High-Contrast Modern Transit Theme:**
   - Dark midnight navy surfaces (`#070d1e`, `#0e1a36`) with electric cyan (`#00e5ff`) and teal accents.
   - High-contrast text throughout: all dropdowns, form inputs, placeholders, and buttons are readable in all states.
   - Real, functional **hamburger menu (☰)** with mobile drawer and desktop collapse toggle.

4. **Transit Operations Dashboard & Management:**
   - Real-time KPI metrics (Total, Active, Critical & High, Resolution Ratio).
   - Unresolved High-Priority banner alerting on-duty staff to open critical safety issues.
   - Category and Priority bar charts rendered with lightweight CSS tracks.
   - Rapid status dispatcher allowing station staff to cycle incidents through **Open**, **In Progress**, and **Resolved**.
   - One-click **CSV export** for shift handover reports.

---

## 📁 Project Structure

```text
MetroHacks/
├── index.html        # Clean semantic HTML5 dashboard & forms
├── style.css         # Custom responsive design system & dark theme (no CDN fonts/libraries)
├── script.js         # Pure vanilla JS: triage engine, UI controller, localStorage, CSV
├── vercel.json       # Static deployment configuration for Vercel
└── README.md         # Documentation & deployment instructions
```

---

## 🧪 Local Testing & Verification

Because MetroPulse uses standard browser APIs (`localStorage`), you can test it locally using any lightweight development server or simply opening `index.html`.

### Option 1: Using Python's built-in HTTP server
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your web browser.

### Option 2: Using Node / npx (Optional)
```bash
npx serve .
```

---

## ☁️ Deployment Instructions

### Deploy to Vercel (Instant 1-Click CLI or Git)

#### Via GitHub & Vercel Dashboard (Recommended):
1. Create a repository on GitHub (e.g. `metropulse`).
2. Push this folder to your repository:
   ```bash
   git init
   git add index.html style.css script.js vercel.json README.md
   git commit -m "Initial MetroPulse Static Release"
   git branch -M main
   git remote add origin https://github.com/<your-username>/metropulse.git
   git push -u origin main
   ```
3. Go to [vercel.com/new](https://vercel.com/new).
4. Select your `metropulse` repository and click **Deploy**. Vercel will automatically detect `vercel.json` and deploy it as a high-performance static website.

#### Via Vercel CLI (Optional):
```bash
vercel --prod
```

### Deploy to GitHub Pages (Alternative):
1. In your GitHub repository, navigate to **Settings** → **Pages**.
2. Under **Build and deployment**, select `Deploy from a branch`.
3. Choose `main` branch and root `/` folder, then click **Save**.
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

---

## 🛡️ Responsible Transit AI Ethics & Boundaries

- **Decision-Support Only:** Triage suggestions, priority tags, and suggested actions are automated aids. Final emergency dispatch decisions remain with on-duty station supervisors and emergency responders.
- **Privacy by Default:** Commuters may log complaints anonymously. No personal phone numbers or identification credentials are mandatory.
- **Client-Side Storage Isolation:** All stored complaint data resides strictly within the user's browser sandbox (`localStorage`). Complaints are not transmitted across the internet without manual CSV export.
