import { Injectable, Scope } from '@nestjs/common';
import * as winston from 'winston';
// @ts-ignore - winston-daily-rotate-file doesn't have separate types package
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger {
  private logger: winston.Logger;

  constructor() {
    const logDir = join(process.cwd(), 'logs');
    const env = process.env.NODE_ENV || 'development';

    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    );

    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} [${context || 'Application'}] ${level}: ${message} ${metaStr} ${trace ? '\n' + trace : ''}`;
      }),
    );

    const transports: winston.transport[] = [
      // Console transport
      new winston.transports.Console({
        format: consoleFormat,
      }),
    ];

    // File transports (only in production)
    if (env === 'production') {
      // Combined log file
      transports.push(
        new DailyRotateFile({
          filename: join(logDir, 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: logFormat,
        }),
      );

      // Error log file
      transports.push(
        new DailyRotateFile({
          filename: join(logDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
          format: logFormat,
        }),
      );
    }

    this.logger = winston.createLogger({
      level: env === 'production' ? 'info' : 'debug',
      transports,
      exitOnError: false,
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { context, trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  setContext(context: string) {
    this.logger.defaultMeta = { context };
  }
}
