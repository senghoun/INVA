/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_TAGLINE?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_PORT?: string;

  readonly VITE_API_VERSION?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_GATEWAY_URL?: string;
  readonly VITE_GATEWAY_PORT?: string;

  readonly VITE_AUTH_SERVICE_PORT?: string;
  readonly VITE_AUTH_SERVICE_URL?: string;

  readonly VITE_HR_SERVICE_PORT?: string;
  readonly VITE_HR_SERVICE_URL?: string;

  readonly VITE_CRM_SERVICE_PORT?: string;
  readonly VITE_CRM_SERVICE_URL?: string;

  readonly VITE_AC_SERVICE_PORT?: string;
  readonly VITE_AC_SERVICE_URL?: string;

  readonly VITE_IT_SERVICE_PORT?: string;
  readonly VITE_IT_SERVICE_URL?: string;

  readonly VITE_DEFAULT_POLL_INTERVAL?: string;

  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_ATRIA_API_URL?: string;
  readonly VITE_ATRIA_API_KEY?: string;
  readonly VITE_ATRIA_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
