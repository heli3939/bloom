import { useReducer } from 'react'

const initialState = {
  treeProgress: 0,
  completedTaskIds: [],
  submissionsByTask: {},
}

function applySubmission(state, task, submission) {
  const taskSubmissions = {
    currentUser: null,
    friendSubmitted: false,
    ...state.submissionsByTask[task.id],
    ...submission,
  }

  const wasCompleted = state.completedTaskIds.includes(task.id)
  const isNowCompleted = Boolean(taskSubmissions.currentUser && taskSubmissions.friendSubmitted)

  return {
    treeProgress:
      isNowCompleted && !wasCompleted
        ? Math.min(100, state.treeProgress + task.growthValue)
        : state.treeProgress,
    completedTaskIds:
      isNowCompleted && !wasCompleted
        ? [...state.completedTaskIds, task.id]
        : state.completedTaskIds,
    submissionsByTask: {
      ...state.submissionsByTask,
      [task.id]: taskSubmissions,
    },
  }
}

function dailyTasksReducer(state, action) {
  const existingSubmission = state.submissionsByTask[action.task?.id]

  switch (action.type) {
    case 'submit-current-user-photo':
      if (existingSubmission?.currentUser) return state
      return applySubmission(state, action.task, { currentUser: action.photo })

    case 'simulate-friend-submission':
      if (existingSubmission?.friendSubmitted) return state
      return applySubmission(state, action.task, { friendSubmitted: true })

    default:
      return state
  }
}

export function useDailyTasks() {
  const [state, dispatch] = useReducer(dailyTasksReducer, initialState)

  function submitCurrentUserPhoto(task, photo) {
    dispatch({ type: 'submit-current-user-photo', task, photo })
  }

  function simulateFriendSubmission(task) {
    dispatch({ type: 'simulate-friend-submission', task })
  }

  return {
    ...state,
    submitCurrentUserPhoto,
    simulateFriendSubmission,
  }
}
