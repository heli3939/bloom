import { useCallback, useEffect, useState } from 'react'
import {
  addFriend,
  completeDailyTask,
  createTree,
  getActiveTree,
  listDailyTasks,
  listFriends,
} from '../services/api'

export function useDailyTasks(currentUser) {
  const [tree, setTree] = useState(null)
  const [dailyTasks, setDailyTasks] = useState([])
  const [friends, setFriends] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!currentUser) return
    setError('')
    const [activeTree, friendList] = await Promise.all([getActiveTree(), listFriends()])
    setTree(activeTree)
    setFriends(friendList)
    if (activeTree) {
      setDailyTasks(await listDailyTasks(activeTree.id))
    } else {
      setDailyTasks([])
    }
  }, [currentUser])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        await refresh()
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [refresh])

  async function submitCurrentUserPhoto(task, photo) {
    const data = await completeDailyTask(task.id, photo.previewUrl)
    setDailyTasks(data.dailyTasks)
    setTree(await getActiveTree())
  }

  async function startNewTree(referencePhoto, friendId) {
    const created = await createTree({
      friendId,
      referencePhotoUrl: referencePhoto.previewUrl,
    })
    setTree(created)
    setDailyTasks(await listDailyTasks(created.id))
  }

  async function connectFriend(username) {
    const friend = await addFriend(username)
    setFriends((current) =>
      current.some((item) => item.id === friend.id) ? current : [...current, friend],
    )
    return friend
  }

  const hasActiveTree = Boolean(tree)
  const treeProgress = tree?.growth ?? 0
  const isTreeCompleted = tree?.status === 'completed' || treeProgress >= 100

  return {
    loading,
    error,
    setError,
    friends,
    hasActiveTree,
    treeProgress,
    isTreeCompleted,
    dailyTasks,
    submitCurrentUserPhoto,
    startNewTree,
    connectFriend,
    refresh,
  }
}
