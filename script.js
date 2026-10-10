/**
 * MetroPulse - Offline-First Metro Passenger Complaint Intelligence & Management System
 * Pure Vanilla JavaScript Client-Side Engine (Zero Cloud / Zero Dependencies)
 * Problem Statement: PS-07
 */

// -----------------------------------------------------------------------------
// DEFAULT BENCHMARK & DEMO DATASET
// -----------------------------------------------------------------------------
const STORAGE_KEY = 'metropulse_complaints_db';

const INITIAL_SAMPLE_COMPLAINTS = [
  {
    id: "MP-SMP-1001",
    timestamp: "2026-10-10 08:35:12",
    station: "Central Junction",
    platform_direction: "Platform 2 (Northbound)",
    contact_id: "MET-8472",
    raw_text: "Severe water leakage near the escalator at Platform 2. Slippery floor with high slip-and-fall risk.",
    category: "Safety",
    priority: "High",
    status: "In Progress",
    summary: "Water hazard & slip risk near Platform 2 escalator",
    action_taken: "Immediate hazard signage placed; janitorial & facility crew notified",
    source: "Sample",
    ai_engine: "Safety-First Engine v2.0",
    is_emergency: false,
    flag_reason: "Hazard Detected (slip, leak, slippery)"
  },
  {
    id: "MP-SMP-1002",
    timestamp: "2026-10-10 09:15:40",
    station: "Tech City Interchange",
    platform_direction: "Concourse Level - Gate 4",
    contact_id: "",
    raw_text: "Wheelchair elevator from concourse to platform has been out of service. A disabled passenger is stuck waiting.",
    category: "Accessibility",
    priority: "High",
    status: "Open",
    summary: "Wheelchair elevator breakdown blocking mobility access",
    action_taken: "Dispatched station customer assistance officer to assist passenger",
    source: "Sample",
    ai_engine: "Safety-First Engine v2.0",
    is_emergency: false,
    flag_reason: "Mobility Barrier (wheelchair, disabled, elevator, stuck)"
  },
  {
    id: "MP-SMP-1003",
    timestamp: "2026-10-10 11:20:05",
    station: "MG Promenade",
    platform_direction: "Platform 1 (Southbound)",
    contact_id: "PASS-9102",
    raw_text: "Blue Line train delayed over 18 minutes with no audio announcements or display updates on display boards.",
    category: "Delay",
    priority: "Medium",
    status: "Resolved",
    summary: "18-min unscheduled train delay with missing visual & audio announcements",
    action_taken: "Signaling log checked; PA announcement triggered across line",
    source: "Sample",
    ai_engine: "Safety-First Engine v2.0",
    is_emergency: false,
    flag_reason: "Service Schedule Variance (delay, announcements)"
  },
  {
    id: "MP-SMP-1004",
    timestamp: "2026-10-10 14:05:22",
    station: "Terminal 1 Hub",
    platform_direction: "Ticketing Hall East",
    contact_id: "",
    raw_text: "Smart card tap rejected at AFC gates despite balance being deducted. Long queue building up behind Gate 3.",
    category: "Ticketing",
    priority: "Medium",
    status: "Open",
    summary: "AFC gate card validation failure causing queue congestion",
    action_taken: "Shifted queue to auxiliary gates; automated refund ticket logged",
    source: "Sample",
    ai_engine: "Safety-First Engine v2.0",
    is_emergency: false,
    flag_reason: "Fare Collection / Gate Reader Malfunction (card, gate)"
  },
  {
    id: "MP-SMP-1005",
    timestamp: "2026-10-10 16:42:18",
    station: "Heritage Square",
    platform_direction: "North Exit Stairs",
    contact_id: "COMMUTER-33",
    raw_text: "Spilled drinks and paper cups all over seating area and bench on platform.",
    category: "Cleanliness",
    priority: "Low",
    status: "Resolved",
    summary: "Litter and beverage spills on passenger seating benches",
    action_taken: "Scheduled for routine turn cleaning squad",
    source: "Sample",
    ai_engine: "Safety-First Engine v2.0",
    is_emergency: false,
    flag_reason: "Station Environment Cleanliness Request"
  }
];

