import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AppError } from './app.error';

@Catch(Error)
export class AppErrorHandler implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    let message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Erro inesperado ocorreu';

    if (exception instanceof AppError) {
      const httpError = exception.toHTTPResponse();
      status = httpError.getStatus();
      message = httpError.message;
    }

    response.status(status).json({
      status,
      message,
    });
  }
}
