import { HttpException, HttpStatus } from '@nestjs/common';

export abstract class AppError extends Error {
  abstract toHTTPResponse(): HttpException;
}

export class AppErrorBadRequest extends AppError {
  toHTTPResponse() {
    return new HttpException(this.message, HttpStatus.BAD_REQUEST);
  }
}

export class AppErrorNotFound extends AppError {
  toHTTPResponse() {
    return new HttpException(this.message, HttpStatus.NOT_FOUND);
  }
}

export class AppErrorConflict extends AppError {
  toHTTPResponse() {
    return new HttpException(this.message, HttpStatus.CONFLICT);
  }
}
