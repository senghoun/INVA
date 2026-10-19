/**
 * Client-side JavaScript for the developer documentation surfaces.
 * Kept as plain strings (no bundler) and served by DocsController / embedded
 * in the Swagger UI page via `customJsStr`.
 *
 * NOTE: avoid template literals inside these scripts so they can live in
 * TypeScript template strings without escaping headaches.
 */

/**
 * Portal page script (/api/docs):
 *  - polls /api/docs/status and paints live UP/DOWN/DISCONNECTED badges,
 *  - login helper that stores the JWT and pre-authorizes the reference page,
 *  - shows a masked hint when a token is already stored.
 */
export const PORTAL_JS = `
(function () {
  var TOKEN_KEY = 'inva_docs_token';
  var SWAGGER_AUTH_KEY = 'authorized';

  function $(id) { return document.getElementById(id); }

  function maskToken(t) { return t ? '\\u00b7\\u00b7\\u00b7\\u00b7' + t.slice(-4) : ''; }

  function readStoredToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }

  function preAuthorizeSwaggerUi(token) {
    try {
      var auth = {};
      try { auth = JSON.parse(localStorage.getItem(SWAGGER_AUTH_KEY) || '{}'); } catch (e) { auth = {}; }
      auth['bearer'] = {
        name: 'bearer',
        type: 'http',
        schema: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        value: token
      };
      localStorage.setItem(SWAGGER_AUTH_KEY, JSON.stringify(auth));
    } catch (e) { /* storage unavailable */ }
  }

  function clearStoredToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      var auth = {};
      try { auth = JSON.parse(localStorage.getItem(SWAGGER_AUTH_KEY) || '{}'); } catch (e) { auth = {}; }
      delete auth['bearer'];
      if (Object.keys(auth).length) { localStorage.setItem(SWAGGER_AUTH_KEY, JSON.stringify(auth)); }
      else { localStorage.removeItem(SWAGGER_AUTH_KEY); }
    } catch (e) { /* storage unavailable */ }
  }

  function setResult(text, cls) {
    var el = $('auth-result');
    if (!el) return;
    el.textContent = text;
    el.className = cls || '';
  }

  function refreshStoredHint() {
    var t = readStoredToken();
    if (t) {
      setResult('Token already stored (' + maskToken(t) + '). The API Reference is pre-authorized for this browser.', 'ok');
    }
  }

  function doLogin() {
    var email = ($('email') && $('email').value || '').trim();
    var password = ($('password') && $('password').value) || '';
    var btn = $('login-btn');
    if (!email || !password) { setResult('Enter an email or phone number and password.', 'err'); return; }
    if (btn) { btn.disabled = true; }
    setResult('Logging in\\u2026', '');

    fetch('/api/v1/auth/login', {
      method: 'POST',
      credentials: 'omit', // This portal uses explicit bearer tokens, independently of the app's browser session.
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(email.indexOf('@') >= 0 ? { email: email, password: password } : { phone: email, password: password })
    }).then(function (res) {
      return res.json().then(function (data) { return { ok: res.ok, status: res.status, data: data }; });
    }).then(function (r) {
      if (btn) { btn.disabled = false; }
      if (!r.ok) {
        var msg = r.data && (r.data.message || r.data.error) || ('HTTP ' + r.status);
        if (Array.isArray(msg)) { msg = msg.join('; '); }
        setResult('Login failed (' + r.status + '): ' + msg, 'err');
        return;
      }
      if (r.data && r.data.requiresPasswordChange) {
        setResult('Password change required before this account can be used. Complete POST /api/v1/auth/complete-temporary-password with the passwordChangeToken (expires in ' + (r.data.expiresIn || 600) + 's), then retry.', 'err');
        return;
      }
      var token = r.data && (r.data.accessToken || r.data.access_token);
      if (!token) { setResult('Login succeeded but the response contained no accessToken.', 'err'); return; }
      try {
        localStorage.setItem(TOKEN_KEY, token);
        preAuthorizeSwaggerUi(token);
      } catch (e) { /* storage unavailable */ }
      setResult('Logged in \\u2714  token stored (' + maskToken(token) + '). Open the API Reference \\u2014 it is already authorized.', 'ok');
    }).catch(function (err) {
      if (btn) { btn.disabled = false; }
      setResult('Network error: ' + (err && err.message ? err.message : err), 'err');
    });
  }

  function paintStatus() {
    fetch('/api/docs/status').then(function (res) { return res.json(); }).then(function (data) {
      var services = (data && data.services) || [];
      services.forEach(function (svc) {
        var badge = $('badge-' + svc.key);
        var card = $('card-' + svc.key);
        if (!badge) return;
        var label, cls;
        if (!svc.connected) { label = 'DISCONNECTED'; cls = 'off'; }
        else if (svc.online) { label = 'UP'; cls = 'up'; }
        else { label = 'DOWN'; cls = 'down'; }
        badge.textContent = label;
        badge.className = 'badge ' + cls;
        if (card) { card.style.borderColor = cls === 'up' ? 'rgba(52,211,153,0.35)' : (cls === 'down' ? 'rgba(248,113,113,0.35)' : 'rgba(251,191,36,0.35)'); }
      });
      if (data && data.checkedAt) {
        var el = document.getElementById('status-updated');
        if (el) { el.textContent = 'Status checked at ' + data.checkedAt; }
      }
    }).catch(function () { /* leave placeholders */ });
  }

  var loginBtn = $('login-btn');
  if (loginBtn) { loginBtn.addEventListener('click', doLogin); }
  var clearBtn = $('clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      clearStoredToken();
      setResult('Stored token removed. Protected calls will now return 401 until you log in again.', '');
    });
  }
  var pwd = $('password');
  if (pwd) {
    pwd.addEventListener('keydown', function (e) { if (e.key === 'Enter') { doLogin(); } });
  }

  refreshStoredHint();
  paintStatus();
  setInterval(paintStatus, 30000);
})();
`;

