const TOKEN_KEY = 'bloom_token'
const DEV_MODE_KEY = 'bloom_dev_mode'

function setBloomDevMode(enabled) {
  localStorage.setItem(DEV_MODE_KEY, String(enabled))
}

function saveSession(data) {
  if (data && data.access_token) {
    localStorage.setItem(TOKEN_KEY, data.access_token)
  }
  return data
}

async function bloomRequest(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  let body = {}
  try {
    body = await response.json()
  } catch {
    body = {}
  }

  if (!response.ok) {
    const detail = typeof body.detail === 'string' ? body.detail : `Request failed (${response.status})`
    throw new Error(detail)
  }
  return body
}

function contactToEmail(contact) {
  const value = contact.trim()
  if (value.includes('@')) return value.toLowerCase()
  const digits = value.replace(/\D/g, '')
  return `${digits || 'user'}@phone.bloom.app`
}

function goToGarden() {
  window.location.href = '/'
}
