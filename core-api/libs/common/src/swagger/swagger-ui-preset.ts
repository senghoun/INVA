/**
 * Shared Swagger UI developer-experience preset.
 *
 * Applied by every inva service (gateway + auth/hr/crm/ac/it) so that all
 * `/api/docs` pages share one consistent, developer-friendly setup:
 *  - Authorization is persisted across reloads (localStorage).
 *  - No remote "try it out" validator phone-home.
 *  - Better request/response type rendering (try-it-out show common extensions).
 *  - Brand typography, spacing and dark topbar styling.
 */

export const DOCS_TOPBAR_CSS = `
  .swagger-ui .topbar { background-color: #0b1220; border-bottom: 1px solid #1e293b; padding: 0; }
  .swagger-ui .topbar-wrapper { align-items: center; }
  .swagger-ui .topbar .link img { height: 34px; }
  .swagger-ui .topbar .download-url-wrapper { display: flex; align-items: center; }
  .swagger-ui .topbar .download-url-wrapper select {
    min-width: 320px; font-weight: 600; border-radius: 8px; padding: 8px 12px;
    background: #f8fafc; color: #0f172a; border: 1px solid #334155; font-size: 13px;
  }
  .swagger-ui .topbar .download-url-wrapper .download-url-button { border-radius: 0 8px 8px 0; }
  .swagger-ui .topbar a { text-decoration: none; }
`;

export const DOCS_BASE_CSS = `
  ${DOCS_TOPBAR_CSS}
  html { box-sizing: border-box; overflow-y: scroll; }
  *, *:before, *:after { box-sizing: inherit; }
  body { margin: 0; background: #fafafa; }
  .swagger-ui .info .title { font-size: 26px; }
  .swagger-ui .opblock-tag { font-size: 17px; padding: 12px 0; }
  .swagger-ui table thead tr td, .swagger-ui table thead tr th { font-size: 12px; }
  .swagger-ui .btn.authorize { line-height: 1; }
`;

/**
 * Swagger UI options shared by all services.
 * These are merged into `SwaggerModule.setup(..., { swaggerOptions })`.
 */
export function buildSwaggerUiOptions(): Record<string, unknown> {
  return {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: false,
    docExpansion: 'none',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    defaultModelRendering: 'example',
    showExtensions: true,
    showCommonExtensions: true,
    withCredentials: false,
  };
}
