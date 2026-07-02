import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Response } from 'express'
import { map, Observable } from 'rxjs'
import { HttpResponse } from '../helpers/http'

function isHttpResponse(value: unknown): value is HttpResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'statusCode' in value &&
    'data' in value &&
    typeof (value as HttpResponse).statusCode === 'number'
  )
}

@Injectable()
export class HttpResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value) => {
        if (!isHttpResponse(value)) {
          return value
        }
        const response = context.switchToHttp().getResponse<Response>()
        response.status(value.statusCode)
        return value.data
      }),
    )
  }
}
