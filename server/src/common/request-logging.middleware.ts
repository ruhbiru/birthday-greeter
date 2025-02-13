import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { omit } from 'lodash';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: any, res: any, next: () => void): any {
    const { httpVersion, headers, method, originalUrl, url, body, ip } = req;
    const secretProperties = ['password'];

    this.logger.debug(`${method} ${originalUrl}`, {
      req: {
        httpVersion,
        headers,
        method,
        originalUrl,
        url,
        body: omit(body, secretProperties),
        ip,
      },
    });
    // XXX do we need to add an `on('error'...)` here?
    res.once('finish', () => {
      const { statusCode, responseTime } = res;

      this.logger[statusCodeToLogLevel(statusCode)](
        `${method} ${originalUrl}`,
        {
          res: {
            statusCode,
            responseTime,
          },
        },
      );

      function statusCodeToLogLevel(statusCode) {
        if (statusCode < 400) {
          return 'log';
        } else if (statusCode < 500) {
          return 'warn';
        } else {
          return 'error';
        }
      }
    });
    next();
  }
}
