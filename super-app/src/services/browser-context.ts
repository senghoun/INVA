type BrowserNavigator = Navigator & { brave?: { isBrave?: () => Promise<boolean> } };
let detection: Promise<void> | undefined;
let reportedHeaders: Record<string, string> = {};

/** Detect once in the background; metadata must not delay requests or session changes. */
export function initializeBrowserContext(): Promise<void> {
  if (!detection) {
    detection = (async (): Promise<void> => {
      if (typeof navigator === 'undefined') return;
      try {
        const brave = (navigator as BrowserNavigator).brave;
        if (brave?.isBrave && await brave.isBrave()) reportedHeaders = { 'X-Inva-Browser': 'Brave' };
      } catch { /* Restricted browser APIs must not prevent requests. */ }
    })();
  }
  return detection;
}

/** A client-reported browser hint for monitoring only; never an authorization claim. */
export function browserContextHeaders(): Record<string, string> {
  return { ...reportedHeaders };
}

void initializeBrowserContext();
