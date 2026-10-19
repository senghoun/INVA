/**
 * Server-rendered developer portal for the inva API Gateway.
 * Served at GET /api/docs by DocsController (plain HTML string, no template engine).
 */

import { DOC_SERVICES } from './docs-registry';

export function buildPortalHtml(): string {
  const serviceCards = DOC_SERVICES.map(
    (s) => `
      <a class="card" id="card-${s.key}" data-service="${s.key}" href="/api/docs/reference?urls.primaryName=${encodeURIComponent(`${s.emoji} ${s.name} (Port ${s.port})`)}">
        <div class="card-head">
          <span class="card-emoji">${s.emoji}</span>
          <span class="card-name">${s.name}</span>
          <span class="badge" id="badge-${s.key}">…</span>
        </div>
        <p class="card-desc">${s.description}</p>
        <div class="card-meta">
          <code>:${s.port}</code>
          <code class="starter"><b>${s.starterEndpoint.method}</b> ${s.starterEndpoint.path}</code>
        </div>
      </a>`,
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>inva Core API — Developer Portal</title>
<link rel="icon" type="image/png" href="/api/docs/favicon-32x32.png" sizes="32x32" />
<style>
  :root {
    --bg: #0b1220; --surface: #101a2e; --surface-2: #16233c; --border: #1e2c47;
    --text: #e6edf7; --muted: #8fa1bd; --accent: #4f8ef7; --ok: #34d399; --warn: #fbbf24; --down: #f87171;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; color: var(--text);
    font-family: ui-sans-serif, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: radial-gradient(1200px 500px at 80% -10%, rgba(79,142,247,0.16), transparent 60%), var(--bg);
  }
  header { padding: 36px 24px 8px; max-width: 1080px; margin: 0 auto; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo {
    width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center;
    background: linear-gradient(135deg, #4f8ef7, #7c3aed); font-size: 22px;
  }
  h1 { margin: 0; font-size: 22px; letter-spacing: 0.2px; }
  .sub { color: var(--muted); margin: 6px 0 0; font-size: 14px; }
  .sub code { color: #a9c1f7; background: rgba(79,142,247,0.12); padding: 1px 6px; border-radius: 6px; }
  main { max-width: 1080px; margin: 0 auto; padding: 20px 24px 60px; }
  section { margin-top: 26px; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 1.2px; color: var(--muted); margin: 0 0 12px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
  .card {
    display: block; text-decoration: none; color: inherit; padding: 16px;
    background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
    transition: transform 0.12s ease, border-color 0.12s ease, background 0.12s ease;
  }
  .card:hover { transform: translateY(-2px); border-color: #2e4265; background: var(--surface-2); }
  .card-head { display: flex; align-items: center; gap: 10px; }
  .card-emoji { font-size: 20px; }
  .card-name { font-weight: 650; font-size: 15px; flex: 1; }
  .badge { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; background: #1f2a44; color: var(--muted); }
  .badge.up { background: rgba(52,211,153,0.15); color: var(--ok); }
  .badge.down { background: rgba(248,113,113,0.15); color: var(--down); }
  .badge.off { background: rgba(251,191,36,0.15); color: var(--warn); }
  .card-desc { color: var(--muted); font-size: 13px; margin: 10px 0 12px; line-height: 1.45; }
  .card-meta { display: flex; gap: 8px; flex-wrap: wrap; }
  .card-meta code {
    font-size: 11px; color: #9fb6d9; background: #0d1729; border: 1px solid var(--border);
    padding: 3px 8px; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .quickstart { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 18px; }
  .steps { margin: 0; padding-left: 20px; color: var(--muted); font-size: 14px; line-height: 1.9; }
  .steps a { color: #7fb0ff; text-decoration: none; }
  .steps a:hover { text-decoration: underline; }
  .steps code {
    background: #0d1729; border: 1px solid var(--border); color: #bcd0f0;
    padding: 2px 8px; border-radius: 6px; font-size: 12.5px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .auth { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 18px; }
  .auth-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
  .field { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 220px; }
  label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.6px; }
  input {
    background: #0d1729; border: 1px solid var(--border); color: var(--text);
    border-radius: 9px; padding: 10px 12px; font-size: 14px; outline: none;
  }
  input:focus { border-color: var(--accent); }
  button {
    cursor: pointer; border: 0; border-radius: 9px; padding: 10px 16px; font-size: 13.5px; font-weight: 600;
    background: var(--accent); color: white; transition: filter 0.1s ease;
  }
  button:hover { filter: brightness(1.12); }
  button.secondary { background: var(--surface-2); border: 1px solid var(--border); color: var(--text); }
  button:disabled { opacity: 0.55; cursor: not-allowed; }
  #auth-result { font-size: 13px; margin-top: 10px; color: var(--muted); min-height: 18px; white-space: pre-wrap; }
  #auth-result.ok { color: var(--ok); }
  #auth-result.err { color: var(--down); }
  .note { color: var(--muted); font-size: 12.5px; margin-top: 10px; line-height: 1.5; }
  .muted { color: var(--muted); }
  footer { color: #5c6f8f; font-size: 12px; padding: 18px 24px 30px; text-align: center; }
  footer a { color: #7fb0ff; text-decoration: none; }
  @media (max-width: 640px) { header { padding-top: 24px; } }
</style>
</head>
<body>
<header>
  <div class="brand">
    <div class="logo">🚀</div>
    <div>
      <h1>inva Core API — Developer Portal</h1>
      <p class="sub">Enterprise microservices hub · Test every endpoint through the gateway at <code>/api/v1/*</code></p>
    </div>
  </div>
</header>
<main>
  <section>
    <h2>Services</h2>
    <p class="muted" id="status-updated" style="font-size:12px;margin:-4px 0 12px;">Checking live status…</p>
    <div class="cards">${serviceCards}</div>
  </section>

  <section>
    <h2>Quick Start</h2>
    <div class="quickstart">
      <ol class="steps">
        <li><a href="/api/docs/reference">Open the API Reference</a> and pick a service from the top-right definition picker.</li>
        <li>Log in once: fill the form below or call <code>POST /api/v1/auth/login</code> with your credentials.</li>
        <li>Grab the <code>accessToken</code> and hit <b>Authorize</b> in the reference page — it is remembered across reloads.</li>
        <li>Explore any endpoint: press <b>Try it out</b>, edit the body, and inspect live responses &amp; timing.</li>
      </ol>
    </div>
  </section>

  <section>
    <h2>Get a Token</h2>
    <div class="auth">
      <div class="auth-row">
        <div class="field">
          <label for="email">Email or phone</label>
          <input id="email" type="text" placeholder="you@inva.io or +85512345678" autocomplete="username" />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" type="password" placeholder="••••••••" autocomplete="current-password" />
        </div>
        <button id="login-btn">Log in &amp; store token</button>
        <button id="clear-btn" class="secondary">Clear stored token</button>
      </div>
      <div id="auth-result"></div>
      <p class="note">
        Tokens are stored only in this browser's <code>localStorage</code> and sent as <code>Authorization: Bearer …</code> by the reference console below.
        When you log in here, the token is also pre-filled into the Authorize dialog of the API reference.
      </p>
    </div>
  </section>

  <section>
    <h2>Raw OpenAPI Specs</h2>
    <p class="muted" style="font-size:13px">
      Unified: <a style="color:#7fb0ff" href="/api/docs/specs/all.json">all.json</a> ·
      Per-service: ${DOC_SERVICES.map((s) => `<a style="color:#7fb0ff" href="/api/docs/specs/${s.key}.json">${s.key}.json</a>`).join(' · ')} ·
      Gateway: <a style="color:#7fb0ff" href="/api/docs/specs/gateway.json">gateway.json</a>
    </p>
  </section>
</main>
<footer>
  inva Core System · Portal + specs served by the API Gateway ·
  <a href="/health">Gateway health</a> ·
  <a href="/api/docs/reference">API Reference</a>
</footer>
<script src="/api/docs/portal.js"></script>
</body>
</html>`;
}
