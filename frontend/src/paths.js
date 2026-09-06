export const BASE_URL = import.meta.env.BASE_URL || '/'

export function withBase(path) {
  const trimmed = String(path).replace(/^\//, '')
  const base = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`
  return `${base}${trimmed}`
}
