/* ============================================
   CyberGuard Admin Control Center
   Hidden Admin + Visitor Tracking + Security
   ============================================ */
(function() {
  'use strict';

  const CFG = {
    hash: '148a4c21e4b4afb880c3d285484b52082a18eb0fb2b21d909d238602a89b8fd7',
    holdTime: 5000,
    maxAttempts: 5,
    lockoutMs: 60000,
    ipApi: 'https://ipapi.co/json/',
    sqlPatterns: [
      /('\s*(OR|AND)\s+[\d'=]+)/i, /UNION\s+SELECT/i, /DROP\s+TABLE/i,
      /INSERT\s+INTO/i, /DELETE\s+FROM/i, /UPDATE\s+.*SET/i,
      /;\s*(DROP|DELETE|INSERT|UPDATE)/i, /--\s*$/m, /\/\*.*\*\//,
      /xp_cmdshell/i, /EXEC(\s+|\()/i, /CHAR\(\d+\)/i,
      /CONCAT\(/i, /BENCHMARK\(/i, /SLEEP\(/i, /LOAD_FILE/i
    ],
    xssPatterns: [
      /<script[\s>]/i, /javascript:/i, /onerror\s*=/i, /onload\s*=/i,
      /eval\(/i, /document\.cookie/i, /\.innerHTML\s*=/i
    ],
    keys: {
      visitors: 'cg_visitors', blocked: 'cg_blocked',
      alerts: 'cg_alerts', session: 'cg_admin_session'
    }
  };

  let adminActive = false;
  let currentIP = null;

  // ─── Utilities ───
  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256',
      new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function store(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
  }
  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch(e) { return []; }
  }
  function genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }
  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.floor(s/60) + 'm ago';
    if (s < 86400) return Math.floor(s/3600) + 'h ago';
    return Math.floor(s/86400) + 'd ago';
  }
  function escHtml(s) {
    const d = document.createElement('div'); d.textContent = s; return d.innerHTML;
  }

  // ─── Visitor Tracking ───
  async function trackVisitor() {
    try {
      const res = await fetch(CFG.ipApi);
      if (!res.ok) return;
      const data = await res.json();
      currentIP = data.ip;

      // Check blocked
      const blocked = load(CFG.keys.blocked);
      if (blocked.find(b => b.ip === currentIP)) {
        showBlockedPage(currentIP);
        return;
      }

      const visitors = load(CFG.keys.visitors);
      visitors.push({
        id: genId(), ip: data.ip,
        city: data.city || 'Unknown', country: data.country_name || 'Unknown',
        org: data.org || '', ua: navigator.userAgent,
        time: Date.now(), page: location.pathname
      });
      // Keep last 500
      if (visitors.length > 500) visitors.splice(0, visitors.length - 500);
      store(CFG.keys.visitors, visitors);
    } catch(e) { console.log('Visitor tracking unavailable'); }
  }

  function showBlockedPage(ip) {
    const el = document.createElement('div');
    el.className = 'admin-blocked-overlay';
    el.innerHTML = `
      <div class="admin-blocked-icon"><i class="fas fa-ban"></i></div>
      <div class="admin-blocked-title">ACCESS DENIED</div>
      <div class="admin-blocked-msg">Your IP address has been blocked by the administrator due to suspicious activity.</div>
      <div class="admin-blocked-ip">IP: ${escHtml(ip)}</div>`;
    document.body.innerHTML = '';
    document.body.appendChild(el);
  }

  // ─── Security Monitoring ───
  function addAlert(type, severity, desc, ip) {
    const alerts = load(CFG.keys.alerts);
    alerts.unshift({
      id: genId(), type, severity, desc,
      ip: ip || currentIP || 'Unknown',
      time: Date.now()
    });
    if (alerts.length > 200) alerts.length = 200;
    store(CFG.keys.alerts, alerts);
    showToast(severity, desc);
  }

  function monitorInputs() {
    document.addEventListener('input', (e) => {
      if (!e.target || e.target.type === 'password') return;
      const val = e.target.value || '';
      for (const p of CFG.sqlPatterns) {
        if (p.test(val)) {
          addAlert('SQL Injection', 'critical',
            `SQL injection pattern detected: "${val.substring(0, 60)}"`);
          e.target.value = '';
          return;
        }
      }
      for (const p of CFG.xssPatterns) {
        if (p.test(val)) {
          addAlert('XSS Attack', 'critical',
            `XSS pattern detected: "${val.substring(0, 60)}"`);
          e.target.value = '';
          return;
        }
      }
    });
  }

  // Honeypot
  function setupHoneypot() {
    const hp = document.createElement('input');
    hp.type = 'text'; hp.name = 'website_url_hp';
    hp.className = 'admin-hp'; hp.tabIndex = -1;
    hp.setAttribute('autocomplete', 'off');
    document.body.appendChild(hp);
    hp.addEventListener('input', () => {
      if (hp.value) {
        addAlert('Bot Detected', 'warning', 'Honeypot field triggered — automated bot suspected');
        hp.value = '';
      }
    });
  }

  // Rapid access detection
  let pageLoadTimes = [];
  function detectRapidAccess() {
    const now = Date.now();
    pageLoadTimes.push(now);
    pageLoadTimes = pageLoadTimes.filter(t => now - t < 10000);
    if (pageLoadTimes.length > 15) {
      addAlert('Scan Detected', 'critical',
        'Rapid page access detected — possible automated scanning (Nmap/DirBuster)');
      pageLoadTimes = [];
    }
  }

  // Brute force tracking
  let loginAttempts = 0;
  let lockoutUntil = 0;

  // ─── Toast Notifications ───
  let toastContainer = null;
  function showToast(severity, text) {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'admin-toast-container';
      document.body.appendChild(toastContainer);
    }
    const icons = { critical: 'fa-skull-crossbones', warning: 'fa-triangle-exclamation', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `admin-toast ${severity}`;
    toast.innerHTML = `
      <div class="admin-toast-icon"><i class="fas ${icons[severity] || icons.info}"></i></div>
      <div class="admin-toast-text">${escHtml(text)}</div>`;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 5000);
  }

  // ─── Triple Tap on Profile Image ───
  function initTripleTap() {
    const img = document.querySelector('.profile-img');
    if (!img) return;
    let tapCount = 0;
    let tapTimer = null;

    function handleTap(e) {
      e.preventDefault();
      tapCount++;
      if (tapCount === 3) {
        clearTimeout(tapTimer);
        tapCount = 0;
        openLogin();
        return;
      }
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { tapCount = 0; }, 800);
    }
    img.addEventListener('click', handleTap);
    img.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleTap(e);
    });
    img.style.cursor = 'pointer';
  }

  // ─── Login Modal ───
  function openLogin() {
    if (adminActive) { openDashboard(); return; }
    if (document.getElementById('adminLoginOverlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'admin-overlay';
    overlay.id = 'adminLoginOverlay';
    overlay.innerHTML = `
      <div class="admin-login" style="position:relative;">
        <button class="admin-login-close" id="adminLoginClose">&times;</button>
        <div class="admin-login-header">
          <div class="admin-login-icon"><i class="fas fa-terminal"></i></div>
          <div>
            <div class="admin-login-title">ADMIN ACCESS</div>
            <div class="admin-login-sub">Authentication Required</div>
          </div>
        </div>
        <div class="admin-login-body">
          <label class="admin-login-label"><i class="fas fa-key"></i> Enter Access Code</label>
          <input type="password" class="admin-login-input" id="adminPassInput"
            placeholder="••••••••••" autocomplete="off" />
          <button class="admin-login-btn" id="adminLoginBtn">
            <i class="fas fa-lock-open"></i>&nbsp; AUTHENTICATE
          </button>
          <div class="admin-login-status" id="adminLoginStatus"></div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('active')));

    const input = document.getElementById('adminPassInput');
    const btn = document.getElementById('adminLoginBtn');
    const status = document.getElementById('adminLoginStatus');

    function closeLogin() {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 400);
    }
    document.getElementById('adminLoginClose').onclick = closeLogin;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLogin(); });

    async function attemptLogin() {
      const now = Date.now();
      if (now < lockoutUntil) {
        const sec = Math.ceil((lockoutUntil - now) / 1000);
        status.className = 'admin-login-status warning';
        status.textContent = `⏳ Locked out. Retry in ${sec}s`;
        return;
      }
      const pass = input.value;
      if (!pass) return;

      btn.disabled = true;
      status.className = 'admin-login-status';
      status.textContent = 'Verifying...';
      const hash = await sha256(pass);

      if (hash === CFG.hash) {
        loginAttempts = 0;
        status.className = 'admin-login-status success';
        status.textContent = '✅ Access Granted';
        adminActive = true;
        sessionStorage.setItem(CFG.keys.session, '1');
        addAlert('Admin Login', 'info', 'Admin authenticated successfully');
        setTimeout(() => { closeLogin(); openDashboard(); }, 600);
      } else {
        loginAttempts++;
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
        input.value = '';
        const rem = CFG.maxAttempts - loginAttempts;
        status.className = 'admin-login-status error';
        status.textContent = `❌ Invalid. ${rem} attempt${rem!==1?'s':''} remaining`;
        btn.disabled = false;

        if (loginAttempts >= 3) {
          addAlert('Brute Force', 'critical',
            `${loginAttempts} failed admin login attempts detected`);
        }
        if (loginAttempts >= CFG.maxAttempts) {
          lockoutUntil = Date.now() + CFG.lockoutMs;
          status.className = 'admin-login-status warning';
          status.textContent = '🔒 Too many attempts. Locked for 60s';
          btn.disabled = true;
          addAlert('Brute Force Lockout', 'critical',
            'Admin login locked after max failed attempts');
          setTimeout(() => { btn.disabled = false; loginAttempts = 0; }, CFG.lockoutMs);
        }
      }
    }

    btn.onclick = attemptLogin;
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptLogin(); });
    setTimeout(() => input.focus(), 500);
  }

  // ─── Dashboard ───
  function openDashboard() {
    if (document.getElementById('adminDashboard')) return;
    const dash = document.createElement('div');
    dash.className = 'admin-dashboard';
    dash.id = 'adminDashboard';

    const visitors = load(CFG.keys.visitors);
    const blocked = load(CFG.keys.blocked);
    const alerts = load(CFG.keys.alerts);
    const uniqueIPs = [...new Set(visitors.map(v => v.ip))];

    dash.innerHTML = `
      <div class="admin-dash-header">
        <div class="admin-dash-brand">
          <div class="admin-dash-logo"><i class="fas fa-shield-halved"></i></div>
          <div>
            <div class="admin-dash-title">ADMIN CONTROL CENTER</div>
            <div class="admin-dash-subtitle">CyberGuard Security Dashboard</div>
          </div>
        </div>
        <div class="admin-dash-actions">
          <div class="admin-dash-time" id="adminClock"></div>
          <button class="admin-dash-close" id="adminDashClose">&times;</button>
        </div>
      </div>
      <div class="admin-stats">
        <div class="admin-stat-card">
          <div class="admin-stat-icon"><i class="fas fa-eye"></i></div>
          <div class="admin-stat-value" id="statVisits">${visitors.length}</div>
          <div class="admin-stat-label">Total Visits</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-icon"><i class="fas fa-users"></i></div>
          <div class="admin-stat-value" id="statUnique">${uniqueIPs.length}</div>
          <div class="admin-stat-label">Unique IPs</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-icon"><i class="fas fa-ban"></i></div>
          <div class="admin-stat-value" id="statBlocked">${blocked.length}</div>
          <div class="admin-stat-label">Blocked IPs</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-icon"><i class="fas fa-bell"></i></div>
          <div class="admin-stat-value" id="statAlerts">${alerts.length}</div>
          <div class="admin-stat-label">Security Alerts</div>
        </div>
      </div>
      <div class="admin-tabs">
        <button class="admin-tab active" data-tab="visitors">
          <i class="fas fa-users"></i>&nbsp; Visitors
        </button>
        <button class="admin-tab" data-tab="alerts">
          <i class="fas fa-shield-halved"></i>&nbsp; Security Alerts
          ${alerts.length ? `<span class="admin-tab-badge">${alerts.length}</span>` : ''}
        </button>
        <button class="admin-tab" data-tab="blocked">
          <i class="fas fa-ban"></i>&nbsp; Blocked IPs
          ${blocked.length ? `<span class="admin-tab-badge">${blocked.length}</span>` : ''}
        </button>
      </div>
      <div class="admin-tab-content">
        <div class="admin-tab-panel active" id="panelVisitors"></div>
        <div class="admin-tab-panel" id="panelAlerts"></div>
        <div class="admin-tab-panel" id="panelBlocked"></div>
      </div>`;

    document.body.appendChild(dash);
    requestAnimationFrame(() => requestAnimationFrame(() => dash.classList.add('active')));

    // Clock
    function updateClock() {
      const el = document.getElementById('adminClock');
      if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
    }
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    // Close
    document.getElementById('adminDashClose').onclick = () => {
      clearInterval(clockInterval);
      dash.classList.remove('active');
      setTimeout(() => dash.remove(), 400);
    };

    // Tabs
    dash.querySelectorAll('.admin-tab').forEach(tab => {
      tab.onclick = () => {
        dash.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        dash.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('panel' + capitalize(tab.dataset.tab)).classList.add('active');
      };
    });

    renderVisitors();
    renderAlerts();
    renderBlocked();
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function renderVisitors() {
    const panel = document.getElementById('panelVisitors');
    if (!panel) return;
    const visitors = load(CFG.keys.visitors);
    const blocked = load(CFG.keys.blocked);
    const blockedIPs = new Set(blocked.map(b => b.ip));

    if (!visitors.length) {
      panel.innerHTML = '<div class="admin-empty"><i class="fas fa-ghost"></i><p>No visitors recorded yet</p></div>';
      return;
    }
    // Group by IP, show most recent per IP, sorted by time desc
    const byIP = {};
    visitors.forEach(v => {
      if (!byIP[v.ip] || v.time > byIP[v.ip].time) byIP[v.ip] = v;
      byIP[v.ip].count = (byIP[v.ip].count || 0) + 1;
    });
    const sorted = Object.values(byIP).sort((a, b) => b.time - a.time);

    panel.innerHTML = `<div class="admin-table-wrap"><table class="admin-table">
      <thead><tr>
        <th>IP Address</th><th>Location</th><th>Visits</th><th>Last Seen</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>${sorted.map(v => `<tr>
        <td><span class="admin-ip">${escHtml(v.ip)}</span></td>
        <td><span class="admin-location"><i class="fas fa-map-marker-alt"></i> ${escHtml(v.city)}, ${escHtml(v.country)}</span></td>
        <td>${v.count || 1}</td>
        <td>${timeAgo(v.time)}</td>
        <td>${blockedIPs.has(v.ip) ?
          '<span class="admin-badge admin-badge-blocked">BLOCKED</span>' :
          '<span class="admin-badge admin-badge-active">ACTIVE</span>'}</td>
        <td>${blockedIPs.has(v.ip) ?
          `<button class="admin-action-btn unblock" data-ip="${escHtml(v.ip)}">Unblock</button>` :
          `<button class="admin-action-btn block" data-ip="${escHtml(v.ip)}">Block</button>`}
          <button class="admin-action-btn remove" data-ip="${escHtml(v.ip)}" data-action="remove-visitor">Remove</button>
        </td>
      </tr>`).join('')}</tbody></table></div>`;

    panel.querySelectorAll('.admin-action-btn.block').forEach(btn => {
      btn.onclick = () => blockIP(btn.dataset.ip, 'Manual block by admin');
    });
    panel.querySelectorAll('.admin-action-btn.unblock').forEach(btn => {
      btn.onclick = () => unblockIP(btn.dataset.ip);
    });
    panel.querySelectorAll('[data-action="remove-visitor"]').forEach(btn => {
      btn.onclick = () => removeVisitor(btn.dataset.ip);
    });
  }

  function renderAlerts() {
    const panel = document.getElementById('panelAlerts');
    if (!panel) return;
    const alerts = load(CFG.keys.alerts);

    if (!alerts.length) {
      panel.innerHTML = '<div class="admin-empty"><i class="fas fa-shield-halved"></i><p>No security alerts — all clear</p></div>';
      return;
    }
    const icons = { critical: 'fa-skull-crossbones', warning: 'fa-triangle-exclamation', info: 'fa-info-circle' };
    panel.innerHTML = `<div class="admin-alert-list">${alerts.map(a => `
      <div class="admin-alert-card ${a.severity}">
        <div class="admin-alert-severity"><i class="fas ${icons[a.severity] || icons.info}"></i></div>
        <div class="admin-alert-content">
          <div class="admin-alert-title">${escHtml(a.type)}</div>
          <div class="admin-alert-desc">${escHtml(a.desc)}</div>
          <div class="admin-alert-meta">
            <span class="admin-ip">${escHtml(a.ip)}</span>
            <span>${timeAgo(a.time)}</span>
          </div>
        </div>
        <div class="admin-alert-actions">
          ${a.ip && a.ip !== 'Unknown' ? `<button class="admin-action-btn block" data-ip="${escHtml(a.ip)}">Block IP</button>` : ''}
        </div>
      </div>`).join('')}</div>
      <div style="text-align:center;margin-top:18px;">
        <button class="admin-action-btn remove" id="clearAlerts" style="padding:8px 20px;">Clear All Alerts</button>
      </div>`;

    panel.querySelectorAll('.admin-action-btn.block').forEach(btn => {
      btn.onclick = () => blockIP(btn.dataset.ip, 'Blocked from security alert');
    });
    document.getElementById('clearAlerts').onclick = () => {
      store(CFG.keys.alerts, []);
      renderAlerts();
      updateStats();
    };
  }

  function renderBlocked() {
    const panel = document.getElementById('panelBlocked');
    if (!panel) return;
    const blocked = load(CFG.keys.blocked);

    if (!blocked.length) {
      panel.innerHTML = '<div class="admin-empty"><i class="fas fa-check-circle"></i><p>No blocked IPs</p></div>';
      return;
    }
    panel.innerHTML = `<div class="admin-table-wrap"><table class="admin-table">
      <thead><tr><th>IP Address</th><th>Reason</th><th>Blocked</th><th>Actions</th></tr></thead>
      <tbody>${blocked.map(b => `<tr>
        <td><span class="admin-ip">${escHtml(b.ip)}</span></td>
        <td>${escHtml(b.reason)}</td>
        <td>${timeAgo(b.time)}</td>
        <td>
          <button class="admin-action-btn unblock" data-ip="${escHtml(b.ip)}">Unblock</button>
          <button class="admin-action-btn remove" data-ip="${escHtml(b.ip)}" data-action="remove-blocked">Remove</button>
        </td>
      </tr>`).join('')}</tbody></table></div>`;

    panel.querySelectorAll('.admin-action-btn.unblock').forEach(btn => {
      btn.onclick = () => unblockIP(btn.dataset.ip);
    });
    panel.querySelectorAll('[data-action="remove-blocked"]').forEach(btn => {
      btn.onclick = () => {
        let bl = load(CFG.keys.blocked);
        bl = bl.filter(b => b.ip !== btn.dataset.ip);
        store(CFG.keys.blocked, bl);
        renderBlocked(); renderVisitors(); updateStats();
      };
    });
  }

  function blockIP(ip, reason) {
    const blocked = load(CFG.keys.blocked);
    if (blocked.find(b => b.ip === ip)) return;
    blocked.push({ ip, reason: reason || 'Blocked by admin', time: Date.now() });
    store(CFG.keys.blocked, blocked);
    addAlert('IP Blocked', 'warning', `IP ${ip} has been blocked: ${reason}`);
    renderVisitors(); renderBlocked(); updateStats();
  }

  function unblockIP(ip) {
    let blocked = load(CFG.keys.blocked);
    blocked = blocked.filter(b => b.ip !== ip);
    store(CFG.keys.blocked, blocked);
    addAlert('IP Unblocked', 'info', `IP ${ip} has been unblocked`);
    renderVisitors(); renderBlocked(); updateStats();
  }

  function removeVisitor(ip) {
    let visitors = load(CFG.keys.visitors);
    visitors = visitors.filter(v => v.ip !== ip);
    store(CFG.keys.visitors, visitors);
    renderVisitors(); updateStats();
  }

  function updateStats() {
    const visitors = load(CFG.keys.visitors);
    const blocked = load(CFG.keys.blocked);
    const alerts = load(CFG.keys.alerts);
    const u = [...new Set(visitors.map(v => v.ip))];
    const el = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
    el('statVisits', visitors.length);
    el('statUnique', u.length);
    el('statBlocked', blocked.length);
    el('statAlerts', alerts.length);
  }

  // ─── Init ───
  document.addEventListener('DOMContentLoaded', () => {
    trackVisitor();
    initTripleTap();
    monitorInputs();
    setupHoneypot();
    detectRapidAccess();

    // Restore session
    if (sessionStorage.getItem(CFG.keys.session) === '1') {
      adminActive = true;
    }
  });
})();
