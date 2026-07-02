export class ServerError extends Error {
  readonly error: Error
  constructor (error: Error = new Error('Server error')) {
    super(error?.message)
    this.error = {
      name: 'ServerError',
      message: error.message,
      stack: error?.stack
    }
  }
}

export class UnauthorizedError extends Error {
  readonly error: Error
  constructor () {
    super('Unauthorized')
    this.error = {
      name: 'UnauthorizedError',
      message: 'Unauthorized'
    }
  }
}

export class ForbiddenError extends Error {
  readonly error: Error
  constructor () {
    super('Access denied')
    this.error = {
      name: 'ForbiddenError',
      message: 'Access denied'
    }
  }
}
export class NotFoundError extends Error {
  readonly error: Error
  constructor (message: string = 'Not found') {
    super(message)
    this.error = {
      name: 'NotFoundError',
      message
    }
  }
}

export class SendMailError extends Error {
  readonly error: Error
  constructor () {
    super('Send mail failure')
    this.error = {
      name: 'SendMailError',
      message: 'Send mail failure'
    }
  }
}

export class ConflictError extends Error {
  readonly error: Error
  constructor (type: string) {
    super('Conflict failure')
    this.error = {
      name: 'ConflictError',
      message: `${type}`
    }
  }
}

export class BadRequest extends Error {
  readonly error: Error
  constructor (message: string = 'Bad Request') {
    super(message)
    this.error = {
      name: 'BadRequest',
      message
    }
  }
}