// -----------------------------------------------------------------------------
// LOCAL STORAGE PERSISTENCE LAYER
// -----------------------------------------------------------------------------
function getComplaints() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_COMPLAINTS));
      return [...INITIAL_SAMPLE_COMPLAINTS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...INITIAL_SAMPLE_COMPLAINTS];
  } catch (err) {
    console.error("Error reading localStorage:", err);
    return [...INITIAL_SAMPLE_COMPLAINTS];
  }
}

function saveComplaints(complaints) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
    return true;
  } catch (err) {
    console.error("Error writing localStorage:", err);
    alert("Unable to save complaint locally: Storage quota exceeded or disabled.");
    return false;
  }
}

function addComplaint(record) {
  const current = getComplaints();
  current.unshift(record);
  saveComplaints(current);
}

function updateComplaintStatus(id, newStatus) {
  const current = getComplaints();
  let found = false;
  for (const item of current) {
    if (item.id === id) {
      item.status = newStatus;
      found = true;
      break;
    }
  }
  if (found) {
    saveComplaints(current);
  }
  return found;
}

function clearSamplesOnly() {
  const current = getComplaints();
  const retained = current.filter(c => c.source !== 'Sample');
  saveComplaints(retained);
}

function restoreSamples() {
  const current = getComplaints();
  const existingIds = new Set(current.map(c => c.id));
  for (const s of INITIAL_SAMPLE_COMPLAINTS) {
    if (!existingIds.has(s.id)) {
      current.push(s);
    }
  }
  saveComplaints(current);
}

// -----------------------------------------------------------------------------
// SAFETY-FIRST DETERMINISTIC TRIAGE ENGINE (PORTED FROM PYTHON)
// -----------------------------------------------------------------------------
function isNegated(text, keyword) {
  const regex = new RegExp(`(?:no|not|neither|nor|without|never|zero)\\s+(?:[\\w\\s]{0,25})?\\b${keyword}\\b`, 'i');
  return regex.test(text);
}

