import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { AuthRequest } from '../modules/auth/auth-request';

@Catch()
export class HttpErrorsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpErrors');
  catch(exception: unknown, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest<AuthRequest>();
    const response = host.switchToHttp().getResponse<Response>();
    const bodyParserError = exception instanceof Error && 'type' in exception &&
      ['entity.parse.failed', 'entity.too.large'].includes(String(exception.type));
    const status = exception instanceof HttpException ? exception.getStatus() : bodyParserError && 'status' in exception ? Number(exception.status) : 500;
    const payload = exception instanceof HttpException ? exception.getResponse() : null;
    const details = payload && typeof payload === 'object' ? payload as { code?: string; message?: string | string[] } : null;
    if (status >= 500) this.logger.error(JSON.stringify({ event: 'request.error', requestId: request.requestId, status, type: exception instanceof Error ? exception.name : 'UnknownError' }));
    response.status(status).json({ error: {
      code: details?.code || `HTTP_${status}`,
      message: status >= 500 ? 'Erro interno do servidor.' : details?.message || (typeof payload === 'string' ? payload : 'Falha na requisição.'),
      requestId: request.requestId,
    } });
  }
}
