import { createHash } from 'crypto';

/**
 * Lightweight ETag helper for JSON responses.
 * Uses a fast hash of the serialized body; avoids crypto overhead on small payloads.
 */
export function weakEtag(body: unknown): string {
  const json = typeof body === 'string' ? body : JSON.stringify(body);
  // 32-bit FNV-1a is fast and sufficient for ETag collision resistance at this scale
  let hash = 2166136261;
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `W/"${hash.toString(16)}-${json.length}"`;
}

/**
 * ETag interceptor — adds weak ETags to GET responses and returns 304
 * when `If-None-Match` matches, saving serialization + bandwidth on
 * polling clients. Safe only for idempotent GET endpoints.
 */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class EtagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ method: string; headers: Record<string, string> }>();
    const response = context.switchToHttp().getResponse<{ header: (k: string, v: string) => void; status: (n: number) => any; send: (b: any) => void }>();
    if (request.method !== 'GET') return next.handle();
    const ifNoneMatch = request.headers['if-none-match'];
    return next.handle().pipe(
      map((body) => {
        if (body == null || typeof body === 'string') return body;
        try {
          const tag = weakEtag(body);
          response.header('ETag', tag);
          if (ifNoneMatch && ifNoneMatch === tag) {
            response.status(304).send(null);
            return null;
          }
        } catch {}
        return body;
      }),
    );
  }
}