function analyzeComplaintOffline(text, userCategory) {
  const lower = text.toLowerCase();

  // 1. LIFE-THREATENING & EMERGENCY KEYWORDS (CRITICAL PRIORITY)
  const criticalGroups = [
    {
      label: "fatality / death",
      keywords: ["dead", "death", "died", "fatal", "fatality", "passed away", "body lying", "killed"]
    },
    {
      label: "unconscious / medical collapse",
      keywords: [
        "unconscious", "unconsious", "unconcious", "inconscious",
        "passed out", "pass out", "passing out", "blacked out", "black out",
        "collapsed", "collapsing", "collapse",
        "not responding", "unresponsive", "non-responsive", "nonresponsive",
        "fainted", "fainting", "faint",
        "severe bleeding", "bleeding heavily", "loss of blood", "lost blood", "pool of blood",
        "serious injury", "severe injury", "critically injured", "badly injured", "head injury",
        "heart attack", "cardiac arrest", "cardiac", "stroke", "seizure", "convulsion", "not breathing", "cannot breathe"
      ]
    },
    {
      label: "fire / explosion / electrical hazard",
      keywords: [
        "fire", "smoke", "explosion", "flame", "flames", "blast", "blaze", "burning", 
        "sparking electrical", "electrical fire", "arcing", "short circuit fire"
      ]
    },
    {
      label: "person on tracks / trapped",
      keywords: [
        "on the track", "on the tracks", "on the rails", "on the rail", "fell on track", "jumped on track", 
        "trapped between", "trapped in door", "stuck in track", "dragged by train", "hit by train"
      ]
    },
    {
      label: "active violence / weapon",
      keywords: [
        "knife", "stabbing", "stabbed", "gun", "gunshot", "shooting", "weapon", "armed", 
        "assault in progress", "active assault", "physical fight", "severe beating", "bomb", "terror", "hostage"
      ]
    }
  ];

  let detectedEmergency = null;
  for (const group of criticalGroups) {
    for (const kw of group.keywords) {
      if (lower.includes(kw)) {
        if (!isNegated(lower, kw)) {
          detectedEmergency = { label: group.label, kw: kw };
          break;
        }
      }
    }
    if (detectedEmergency) break;
  }

  // If life-safety incident detected: override user category
  if (detectedEmergency) {
    return {
      category: "Safety",
      priority: "Critical",
      is_emergency: true,
      flag_reason: `Life-Safety Alert: Description contains potential threat to life (${detectedEmergency.label}: '${detectedEmergency.kw}'). Prioritized above selected category.`,
      action: "IMMEDIATE EMERGENCY PROTOCOL: Alert on-duty Station Master, Operations Control (OCC), and dispatch immediate first responders / emergency medical crew.",
      summary: `URGENT LIFE-SAFETY INCIDENT (${detectedEmergency.label}): ${text.slice(0, 80)}...`,
      engine: "Safety-First Engine v2.0 (Deterministic)"
    };
  }

  // 2. ACCESSIBILITY & MOBILITY IMPAIRMENT
  const accessKeywords = ["wheelchair", "disabled", "elevator", "lift", "ramp", "blind", "crutch", "mobility", "handicap", "stuck"];
  const matchedAccess = accessKeywords.filter(kw => lower.includes(kw) && !isNegated(lower, kw));

  // 3. SAFETY HAZARDS (SLIP, SPILL, EXPOSED WIRES, THEFT)
  const hazardKeywords = ["slip", "leak", "slippery", "hazard", "exposed wire", "broken glass", "spill near escalator", "harassment", "eve teasing", "theft", "pickpocket"];
  const matchedHazards = hazardKeywords.filter(kw => lower.includes(kw) && !isNegated(lower, kw));

  // 4. DELAY & CROWDING
  const delayKeywords = ["delay", "late", "cancelled", "stuck train", "stopped in tunnel", "frequency", "signal failure", "headway"];
  const crowdKeywords = ["stampede", "crush", "overcrowded", "platform full", "cannot board", "pushing", "choke point"];
  const matchedDelay = delayKeywords.filter(kw => lower.includes(kw) && !isNegated(lower, kw));
  const matchedCrowd = crowdKeywords.filter(kw => lower.includes(kw) && !isNegated(lower, kw));

  // 5. TICKETING & CLEANLINESS
  const ticketKeywords = ["card", "token", "afc", "turnstile", "recharge", "fare", "kiosk", "deducted", "refund", "gate"];
  const cleanKeywords = ["dirty", "trash", "garbage", "spill", "smell", "odor", "stain", "toilet", "washroom", "urine", "vomit", "pest"];
  const matchedTicket = ticketKeywords.filter(kw => lower.includes(kw) && !isNegated(lower, kw));
  const matchedClean = cleanKeywords.filter(kw => lower.includes(kw) && !isNegated(lower, kw));

  let inferredCategory = userCategory;
  let priority = "Low";
  let flagReason = "General passenger feedback requiring standard supervisory review";
  let action = "Logged for standard supervisory shift audit and customer relations follow-up.";

  if (matchedHazards.length > 0 || userCategory === "Safety") {
    inferredCategory = "Safety";
    priority = "High";
    flagReason = `Safety hazard flagged (${matchedHazards.length ? matchedHazards.join(', ') : 'Category: Safety'})`;
    action = "Dispatch Station Safety Steward & Security staff to isolate hazard immediately.";
  } else if (matchedAccess.length > 0 || (lower.includes("elevator") && lower.includes("stuck")) || (userCategory === "Accessibility" && (lower.includes("stuck") || lower.includes("elevator")))) {
    inferredCategory = "Accessibility";
    priority = "High";
    flagReason = `Critical mobility barrier flagged (${matchedAccess.length ? matchedAccess.join(', ') : 'Category: Accessibility'})`;
    action = "Dispatch Station Customer Assistance Staff immediately to assist commuter and report elevator outage.";
  } else if (matchedCrowd.length > 0 || (userCategory === "Overcrowding" && (lower.includes("stampede") || lower.includes("crush")))) {
    inferredCategory = "Overcrowding";
    priority = (lower.includes("stampede") || lower.includes("crush")) ? "High" : "Medium";
    flagReason = `Crowd surge / density concern (${matchedCrowd.length ? matchedCrowd.join(', ') : 'Category: Overcrowding'})`;
    action = "Alert platform marshals to regulate entrance turnstiles and concourse passenger flow.";
  } else if (matchedDelay.length > 0 || userCategory === "Delay") {
    inferredCategory = "Delay";
    const isSevereDelay = ["30 min", "20 min", "stopped in tunnel", "stranded"].some(w => lower.includes(w));
    priority = isSevereDelay ? "High" : "Medium";
    flagReason = `Service schedule variance (${isSevereDelay ? 'Major line interruption' : 'Standard train delay'})`;
    action = "Cross-reference Line Operations Signaling log and broadcast passenger visual/audio announcements.";
  } else if (matchedTicket.length > 0 || userCategory === "Ticketing") {
    inferredCategory = "Ticketing";
    priority = "Medium";
    flagReason = "Fare collection or AFC gate transaction failure";
    action = "Notify Station AFC Technician; verify reader transaction log and issue manual token if required.";
  } else if (matchedClean.length > 0 || userCategory === "Cleanliness") {
    inferredCategory = "Cleanliness";
    const isBio = ["stairs", "escalator", "vomit", "blood", "urine"].some(w => lower.includes(w));
    priority = isBio ? "Medium" : "Low";
    flagReason = "Station environment cleanliness request";
    action = "Dispatch on-duty janitorial squad with sanitation equipment.";
  }

  // Summary extraction
  const clauses = text.replace(/\n/g, '. ').split('.').map(s => s.trim()).filter(s => s.length > 5);
  const summary = clauses.length > 0 ? (clauses[0].slice(0, 90) + (clauses[0].length > 90 ? '...' : '')) : (text.slice(0, 75) + '...');

  return {
    category: inferredCategory,
    priority: priority,
    is_emergency: false,
    flag_reason: flagReason,
    action: action,
    summary: summary,
    engine: "Safety-First Engine v2.0 (Deterministic)"
  };
}

