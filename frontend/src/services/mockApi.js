import { mockTasks } from '../data/mockTasks'

const STORAGE_KEY = 'bloom-demo-api'
const context = {
  currentUserId: 'demo-current-user',
  friendUserId: 'demo-friend-user',
  speciesId: 'demo-tree-species',
}

function readState() {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved ? JSON.parse(saved) : { tree: null, date: null, tasks: [], submissions: {} }
}

function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function ensureDailyTasks(state) {
  if (state.date === today() && state.tasks.length === 5) return state
  const taskDate = `${today()}T00:00:00.000Z`
  return {
    ...state,
    date: today(),
    submissions: {},
    tasks: mockTasks.slice(0, 5).map((task) => ({
      ...task,
      _id: `daily-${today()}-${task.id}`,
      treeId: state.tree?._id,
      taskId: task.id,
      taskDate,
      completed: false,
      submissionCount: 0,
      submittedUserIds: [],
    })),
  }
}

export async function bootstrapDemo() {
  const state = readState()
  return { ...context, activeTreeId: state.tree?.status === 'active' ? state.tree._id : null }
}

export async function createTree({ userIds, speciesId }) {
  const now = new Date().toISOString()
  const tree = {
    _id: crypto.randomUUID(),
    userIds,
    speciesId,
    referencePhotoUrl: 'browser-demo-photo',
    growth: 0,
    status: 'active',
    lastActivityAt: now,
    createdAt: now,
    completedAt: null,
  }
  writeState({ tree, date: null, tasks: [], submissions: {} })
  return tree
}

export async function getTree(treeId) {
  const state = readState()
  if (!state.tree || state.tree._id !== treeId) throw new Error('Demo tree was not found')
  return state.tree
}

export async function getDailyTasks(treeId) {
  let state = readState()
  if (!state.tree || state.tree._id !== treeId) throw new Error('Demo tree was not found')
  state = ensureDailyTasks(state)
  writeState(state)
  return state.tasks.map((task) => ({ ...task, id: task._id }))
}

export async function submitDailyTask(dailyTaskId, { userId, photoUrl }) {
  const state = ensureDailyTasks(readState())
  const task = state.tasks.find((item) => item._id === dailyTaskId)
  if (!task) throw new Error('Demo daily task was not found')
  if (state.tasks.filter((item) => item.completed).length >= 3) {
    throw new Error('Three tasks have already been completed today')
  }

  const submittedUsers = state.submissions[dailyTaskId] ?? []
  if (submittedUsers.includes(userId)) throw new Error('This user already submitted this task')
  state.submissions[dailyTaskId] = [...submittedUsers, userId]
  task.submittedUserIds = state.submissions[dailyTaskId]
  task.submissionCount = task.submittedUserIds.length

  let taskCompleted = false
  if (task.submissionCount === 2) {
    task.completed = true
    taskCompleted = true
    state.tree.growth = Math.min(100, state.tree.growth + task.growthValue)
    state.tree.lastActivityAt = new Date().toISOString()
    if (state.tree.growth === 100) {
      state.tree.status = 'completed'
      state.tree.completedAt = state.tree.lastActivityAt
    }
  }
  writeState(state)

  return {
    _id: crypto.randomUUID(),
    dailyTaskId,
    treeId: state.tree._id,
    userId,
    photoUrl,
    completedAt: new Date().toISOString(),
    taskCompleted,
    treeGrowth: state.tree.growth,
  }
}
