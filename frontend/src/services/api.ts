const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export interface IApiError {
  name?: string
  message: string | string[]
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: IApiError,
  ) {
    super(Array.isArray(body.message) ? body.message.join(', ') : body.message)
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('momentos.token')

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }))
    throw new ApiError(response.status, body)
  }

  if (response.status === 204) {
    return undefined as T
  }
  return response.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
}
