import { useState } from 'react'
import NewTreeForm from '../components/NewTreeForm'
import TaskCard from '../components/TaskCard'
import TreeProgress from '../components/TreeProgress'
import { useDailyTasks } from '../hooks/useDailyTasks'

function Home() {
  const [isCreatingNewTree, setIsCreatingNewTree] = useState(false)
  const {
    hasActiveTree,
    treeProgress,
    isTreeCompleted,
    isTreeDead,
    completedTaskIds,
    submissionsByTask,
    submitCurrentUserPhoto,
    simulateFriendSubmission,
    startNewTree,
    tasks,
    dayNumber,
    isLoading,
    error,
    isDemoMode,
    simulateNextDay,
  } = useDailyTasks()
  const completedToday = completedTaskIds.length
  const isDailyLimitReached = completedToday >= 3

  function handleNewTreeConfirmation(referencePhoto) {
    startNewTree(referencePhoto)
    setIsCreatingNewTree(false)
  }

  if (isLoading) {
    return <main><p>Connecting to Bloom API…</p></main>
  }

  if (!hasActiveTree) {
    return (
      <main>
        <header>
          <h1>Bloom</h1>
          <p>You and your friend are connected. Start your first shared tree.</p>
        </header>
        {error && <p role="alert">{error}</p>}
        <NewTreeForm onConfirm={handleNewTreeConfirmation} />
      </main>
    )
  }

  if (isTreeDead) {
    return (
      <main>
        <header>
          <h1>Bloom</h1>
        </header>
        <section aria-labelledby="tree-dead-heading">
          <h2 id="tree-dead-heading">Your tree has died</h2>
          <p>No shared tasks were completed for 15 days.</p>
          <p>Plant a new tree together and begin again from 0%.</p>
          {error && <p role="alert">{error}</p>}
          <NewTreeForm onConfirm={handleNewTreeConfirmation} />
        </section>
      </main>
    )
  }

  return (
    <main>
      <header>
        <h1>Bloom</h1>
        <p>Complete today&apos;s activities to help your tree grow.</p>
      </header>

      <TreeProgress progress={treeProgress} />
      {error && <p role="alert">{error}</p>}

      {isTreeCompleted ? (
        <section aria-labelledby="tree-complete-heading">
          <h2 id="tree-complete-heading">Your tree has fully bloomed!</h2>
          <p>You and your friend completed this tree together.</p>
          {isCreatingNewTree ? (
            <NewTreeForm onConfirm={handleNewTreeConfirmation} />
          ) : (
            <button type="button" onClick={() => setIsCreatingNewTree(true)}>
              Start a new tree
            </button>
          )}
        </section>
      ) : (
        <section aria-labelledby="daily-tasks-heading">
          <h2 id="daily-tasks-heading">Today&apos;s tasks — Day {dayNumber}</h2>
          <p><strong>{completedToday}/3 completed</strong></p>
          <p>You and your friend can complete at most three shared tasks each day.</p>
          {isDailyLimitReached && (
            <p role="status">
              Today&apos;s task limit has been reached. Come back tomorrow for five fresh tasks.
            </p>
          )}
          {isDemoMode && (
            <button type="button" onClick={simulateNextDay}>
              Simulate next day
            </button>
          )}
          <div className="task-list">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                submission={submissionsByTask[task.id] ?? {
                  currentUser: null,
                  friendSubmitted: false,
                }}
                isCompleted={completedTaskIds.includes(task.id)}
                isDailyLimitReached={isDailyLimitReached}
                canSimulateFriend={isDemoMode}
                onSubmitPhoto={submitCurrentUserPhoto}
                onSimulateFriendSubmission={simulateFriendSubmission}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

export default Home
