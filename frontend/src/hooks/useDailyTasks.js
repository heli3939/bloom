import { useReducer } from 'react'

const initialState = {
  treeProgress: 0,
  completedTaskIds: [],
}

function dailyTasksReducer(state, action) {
  if (action.type !== 'complete-task') return state

  const { id, growthValue } = action.task

  if (state.completedTaskIds.includes(id)) return state

  return {
    treeProgress: Math.min(100, state.treeProgress + growthValue),
    completedTaskIds: [...state.completedTaskIds, id],
  }
}

export function useDailyTasks() {
  const [state, dispatch] = useReducer(dailyTasksReducer, initialState)

  function completeTask(task) {
    dispatch({ type: 'complete-task', task })
  }

  return { ...state, completeTask }
}
