import { BadRequest, ForbiddenError, ServerError, UnauthorizedError, NotFoundError, SendMailError, ConflictError } from '../errors/http'

export type HttpResponse<T = any> = {
  statusCode: number
  data: T
}

export const ok = <T = any> (data: T): HttpResponse<T> => ({
  statusCode: 200,
  data
})

export const created = <T = any>(data: T): HttpResponse<T> => ({
  statusCode: 201,
  data
})

export const noContent = (): HttpResponse => ({
  statusCode: 204,
  data: null
})

export const found = <T = any>(data: T): HttpResponse<T> => ({
  statusCode: 200,
  data
})

export const badRequest = (message:  string = 'Bad Request'): HttpResponse<Error> => ({
  statusCode: 400,
  data: (new BadRequest(message)).error
})

export const unauthorized = (): HttpResponse<Error> => ({
  statusCode: 401,
  data: (new UnauthorizedError()).error
})

export const forbidden = (): HttpResponse<Error> => ({
  statusCode: 403,
  data: (new ForbiddenError()).error
})

export const notFound = (message:  string = 'Not Found'): HttpResponse<Error> => ({
  statusCode: 404,
  data: (new NotFoundError(message)).error
})

export const conflictError = (type: string): HttpResponse<Error> => ({
  statusCode: 409,
  data: (new ConflictError(type)).error
})

export const serverError = (error: Error): HttpResponse<Error> => ({
  statusCode: 500,
  data: (new ServerError(error)).error
})

export const sendMailFailure = (): HttpResponse<Error> => ({
  statusCode: 502,
  data: (new SendMailError()).error
})

export const unprocessableEntity = (type: string): HttpResponse<Error> => ({
  statusCode: 422,
  data: (new ConflictError(type)).error
})