import type { LoggerOptions } from 'pino';

/** Query strings may contain verification tokens or personal search terms. */
export function logPath(url: string): string {
  return url.split('?')[0].replace(/[\r\n\t]/g, '');
}

/** Pino's default request/error serializers can expose headers and provider URLs. */
export const httpLoggerOptions = {
  redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
  hooks: {
    logMethod(args, method) {
      const object = args[0];
      // Fastify also places error.message in the top-level log message, outside serializers.
      if (object instanceof Error || (object && typeof object === 'object' && 'err' in object)) {
        method.call(this, object, 'Request failed');
      } else method.apply(this, args);
    },
  },
  serializers: {
    req(request: { method: string; url: string; id?: string }) {
      return { method: request.method, path: logPath(request.url), requestId: request.id };
    },
    err(error: Error) {
      return { type: error.name, message: 'Request failed', stack: '' }; // Avoid SQL/provider messages containing credentials or PII.
    },
  },
} satisfies LoggerOptions;
