import { STATUS_CODES } from 'node:http';
import type { AlertEvent, AlertKind } from './telegram-alerts';

const templates: Record<AlertKind, { title: string; status: string; type: string; details: string }> = {
  rate_limit: {
    title: 'RATE LIMITED!', status: 'សំណើត្រូវបានកំណត់អត្រា / Request rate limited',
    type: 'Too Many Requests / Possible Flood', details: 'The API rejected this request because the request limit was exceeded.',
  },
  ip_block: {
    title: 'REQUEST BLOCKED!', status: 'សំណើត្រូវបានបដិសេធ / Request blocked',
    type: 'IP Security Policy', details: 'The gateway rejected this request under the configured IP policy.',
  },
  domain_block: {
    title: 'REQUEST BLOCKED!', status: 'សំណើត្រូវបានបដិសេធ / Request blocked',
    type: 'Origin / Domain Security Policy', details: 'The gateway rejected this request under the configured origin/domain policy.',
  },
  suspicious_probe: {
    title: 'SUSPICIOUS ACTIVITY!', status: 'ត្រូវការត្រួតពិនិត្យ / Review required',
    type: 'Sensitive Path / Vulnerability Probe', details: 'A request matched a monitored probe pattern. Review the logs to determine intent.',
  },
  repeated_rejections: {
    title: 'REPEATED REJECTIONS!', status: 'ត្រូវការត្រួតពិនិត្យ / Review required',
    type: 'Repeated Failed Requests', details: 'Requests with the same observed IP and HTTP status reached the monitoring threshold. The latest request is shown; this does not automatically block the IP.',
  },
  http_error: {
    title: 'SERVER ERROR!', status: 'កំហុសម៉ាស៊ីនមេ / Server error',
    type: 'HTTP Server Error', details: 'The API returned a server error. Use the request ID to inspect service logs.',
  },
  logged_error: {
    title: 'APPLICATION ERROR!', status: 'កំហុសកម្មវិធី / Application error',
    type: 'Application / Background Error', details: 'The application logged an error. Inspect the indicated service and source logs.',
  },
  startup_failure: {
    title: 'STARTUP FAILURE!', status: 'សេវាមិនអាចចាប់ផ្តើម / Service failed to start',
    type: 'Service Startup Failure', details: 'The service failed during startup. Inspect deployment configuration and service logs.',
  },
};

// Telegram HTML must never interpret event metadata as markup or injected links.
function escape(value: string): string {
  return value.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 200)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function context(service: string, production: boolean, now: Date): string[] {
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Phnom_Penh', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).format(now);
  return [
    `🧩 <b>Service:</b> <code>${escape(service)}</code>`,
    `⚙️ <b>Environment:</b> ${production ? 'production' : 'non-production'}`,
    `⏰ <b>Time:</b> ${time} (UTC+07:00)`,
  ];
}

/** Shared presentation for all API services; metadata remains bounded and escaped. */
export function formatTelegramAlert(event: AlertEvent, service: string, production: boolean, now = new Date()): string {
  const template = templates[event.kind];
  const http = event.status === undefined ? '' : ` (${event.status} ${STATUS_CODES[event.status] || 'HTTP Response'})`;
  const loopback = event.ip && (/^(?:::ffff:)?127\./.test(event.ip) || event.ip === '::1');
  const browser = event.browser === 'Chromium' ? 'Chromium-based browser (exact browser unavailable)' :
    event.browser === 'Brave' ? 'Brave (product version unavailable)' :
      event.browser === 'Unknown' ? 'Unknown' : `${event.browser}${event.browserMajor ? ` ${event.browserMajor}` : ''}`;
  const lines = [
    `🛡 <b>ស្ថានភាព (Status):</b> ${template.status}${http}`,
    `⚠️ <b>ប្រភេទ (Type):</b> ${template.type}`,
    event.ip ? `🌐 <b>Observed IP:</b> <code>${escape(event.ip)}</code>${loopback ? ' (loopback / local connection)' : ''}` : '',
    event.browser ? `🌍 <b>Browser (reported):</b> ${escape(browser)}` : '',
    event.chromiumMajor ? `🔧 <b>Chromium engine (reported):</b> ${event.chromiumMajor}` : '',
    event.os ? `💻 <b>OS (reported):</b> ${escape(event.os)}` : '',
    event.method || event.route ? `🎯 <b>Route pattern (latest request):</b> <code>${escape([event.method, event.route].filter(Boolean).join(' '))}</code>` : '',
    event.source ? `📍 <b>Source:</b> <code>${escape(event.source)}</code>` : '',
    event.requestId ? `🔎 <b>Request ID:</b> <code>${escape(event.requestId)}</code>` : '',
    event.count ? `🔢 <b>Rejected requests${event.windowSeconds ? ` within ${event.windowSeconds} seconds` : ' in monitoring period'}:</b> ${event.count}` : '',
    `📝 <b>ព័ត៌មាន (Details):</b> ${template.details}`,
    ...context(event.service || service, production, now),
  ].filter(Boolean).join('\n');
  return [
    `🚨 <b>INVA API SHIELD - ${template.title}</b>`, lines,
    '<i>សូមពិនិត្យកំណត់ហេតុ / Review service logs and security settings in Super App.</i>',
  ].join('\n\n');
}

export function formatTelegramTestMessage(service: string, production: boolean, now = new Date()): string {
  return [
    '✅ <b>INVA API SHIELD - TEST MESSAGE</b>', '',
    '🛡 <b>ស្ថានភាព (Status):</b> បានភ្ជាប់ / Telegram connected',
    '📝 <b>ព័ត៌មាន (Details):</b> Test delivery succeeded. Automatic alerts follow the saved enabled setting.',
    ...context(service, production, now),
  ].join('\n');
}
