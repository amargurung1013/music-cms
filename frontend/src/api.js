const browserHost = typeof window === 'undefined' ? 'localhost' : window.location.hostname
const browserProtocol = typeof window === 'undefined' ? 'http:' : window.location.protocol
const API_URL = import.meta.env.VITE_API_URL ?? `${browserProtocol}//${browserHost}:8000`

export async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail ?? 'Something went wrong.')
  }
  if (response.status === 204) return null
  return response.json()
}

export function patch(path, body) {
  return api(path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

export function remove(path) {
  return api(path, { method: 'DELETE' })
}

export function post(path, body) {
  return api(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
