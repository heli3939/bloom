import { useCallback, useEffect, useState } from 'react'
import {
  bootstrapDemo,
  createTree,
  getDailyTasks,
  getTree,
  submitDailyTask,
} from '../services/api'

const FRIEND_PLACEHOLDER_PHOTO =
  'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

export function useDailyTasks() {
  const [context, setContext] = useState(null)
  const [tree, setTree] = useState(null)
  const [tasks, setTasks] = useState([])
  const [photosByTask, setPhotosByTask] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTree = useCallback(async (treeId, demoContext) => {
    const [loadedTree, loadedTasks] = await Promise.all([
      getTree(treeId),
      getDailyTasks(treeId),
    ])
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
  }, [])

  useEffect(() => {
    let cancelled = false

    async function initialise() {
      try {
        const demoContext = await bootstrapDemo()
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

  async function runRequest(action) {
    setError('')
    try {
      await action()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function startNewTree(referencePhoto) {
    if (!context) return
    await runRequest(async () => {
      const createdTree = await createTree({
        userIds: [context.currentUserId, context.friendUserId],
        speciesId: context.speciesId,
        referencePhotoUrl: referencePhoto.previewUrl,
      })
      setTree(createdTree)
      setPhotosByTask({})
      setTasks(await getDailyTasks(createdTree._id))
    })
  }

  async function submitCurrentUserPhoto(task, photo) {
    if (!context || !tree) return
    await runRequest(async () => {
      await submitDailyTask(task.id, {
        userId: context.currentUserId,
        photoUrl: photo.previewUrl,
      })
      setPhotosByTask((current) => ({ ...current, [task.id]: photo }))
      await loadTree(tree._id, context)
    })
  }

  async function simulateFriendSubmission(task) {
    if (!context || !tree) return
    await runRequest(async () => {
      await submitDailyTask(task.id, {
        userId: context.friendUserId,
        photoUrl: FRIEND_PLACEHOLDER_PHOTO,
      })
      await loadTree(tree._id, context)
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
    completedTaskIds: tasks.filter((task) => task.completed).map((task) => task.id),
    submissionsByTask,
    tasks,
    isLoading,
    error,
    submitCurrentUserPhoto,
    simulateFriendSubmission,
    startNewTree,
  }
}