// -----------------------------------------------------------------------------
// UI RENDERING & CONTROLLER LOGIC
// -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Navigation elements
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.view-section');
  const sidebar = document.getElementById('mp-sidebar');
  const menuToggle = document.getElementById('menu-toggle');
  const sidebarClose = document.getElementById('sidebar-close');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  // 1. Navigation Switcher
  function switchView(targetViewId) {
    navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.view === targetViewId);
    });
    sections.forEach(sec => {
      sec.classList.toggle('active', sec.id === `view-${targetViewId}`);
    });

    // Close mobile drawer if open
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');

    // Trigger render for the active view
    if (targetViewId === 'overview') {
      renderOverview();
    } else if (targetViewId === 'records') {
      renderRecords();
    }
  }

  navItems.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // 2. Real Functional Hamburger Menu
  menuToggle.addEventListener('click', () => {
    if (window.innerWidth <= 900) {
      sidebar.classList.toggle('open');
      sidebarOverlay.classList.toggle('active');
    } else {
      document.body.classList.toggle('sidebar-collapsed');
    }
  });

  if (sidebarClose) {
    sidebarClose.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });
  }

  // 3. Demo Controls
  document.getElementById('btn-clear-samples').addEventListener('click', () => {
    if (confirm("Clear sample benchmark complaints? Any submitted complaints will be preserved.")) {
      clearSamplesOnly();
      renderOverview();
      renderRecords();
    }
  });

  document.getElementById('btn-restore-samples').addEventListener('click', () => {
    restoreSamples();
    renderOverview();
    renderRecords();
  });

  // 4. OVERVIEW DASHBOARD RENDERER
  function renderOverview() {
    const list = getComplaints();
    const total = list.length;
    const openCount = list.filter(c => c.status === 'Open').length;
    const inProgCount = list.filter(c => c.status === 'In Progress').length;
    const activeCount = openCount + inProgCount;
    const critOrHighCount = list.filter(c => c.priority === 'Critical' || c.priority === 'High').length;
    const resolvedCount = list.filter(c => c.status === 'Resolved').length;
    const liveCount = list.filter(c => c.source === 'Live').length;

    // Update KPI Cards
    document.getElementById('kpi-total').textContent = total;
    document.getElementById('kpi-sub-total').textContent = `${liveCount} Live • ${total - liveCount} Samples`;
    document.getElementById('kpi-active').textContent = activeCount;
    document.getElementById('kpi-sub-active').textContent = `${openCount} Open • ${inProgCount} In Progress`;
    document.getElementById('kpi-high').textContent = critOrHighCount;
    document.getElementById('kpi-resolved').textContent = total > 0 ? `${Math.round((resolvedCount / total) * 100)}%` : '0%';
    document.getElementById('kpi-sub-resolved').textContent = `${resolvedCount} closed`;

    // Render Unresolved Critical/High Alert Banner
    const urgentAlertsContainer = document.getElementById('urgent-alerts-container');
    const unresolvedUrgent = list.filter(c => (c.priority === 'Critical' || c.priority === 'High') && c.status !== 'Resolved');

    if (unresolvedUrgent.length > 0) {
      urgentAlertsContainer.innerHTML = `
        <div class="emergency-banner">
          <div class="emergency-header">
            <span>⚠️ Unresolved High-Priority Incidents Requiring Staff Dispatch (${unresolvedUrgent.length})</span>
          </div>
          <div class="emergency-text">
            The following incidents involve active safety threats or mobility barriers. Dispatch on-duty staff immediately.
          </div>
          <div class="emergency-list">
            ${unresolvedUrgent.map(item => `
              <div class="emergency-row">
                <div>
                  <strong style="color:#00e5ff; font-family:monospace;">${item.id}</strong> • 
                  <span class="${item.priority === 'Critical' ? 'badge-critical' : 'badge-high'}">${item.priority}</span> • 
                  <strong style="color:#ffffff;">${item.station}</strong> 
                  <span style="color:#94a3b8; font-size:0.8rem;">(${item.timestamp})</span>
                  <div style="color:#f1f5f9; margin-top:2px;">${escapeHtml(item.summary)}</div>
                </div>
                <div>
                  <span class="status-pill status-${item.status.toLowerCase().replace(' ', '')}">${item.status.toUpperCase()}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      urgentAlertsContainer.innerHTML = '';
    }

    // Render Category Distribution Bars
    const catCounts = {};
    const categories = ["Cleanliness", "Ticketing", "Delay", "Overcrowding", "Accessibility", "Safety", "Other"];
    categories.forEach(c => catCounts[c] = 0);
    list.forEach(c => {
      catCounts[c.category] = (catCounts[c.category] || 0) + 1;
    });

    const maxCat = Math.max(...Object.values(catCounts), 1);
    const catBarsHtml = categories.map(cat => {
      const count = catCounts[cat] || 0;
      const pct = Math.round((count / maxCat) * 100);
      return `
        <div class="bar-row">
          <div class="bar-label-group">
            <span>${cat}</span>
            <span>${count}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill cyan" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
    document.getElementById('category-bars').innerHTML = catBarsHtml;

    // Render Priority Breakdown Bars
    const prioCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    list.forEach(c => {
      if (prioCounts[c.priority] !== undefined) {
        prioCounts[c.priority]++;
      }
    });

    const maxPrio = Math.max(...Object.values(prioCounts), 1);
    const prioConfig = [
      { key: 'Critical', color: 'red' },
      { key: 'High', color: 'red' },
      { key: 'Medium', color: 'amber' },
      { key: 'Low', color: 'green' }
    ];
    const prioBarsHtml = prioConfig.map(p => {
      const count = prioCounts[p.key] || 0;
      const pct = Math.round((count / maxPrio) * 100);
      return `
        <div class="bar-row">
          <div class="bar-label-group">
            <span>${p.key}</span>
            <span>${count}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill ${p.color}" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
    document.getElementById('priority-bars').innerHTML = prioBarsHtml;

    // Render Operational Insights
    if (total > 0) {
      const stationCounts = {};
      list.forEach(c => stationCounts[c.station] = (stationCounts[c.station] || 0) + 1);
      const topStation = Object.keys(stationCounts).reduce((a, b) => stationCounts[a] > stationCounts[b] ? a : b);

      const topCat = Object.keys(catCounts).reduce((a, b) => catCounts[a] > catCounts[b] ? a : b);
      const critPct = Math.round((critOrHighCount / total) * 100);

      document.getElementById('insight-station').textContent = topStation;
      document.getElementById('insight-station-count').textContent = `${stationCounts[topStation]} incidents logged`;
      document.getElementById('insight-cat').textContent = topCat;
      document.getElementById('insight-cat-count').textContent = `${catCounts[topCat]} incidents (${Math.round(catCounts[topCat]/total*100)}%)`;
      document.getElementById('insight-ratio').textContent = `${critPct}%`;
      document.getElementById('insight-ratio-count').textContent = `${critOrHighCount} critical or high urgency incidents`;
    } else {
      document.getElementById('insight-station').textContent = "None";
      document.getElementById('insight-station-count').textContent = "0 incidents";
      document.getElementById('insight-cat').textContent = "None";
      document.getElementById('insight-cat-count').textContent = "0 incidents";
      document.getElementById('insight-ratio').textContent = "0%";
      document.getElementById('insight-ratio-count').textContent = "0 incidents";
    }

    // Render Recent Complaints Feed (top 5)
    const recent = list.slice(0, 5);
    const recentContainer = document.getElementById('recent-complaints-list');
    if (recent.length === 0) {
      recentContainer.innerHTML = '<div style="color:#94a3b8; font-size:0.9rem;">No complaints in the system.</div>';
    } else {
      recentContainer.innerHTML = recent.map(r => `
        <div class="activity-item">
          <div>
            <div class="activity-meta">
              <span class="activity-id">${r.id}</span>
              ${r.source === 'Sample' ? '<span class="badge-sample">SAMPLE</span>' : '<span class="badge-live">LIVE</span>'}
              <span class="${r.priority === 'Critical' ? 'badge-critical' : (r.priority === 'High' ? 'badge-high' : (r.priority === 'Medium' ? 'badge-medium' : 'badge-low'))}">
                ${r.priority}
              </span>
              <span style="color:#cbd5e1; font-weight:600;">• ${r.station}</span>
              <span style="color:#64748b; font-size:0.75rem;">(${r.timestamp})</span>
            </div>
            <div class="activity-summary">${escapeHtml(r.summary)}</div>
          </div>
          <div>
            <span class="status-pill status-${r.status.toLowerCase().replace(' ', '')}">
              ${r.status}
            </span>
          </div>
        </div>
      `).join('');
    }
  }

  // 5. COMPLAINT SUBMISSION HANDLER
  const complaintForm = document.getElementById('complaint-form');
  const resultContainer = document.getElementById('submission-result-container');

  complaintForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const station = document.getElementById('input-station').value;
    const category = document.getElementById('input-category').value;
    const platform = document.getElementById('input-platform').value.trim() || 'Not Specified';
    const contact = document.getElementById('input-contact').value.trim() || 'Anonymous';
    const description = document.getElementById('input-description').value.trim();

    if (!description) {
      alert("Please provide a description of the incident.");
      return;
    }

    // Perform Deterministic Safety-First Triage
    const analysis = analyzeComplaintOffline(description, category);

    // Generate Unique ID & Timestamp
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const randHex = Math.random().toString(16).substring(2, 6).toUpperCase();
    const cid = `MP-${dateStr}-${randHex}`;
    const timestamp = now.toISOString().replace('T', ' ').slice(0, 19);

    const newRecord = {
      id: cid,
      timestamp: timestamp,
      station: station,
      platform_direction: platform,
      contact_id: contact,
      raw_text: description,
      category: analysis.category,
      priority: analysis.priority,
      status: "Open",
      summary: analysis.summary,
      action_taken: analysis.action,
      source: "Live",
      ai_engine: analysis.engine,
      is_emergency: analysis.is_emergency,
      flag_reason: analysis.flag_reason
    };

    // Store in localStorage
    addComplaint(newRecord);

    // Reset Form
    complaintForm.reset();

    // Render Triage Confirmation Screen
    resultContainer.innerHTML = `
      <div class="triage-result-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="color:#00e5ff; margin:0;">✅ Incident Logged Successfully in Local Storage</h3>
          <span class="badge-live">LIVE SUBMISSION</span>
        </div>

        ${analysis.is_emergency ? `
          <div class="emergency-banner" style="margin-bottom:14px;">
            <div class="emergency-header">🚨 LIFE-SAFETY ALERT — IMMEDIATE DISPATCH REQUIRED</div>
            <div class="emergency-text">
              <strong>Trigger Reason:</strong> ${analysis.flag_reason}<br/>
              <strong>Staff Directive:</strong> Notify on-duty Station Master & emergency services immediately. 
              <em>(Note: Stored locally; not auto-dialed to external emergency numbers).</em>
            </div>
          </div>
        ` : ''}

        <div class="triage-grid">
          <div class="triage-field">
            <span class="triage-field-label">Complaint Reference ID</span>
            <span class="triage-field-val" style="color:#00e5ff; font-family:monospace;">${cid}</span>
          </div>
          <div class="triage-field">
            <span class="triage-field-label">Assessed Category</span>
            <span class="triage-field-val">${analysis.category}</span>
          </div>
          <div class="triage-field">
            <span class="triage-field-label">Assessed Priority</span>
            <span class="triage-field-val">
              <span class="${analysis.priority === 'Critical' ? 'badge-critical' : (analysis.priority === 'High' ? 'badge-high' : (analysis.priority === 'Medium' ? 'badge-medium' : 'badge-low'))}">
                ${analysis.priority.toUpperCase()} PRIORITY
              </span>
            </span>
          </div>
          <div class="triage-field">
            <span class="triage-field-label">Station</span>
            <span class="triage-field-val">${station}</span>
          </div>
        </div>

        <div class="triage-box">
          <div class="triage-box-label">TRIAGE ASSESSMENT RATIONALE</div>
          <div class="triage-box-text">${analysis.flag_reason}</div>
        </div>

        <div class="triage-box">
          <div class="triage-box-label">INCIDENT SUMMARY</div>
          <div class="triage-box-text">${escapeHtml(analysis.summary)}</div>
        </div>

        <div class="triage-box">
          <div class="triage-box-label">RECOMMENDED DISPATCH ACTION</div>
          <div class="triage-box-text" style="color:#38bdf8; font-weight:600;">${analysis.action}</div>
        </div>

        <div class="disclaimer-banner">
          ⚠️ <strong>Responsible Operations Notice:</strong> Priority and actions are automated suggestions. This record is stored locally in your browser's localStorage and does NOT automatically transmit to metro control without manual staff dispatch.
        </div>
      </div>
    `;

    resultContainer.scrollIntoView({ behavior: 'smooth' });
  });

  // 6. RECORDS MANAGEMENT, FILTERS & CSV EXPORT
  const filterSearch = document.getElementById('filter-search');
  const filterStation = document.getElementById('filter-station');
  const filterStatus = document.getElementById('filter-status');
  const filterPriority = document.getElementById('filter-priority');
  const filterCategory = document.getElementById('filter-category');
  const selectUpdateRecord = document.getElementById('select-update-record');
  const selectNewStatus = document.getElementById('select-new-status');
  const btnApplyStatus = document.getElementById('btn-apply-status');
  const btnExportCsv = document.getElementById('btn-export-csv');

  function renderRecords() {
    const list = getComplaints();
    const query = filterSearch.value.trim().toLowerCase();
    const fStation = filterStation.value;
    const fStatus = filterStatus.value;
    const fPriority = filterPriority.value;
    const fCategory = filterCategory.value;

    const filtered = list.filter(item => {
      if (fStation !== 'ALL' && item.station !== fStation) return false;
      if (fStatus !== 'ALL' && item.status !== fStatus) return false;
      if (fPriority !== 'ALL' && item.priority !== fPriority) return false;
      if (fCategory !== 'ALL' && item.category !== fCategory) return false;

      if (query) {
        const textBlob = `${item.id} ${item.station} ${item.category} ${item.raw_text} ${item.summary} ${item.contact_id} ${item.flag_reason || ''}`.toLowerCase();
        if (!textBlob.includes(query)) return false;
      }
      return true;
    });

    document.getElementById('records-counter').textContent = `Showing ${filtered.length} of ${list.length} records`;

    // Populate Status Update Selector
    selectUpdateRecord.innerHTML = list.map(item => `
      <option value="${item.id}">
        ${item.id} - ${item.station} [${item.priority}] (${escapeHtml(item.summary.slice(0, 35))}...)
      </option>
    `).join('');

    // Populate Table
    const tbody = document.getElementById('complaints-tbody');
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:1.5rem; color:#94a3b8;">No matching records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => `
      <tr>
        <td style="font-family:monospace; font-weight:700; color:#00e5ff;">${r.id}</td>
        <td style="font-size:0.8rem; color:#94a3b8;">${r.timestamp}</td>
        <td><strong>${r.station}</strong></td>
        <td>${r.category}</td>
        <td>
          <span class="${r.priority === 'Critical' ? 'badge-critical' : (r.priority === 'High' ? 'badge-high' : (r.priority === 'Medium' ? 'badge-medium' : 'badge-low'))}">
            ${r.priority}
          </span>
        </td>
        <td>
          <span class="status-pill status-${r.status.toLowerCase().replace(' ', '')}">
            ${r.status}
          </span>
        </td>
        <td style="max-width:280px; font-size:0.85rem;">${escapeHtml(r.summary)}</td>
        <td style="max-width:220px; font-size:0.8rem; color:#cbd5e1;">${escapeHtml(r.flag_reason || 'General')}</td>
        <td>
          ${r.source === 'Sample' ? '<span class="badge-sample">SAMPLE</span>' : '<span class="badge-live">LIVE</span>'}
        </td>
      </tr>
    `).join('');
  }

  // Filter Listeners
  [filterSearch, filterStation, filterStatus, filterPriority, filterCategory].forEach(el => {
    el.addEventListener('input', renderRecords);
  });

  // Apply Status Update
  btnApplyStatus.addEventListener('click', () => {
    const id = selectUpdateRecord.value;
    const newStatus = selectNewStatus.value;
    if (!id) return;

    if (updateComplaintStatus(id, newStatus)) {
      renderRecords();
      renderOverview();
      alert(`Updated record ${id} status to ${newStatus}.`);
    }
  });

  // Export CSV
  btnExportCsv.addEventListener('click', () => {
    const list = getComplaints();
    if (list.length === 0) {
      alert("No complaints available to export.");
      return;
    }

    const headers = ["ID", "Timestamp", "Station", "Platform/Direction", "Contact ID", "Category", "Priority", "Status", "Summary", "Reason", "Action Taken", "Source"];
    const rows = list.map(c => [
      c.id,
      `"${c.timestamp}"`,
      `"${c.station}"`,
      `"${c.platform_direction || ''}"`,
      `"${c.contact_id || ''}"`,
      `"${c.category}"`,
      `"${c.priority}"`,
      `"${c.status}"`,
      `"${(c.summary || '').replace(/"/g, '""')}"`,
      `"${(c.flag_reason || '').replace(/"/g, '""')}"`,
      `"${(c.action_taken || '').replace(/"/g, '""')}"`,
      `"${c.source || 'Live'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `MetroPulse_ShiftReport_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  function escapeHtml(string) {
    if (!string) return '';
    return String(string)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial Boot
  renderOverview();
});
