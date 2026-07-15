import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common'
import { Response } from 'express'
import { AppError } from '../errors/app-error'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../errors'

const STATUS_BY_ERROR = new Map<Function, number>([
  [UnauthorizedError, 401],
  [ForbiddenError, 403],
  [NotFoundError, 404],
  [ConflictError, 409],
])

@Catch()
export class AppErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>()

    if (exception instanceof HttpException) {
      return response.status(exception.getStatus()).json(exception.getResponse())
    }

    if (exception instanceof AppError) {
      return response
        .status(exception.statusCode)
        .json({ name: 'AppError', message: exception.message })
    }

    for (const [errorClass, status] of STATUS_BY_ERROR) {
      if (exception instanceof errorClass) {
        const shared = exception as Error & { error?: Error }
        const { name, message } = shared.error ?? shared
        return response.status(status).json({ name, message })
      }
    }

    console.error(exception)
    return response.status(500).json({ name: 'ServerError', message: 'Internal server error' })
  }
}
