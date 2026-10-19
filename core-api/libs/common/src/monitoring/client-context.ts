export const CLIENT_BROWSERS = ['Brave', 'Chrome', 'Chromium', 'Edge', 'Firefox', 'Safari', 'Opera', 'Unknown'] as const;
export const CLIENT_OS = ['macOS', 'Windows', 'Linux', 'Android', 'iOS', 'Chrome OS', 'Unknown'] as const;
export interface ClientContext {
  browser: typeof CLIENT_BROWSERS[number];
  os: typeof CLIENT_OS[number];
  browserMajor?: number;
  chromiumMajor?: number;
}

/** Export only recognized categories and major versions, never raw headers. These are client reports, not verified identity. */
export function clientContext(headers: Record<string, unknown>): ClientContext {
  const read = (key: string) => typeof headers[key] === 'string' ? (headers[key] as string).slice(0, 1024) : '';
  const ua = read('user-agent');
  const brands = read('sec-ch-ua');
  const platform = read('sec-ch-ua-platform').replace(/^"|"$/g, '');
  const os = CLIENT_OS.find(value => value !== 'Unknown' && value === platform) ||
    (/Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' :
      /Macintosh|Mac OS X/i.test(ua) ? 'macOS' : /Windows/i.test(ua) ? 'Windows' :
        /CrOS/i.test(ua) ? 'Chrome OS' : /Linux/i.test(ua) ? 'Linux' : 'Unknown');
  const major = (value?: string) => value && /^\d{1,4}$/.test(value) && Number(value) > 0 ? Number(value) : undefined;
  const chromiumMajor = major(ua.match(/(?:Chrome|Chromium)\/(\d+)/)?.[1] || brands.match(/"Chromium";\s*v="(\d+)"/)?.[1]);
  if (chromiumMajor && (read('x-inva-browser') === 'Brave' || /"Brave";/.test(brands))) {
    // Chromium's version is not Brave's product version.
    return { browser: 'Brave', os, chromiumMajor };
  }
  const known: Array<[ClientContext['browser'], RegExp]> = [
    ['Edge', /(?:Edg|EdgA|EdgiOS)\/(\d+)/], ['Opera', /OPR\/(\d+)/],
    ['Firefox', /(?:Firefox|FxiOS)\/(\d+)/], ['Chrome', /CriOS\/(\d+)/],
  ];
  for (const [browser, pattern] of known) {
    const match = ua.match(pattern);
    if (match) return { browser, os, browserMajor: major(match[1]), ...(chromiumMajor ? { chromiumMajor } : {}) };
  }
  if (chromiumMajor) {
    const chrome = brands.match(/"Google Chrome";\s*v="(\d+)"/);
    return { browser: chrome ? 'Chrome' : 'Chromium', os, ...(chrome ? { browserMajor: major(chrome[1]) } : {}), chromiumMajor };
  }
  const safari = ua.includes('Safari/') && ua.match(/Version\/(\d+)/);
  if (safari) return { browser: 'Safari', os, browserMajor: major(safari[1]) };
  return { browser: 'Unknown', os };
}