/**
 * Script embedded into the Swagger UI reference page (/api/docs/reference):
 *  - "Back to portal" link in the topbar,
 *  - remembers the last selected definition across visits,
 *  - "/" focuses the filter box.
 */
export const REFERENCE_JS = `
(function () {
  var SPEC_PREF_KEY = 'inva_docs_reference_spec';

  function portalLink() {
    var wrapper = document.querySelector('.swagger-ui .topbar-wrapper');
    if (!wrapper || document.getElementById('inva-portal-link')) return;
    var a = document.createElement('a');
    a.id = 'inva-portal-link';
    a.href = '/api/docs';
    a.textContent = '\\u2190 Developer Portal';
    a.setAttribute('style', 'display:inline-flex;align-items:center;margin:0 16px 0 0;padding:6px 12px;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap;');
    a.addEventListener('mouseenter', function () { a.style.filter = 'brightness(1.2)'; });
    a.addEventListener('mouseleave', function () { a.style.filter = ''; });
    wrapper.insertBefore(a, wrapper.firstChild);
  }

  function configs() {
    try { return (window.ui && window.ui.getConfigs()) || {}; } catch (e) { return {}; }
  }

  function rememberSelection(name) {
    try { localStorage.setItem(SPEC_PREF_KEY, name); } catch (e) { /* ignore */ }
  }

  function resolveNameByUrl(url) {
    var urls = configs().urls || [];
    for (var i = 0; i < urls.length; i++) {
      if (urls[i].url === url) { return urls[i].name; }
    }
    return null;
  }

  function trackSelectChanges() {
    document.addEventListener('change', function (e) {
      var t = e.target;
      if (!t || t.tagName !== 'SELECT') return;
      if (!t.closest || !t.closest('.topbar')) return;
      var name = resolveNameByUrl(t.value);
      if (name) { rememberSelection(name); }
    }, true);
  }

  function restoreSelection() {
    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get('urls.primaryName');
    if (fromUrl) { rememberSelection(fromUrl); return; }
    var stored = null;
    try { stored = localStorage.getItem(SPEC_PREF_KEY); } catch (e) { stored = null; }
    var available = configs().urls || [];
    if (stored && available.length) {
      var known = available.some(function (u) { return u.name === stored; });
      if (known) {
        params.set('urls.primaryName', stored);
        window.location.replace(window.location.pathname + '?' + params.toString());
      }
    }
  }

  function filterShortcut() {
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      var active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
      var input = document.querySelector('.swagger-ui .filter-container input, .swagger-ui .filter input');
      if (input) { e.preventDefault(); input.focus(); }
    });
  }

  function boot() {
    trackSelectChanges();
    filterShortcut();
    // window.ui is created by swagger-ui-init.js on window.onload — wait for it.
    waitForUi(function () {
      restoreSelection();
      waitForTopbar(portalLink);
    });
  }

  function waitForUi(fn, attempts) {
    var left = attempts || 60;
    if (window.ui && window.ui.getConfigs) { fn(); return; }
    if (left <= 0) return;
    setTimeout(function () { waitForUi(fn, left - 1); }, 100);
  }

  // The topbar renders asynchronously after SwaggerUIBundle mounts; poll briefly.
  function waitForTopbar(fn, attempts) {
    var left = attempts || 40;
    if (document.querySelector('.swagger-ui .topbar-wrapper')) { fn(); return; }
    if (left <= 0) return;
    setTimeout(function () { waitForTopbar(fn, left - 1); }, 100);
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', boot); }
  else { boot(); }
})();
`;
