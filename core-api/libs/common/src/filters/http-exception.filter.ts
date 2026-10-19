import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj.message || exception.message;
        error = resObj.error || exception.name;
      } else {
        message = String(res);
        error = exception.name;
      }
    } else if (
      exception &&
      typeof exception === 'object' &&
      'code' in exception &&
      typeof (exception as any).code === 'string' &&
      (exception as any).code.startsWith('P')
    ) {
      const prismaError = exception as any;
      if (prismaError.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        error = 'Conflict';
        const target = Array.isArray(prismaError.meta?.target)
          ? prismaError.meta.target.join(', ')
          : prismaError.meta?.target || 'field';
        message = `Unique constraint failed on: ${target}`;
      } else if (prismaError.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        error = 'Not Found';
        message = prismaError.meta?.cause || 'Record not found';
      } else if (prismaError.code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        message = `Foreign key constraint failed on field: ${prismaError.meta?.field_name || 'relation'}`;
      } else {
        this.logger.error('Unhandled database exception');
      }
    } else if (exception instanceof Error) {
      this.logger.error('Unhandled application exception');
    }

    const errorResponse = {
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).send(errorResponse);
  }
}
