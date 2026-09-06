import * as mockApi from './mockApi'

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''
const DEFAULT_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
const DEMO_MODE_KEY = 'bloom_dev_mode'
const TOKEN_KEY = 'bloom_token'

export function isDemoModeEnabled() {
  const override = localStorage.getItem(DEMO_MODE_KEY)
  return override === null ? DEFAULT_DEMO_MODE : override === 'true'
}

export function setDemoModeEnabled(enabled) {
  localStorage.setItem(DEMO_MODE_KEY, String(enabled))
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function authHeaders() {
  const token = getStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getHealth() {
  return request('/api/health')
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  })
  if (response.status === 401 && !isDemoModeEnabled()) {
    localStorage.removeItem(TOKEN_KEY)
    window.location.replace('/auth/login.html')
    throw new Error('Please log in')
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail ?? `API request failed with status ${response.status}`)
  }
  return response.json()
}

export function getSession() {
  if (isDemoModeEnabled()) return mockApi.bootstrapDemo()
  return request('/api/session')
}

export function bootstrapDemo() {
  if (isDemoModeEnabled()) return mockApi.bootstrapDemo()
  return request('/api/dev/bootstrap', { method: 'POST' })
}

export function createTree({ userIds, speciesId, referencePhotoUrl }) {
  if (isDemoModeEnabled()) return mockApi.createTree({ userIds, speciesId, referencePhotoUrl })
  return request('/api/trees', {
    method: 'POST',
    body: JSON.stringify({ userIds, speciesId, referencePhotoUrl }),
  })
}

export function getTree(treeId) {
  if (isDemoModeEnabled()) return mockApi.getTree(treeId)
  return request(`/api/trees/${treeId}`)
}

export function getCompletedTrees(userId, friendId) {
  if (isDemoModeEnabled()) return mockApi.getCompletedTrees()
  const query = new URLSearchParams({ userId, friendId })
  return request(`/api/trees?${query}`)
}

export async function getDailyTasks(treeId) {
  if (isDemoModeEnabled()) return mockApi.getDailyTasks(treeId)
  const tasks = await request(`/api/trees/${treeId}/daily-tasks`)
  return tasks.map((task) => ({ ...task, id: task._id }))
}

export function submitDailyTask(dailyTaskId, { userId, photoUrl }) {
  if (isDemoModeEnabled()) return mockApi.submitDailyTask(dailyTaskId, { userId, photoUrl })
  return request(`/api/tasks/daily/${dailyTaskId}/submissions`, {
    method: 'POST',
    body: JSON.stringify({ userId, photoUrl }),
  })
}

export function advanceDemoDay() {
  if (!isDemoModeEnabled()) throw new Error('Simulate next day is only available in demo mode')
  return mockApi.advanceDemoDay()
}
