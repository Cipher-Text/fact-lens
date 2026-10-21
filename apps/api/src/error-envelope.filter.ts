import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { ErrorEnvelope } from '@fact-lens/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class ErrorEnvelopeFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErrorEnvelopeFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const reply = http.getResponse<FastifyReply>();
    const request = http.getRequest<FastifyRequest>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : undefined;

    if (!(exception instanceof HttpException)) {
      this.logger.error({ requestId: request.id, err: exception instanceof Error ? exception.message : String(exception) });
    }

    const envelope: ErrorEnvelope = {
      error: {
        code: !(exception instanceof HttpException) ? 'internal_error' : HttpStatus[status]?.toLowerCase() ?? 'error',
        message: !(exception instanceof HttpException) ? 'Internal server error' : messageOf(body, exception),
        requestId: String(request.id),
        ...(exception instanceof HttpException && body && typeof body === 'object' ? { details: body } : {}),
      },
    };
    void reply.status(status).send(envelope);
  }
}

function messageOf(body: unknown, exception: unknown): string {
  if (typeof body === 'string') return body;
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as { message: unknown }).message;
    return Array.isArray(m) ? m.join('; ') : String(m);
  }
  return exception instanceof Error ? exception.message : 'Error';
}
