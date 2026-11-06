import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'
import { I18nService } from 'nestjs-i18n'

@Catch(HttpException)
export class I18nExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status = exception.getStatus ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const exceptionResponse: any = exception.getResponse?.() ?? {}

    // Attempt to translate message if it's a translation key (e.g., 'errors.SOMETHING')
    let message = exceptionResponse?.message || exception.message

    try {
      if (typeof message === 'string' && /\w+\./.test(message)) {
        // translate using i18n; resolvers already infer language
        const translated = await this.i18n.t(message)
        if (translated && translated !== message) {
          message = translated
        }
      }
    } catch (_) {
      // if translation fails, keep original message
    }

    const payload = {
      statusCode: status,
      message,
      error: exceptionResponse?.error || HttpStatus[status],
      path: request.url,
      timestamp: new Date().toISOString(),
    }

    response.status(status).json(payload)
  }
}
