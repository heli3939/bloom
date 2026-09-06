const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''
const TOKEN_KEY = 'bloom_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function authHeader() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...authHeader(),
    ...options.headers,
  }
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (response.status === 401) {
    setToken(null)
  }
  if (response.status === 404) {
    const error = new Error('Not found')
    error.status = 404
    throw error
  }
  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`
    try {
      const body = await response.json()
      if (typeof body.detail === 'string') detail = body.detail
    } catch {
      /* ignore parse errors */
    }
    const error = new Error(detail)
    error.status = response.status
    throw error
  }
  if (response.status === 204) return null
  return response.json()
}

export async function getHealth() {
  return request('/api/health')
}

export async function register(payload) {
  const data = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  setToken(data.access_token)
  return data
}

export async function login(payload) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  setToken(data.access_token)
  return data
}

export async function me() {
  return request('/api/auth/me')
}

export function logout() {
  setToken(null)
}

export async function listFriends() {
  const data = await request('/api/friends')
  return data.friends ?? []
}

export async function addFriend(username) {
  return request('/api/friends', {
    method: 'POST',
    body: JSON.stringify({ username }),
  })
}

export async function createTree(payload) {
  return request('/api/trees', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getActiveTree() {
  try {
    return await request('/api/trees/active')
  } catch (error) {
    if (error.status === 404) return null
    throw error
  }
}

export async function listDailyTasks(treeId) {
  return request(`/api/trees/${treeId}/daily-tasks`)
}

export async function completeDailyTask(dailyTaskId, photoUrl) {
  return request(`/api/daily-tasks/${dailyTaskId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ photoUrl }),
  })
}
