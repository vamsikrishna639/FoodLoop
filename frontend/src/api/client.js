// The single HTTP client for the whole app. It:
//   1. adds the JWT to every request,
//   2. unwraps the backend's { success, message, data } envelope,
//   3. turns every failure into an ApiError with a readable message
//      (and per-field messages in `fieldErrors` for a 400),
//   4. calls the unauthorized handler (log out) when the server answers 401.
import { API_URL } from '../config';

/** A failed request, with a message that is safe to show to the user. */
export class ApiError extends Error {
  constructor(message, { status = null, fieldErrors = {} } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // HTTP status, or null when the server was unreachable
    this.fieldErrors = fieldErrors; // e.g. { email: 'Enter a valid email' }
  }
}

let token = null; // set by AuthContext after login, cleared on logout
let onUnauthorized = null; // set by AuthContext

export function setToken(value) {
  token = value;
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

const TIMEOUT_MS = 12000;

async function request(method, path, { body, query } = {}) {
  // Drop empty filters so the URL stays clean.
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  }
  const url = `${API_URL}${path}${params.size ? `?${params}` : ''}`;

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  // Give up after 12 seconds instead of waiting forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('The server took too long to answer. Please try again.');
    }
    // No network, server not running, CORS failure...
    throw new ApiError('Could not reach the FoodLoop server. Check that it is running.');
  } finally {
    clearTimeout(timer);
  }

  let json;
  try {
    json = await response.json();
  } catch {
    throw new ApiError('The server sent an unexpected reply.', { status: response.status });
  }

  if (response.ok && json.success) return json.data;

  // A 401 on a signed-in request means the session is no longer valid.
  // (A wrong password at login also answers 401, but no token is set then.)
  if (response.status === 401 && token && onUnauthorized) onUnauthorized();

  throw new ApiError(json.message || 'Something went wrong.', {
    status: response.status,
    fieldErrors: json.data?.errors || {},
  });
}

export const api = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body = {}) => request('POST', path, { body }),
  patch: (path, body = {}) => request('PATCH', path, { body }),
  delete: (path) => request('DELETE', path),
};
