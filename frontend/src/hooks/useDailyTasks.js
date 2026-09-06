import { useCallback, useEffect, useState } from 'react'
import {
  advanceDemoDay,
  createTree,
  getDailyTasks,
  getCompletedTrees,
  getSession,
  getTree,
  submitDailyTask,
  isDemoModeEnabled,
} from '../services/api'

const FRIEND_PLACEHOLDER_PHOTO =
  'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

function calendarDayNumber(tree, tasks) {
  if (!tree || !tasks[0]) return 1
  const started = new Date(tree.createdAt)
  const taskDate = new Date(tasks[0].taskDate)
  const startedDay = Date.UTC(started.getUTCFullYear(), started.getUTCMonth(), started.getUTCDate())
  const currentDay = Date.UTC(taskDate.getUTCFullYear(), taskDate.getUTCMonth(), taskDate.getUTCDate())
  return Math.max(1, Math.floor((currentDay - startedDay) / 86_400_000) + 1)
}

export function useDailyTasks() {
  const [context, setContext] = useState(null)
  const [tree, setTree] = useState(null)
  const [tasks, setTasks] = useState([])
  const [photosByTask, setPhotosByTask] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [completedTrees, setCompletedTrees] = useState([])

  const loadTree = useCallback(async (treeId, demoContext) => {
    const loadedTree = await getTree(treeId)
    const loadedTasks = loadedTree.status === 'active' ? await getDailyTasks(treeId) : []
    setTree(loadedTree)
    setTasks(loadedTasks)
    setPhotosByTask((current) => {
      const restored = { ...current }
      for (const task of loadedTasks) {
        if (task.submittedUserIds.includes(demoContext.currentUserId)) {
          restored[task.id] ??= { name: 'Submitted photo', previewUrl: null }
        }
      }
      return restored
    })
    return loadedTree
  }, [])

  const treeId = tree?._id ?? tree?.id

  useEffect(() => {
    if (!context || !treeId || tree.status !== 'active') return
    const session = context
    const timer = window.setInterval(() => {
      loadTree(treeId, session).catch(() => {})
    }, 4000)
    return () => window.clearInterval(timer)
  }, [context, treeId, tree?.status, loadTree])

  useEffect(() => {
    let cancelled = false

    async function initialise() {
      try {
        const demoContext = await getSession()
        if (cancelled) return
        setContext(demoContext)
        if (demoContext.activeTreeId) {
          await loadTree(demoContext.activeTreeId, demoContext)
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError.message)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    initialise()
    return () => {
      cancelled = true
    }
  }, [loadTree])

  useEffect(() => {
    if (!tree || tree.status !== 'active' || !context) return
    const treeId = tree._id
    const intervalId = window.setInterval(() => {
      if (document.hidden) return
      loadTree(treeId, context).catch(() => {})
    }, 5000)
    return () => window.clearInterval(intervalId)
  }, [tree, context, loadTree])

  async function runRequest(action) {
    setError('')
    try {
      return await action()
    } catch (requestError) {
      setError(requestError.message)
      return undefined
    }
  }

  async function startNewTree(referencePhoto) {
    if (!context) return
    return runRequest(async () => {
      const createdTree = await createTree({
        userIds: [context.currentUserId, context.friendUserId],
        speciesId: context.speciesId,
        referencePhotoUrl: referencePhoto.previewUrl,
      })
      const id = createdTree._id ?? createdTree.id
      setTree({ ...createdTree, _id: id, id })
      setPhotosByTask({})
      setTasks(await getDailyTasks(id))
      return createdTree
    })
  }

  async function submitCurrentUserPhoto(task, photo) {
    if (!context || !tree) return
    return runRequest(async () => {
      await submitDailyTask(task.id, {
        userId: context.currentUserId,
        photoUrl: photo.previewUrl,
      })
      setPhotosByTask((current) => ({ ...current, [task.id]: photo }))
      return loadTree(tree._id ?? tree.id, context)
    })
  }

  async function simulateFriendSubmission(task) {
    if (!context || !tree) return
    return runRequest(async () => {
      await submitDailyTask(task.id, {
        userId: context.friendUserId,
        photoUrl: FRIEND_PLACEHOLDER_PHOTO,
      })
      return loadTree(tree._id ?? tree.id, context)
    })
  }

  async function simulateNextDay() {
    await runRequest(async () => {
      await advanceDemoDay()
      setPhotosByTask({})
      await loadTree(tree._id ?? tree.id, context)
    })
  }

  async function loadCompletedTrees() {
    if (!context) return
    await runRequest(async () => {
      setCompletedTrees(await getCompletedTrees(context.currentUserId, context.friendUserId))
    })
  }

  const submissionsByTask = Object.fromEntries(
    tasks.map((task) => [
      task.id,
      {
        currentUser: task.submittedUserIds.includes(context?.currentUserId)
          ? photosByTask[task.id] ?? { name: 'Submitted photo', previewUrl: null }
          : null,
        friendSubmitted: task.submittedUserIds.includes(context?.friendUserId),
      },
    ]),
  )

  return {
    hasActiveTree: Boolean(tree),
    treeProgress: tree?.growth ?? 0,
    isTreeCompleted: tree?.status === 'completed',
    isTreeDead: tree?.status === 'dead',
    completedTaskIds: tasks.filter((task) => task.completed).map((task) => task.id),
    submissionsByTask,
    tasks,
    dayNumber: calendarDayNumber(tree, tasks),
    isLoading,
    error,
    completedTrees,
    isDemoMode: isDemoModeEnabled(),
    canSimulateFriend: isDemoModeEnabled() || Boolean(context?.friendIsDemo),
    submitCurrentUserPhoto,
    simulateFriendSubmission,
    startNewTree,
    simulateNextDay,
    loadCompletedTrees,
  }
}
