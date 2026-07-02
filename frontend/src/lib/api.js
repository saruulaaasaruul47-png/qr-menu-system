const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'
const REQUEST_TIMEOUT_MS = 30000

export class ApiError extends Error {
  constructor(message, { status = 0, details = null, path = '' } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
    this.path = path
  }
}

export function getToken() {
  return localStorage.getItem('accessToken') || ''
}

export function clearSession() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('restaurantId')
}

export async function api(path, options = {}) {
  return request(path, options, true)
}

async function request(path, options = {}, allowRefresh = true) {
  const { timeoutMs = REQUEST_TIMEOUT_MS, signal, ...fetchOptions } = options
  const headers = { ...(options.headers || {}) }
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`

  const controller = new AbortController()
  const timeout = signal ? null : window.setTimeout(() => controller.abort(), timeoutMs)

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers,
      signal: signal || controller.signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('API request timed out. Check the API gateway and service health.', { path })
    }
    throw new ApiError(error.message || 'Network request failed. Check the API gateway URL.', { path })
  } finally {
    if (timeout) window.clearTimeout(timeout)
  }

  const data = await response.json().catch(() => ({}))
  if (response.status === 401 && allowRefresh && localStorage.getItem('refreshToken')) {
    try {
      const refreshed = await request('/auth/refresh-token', { method: 'POST', body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') }) }, false)
      localStorage.setItem('accessToken', refreshed.accessToken)
      if (refreshed.refreshToken) localStorage.setItem('refreshToken', refreshed.refreshToken)
      return request(path, options, false)
    } catch (error) {
      if (error.status === 401 || error.status === 403) clearSession()
    }
  }
  if (!response.ok) {
    throw new ApiError(data.message || `Request failed: ${response.status}`, {
      status: response.status,
      details: data.details,
      path,
    })
  }
  return data.data
}
