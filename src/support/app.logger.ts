import { LoggerService } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

export class AppLogger implements LoggerService {
  private static level: number;
  private readonly LOG_LEVEL: Record<string, number> = {
    trace: 0,
    debug: 1,
    log: 2,
    warn: 3,
    error: 4,
    fatal: 5,
  };
  constructor(
    @InjectPinoLogger()
    private readonly logger: PinoLogger,
  ) {
    if (!AppLogger.level) {
      AppLogger.level = this.LOG_LEVEL[process.env.LOG_LEVEL ?? 'log'];
    }
  }

  verbose(message: string, context?: string) {
    if (AppLogger.level > this.LOG_LEVEL.trace) {
      return;
    }
    this.logger.trace({ context }, message);
  }

  debug(message: string, context?: string) {
    if (AppLogger.level > this.LOG_LEVEL.debug) {
      return;
    }
    this.logger.debug({ context }, message);
  }

  log(message: string, context?: string) {
    if (AppLogger.level > this.LOG_LEVEL.log) {
      return;
    }
    this.logger.info({ context }, message);
  }

  warn(message: string, context?: string) {
    if (AppLogger.level > this.LOG_LEVEL.warn) {
      return;
    }
    this.logger.warn({ context }, message);
  }

  error(message: string, trace?: string, context?: string) {
    if (AppLogger.level > this.LOG_LEVEL.error) {
      return;
    }
    this.logger.error({ context, trace }, message);
  }

  fatal(message: string, trace?: string, context?: string) {
    if (AppLogger.level > this.LOG_LEVEL.fatal) {
      return;
    }
    this.logger.fatal({ context, trace }, message);
  }
}
