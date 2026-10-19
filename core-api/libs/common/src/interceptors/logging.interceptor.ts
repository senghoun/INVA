import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FastifyRequest } from 'fastify';
import { logPath } from '../logging/http-logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const { method, url } = request;
    const startTime = Date.now();

    const writeLog = (error?: unknown) => {
        const response = context.switchToHttp().getResponse<{ statusCode: number }>();
        const duration = Date.now() - startTime;
        const statusCode = error === undefined ? response?.statusCode : error instanceof HttpException ? error.getStatus() : 500;
        this.logger.log({
          method, path: logPath(url), statusCode, durationMs: duration,
          correlationId: request.id,
        });
    };
    return next.handle().pipe(
      tap({ next: () => writeLog(), error: error => writeLog(error) }),
    );
  }
}
