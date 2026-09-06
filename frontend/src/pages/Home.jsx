import { useState } from 'react'
import NewTreeForm from '../components/NewTreeForm'
import TaskCard from '../components/TaskCard'
import TreeProgress from '../components/TreeProgress'
import { mockTasks } from '../data/mockTasks'
import { useDailyTasks } from '../hooks/useDailyTasks'

function Home() {
  const [isCreatingNewTree, setIsCreatingNewTree] = useState(false)
  const {
    hasActiveTree,
    treeProgress,
    isTreeCompleted,
    completedTaskIds,
    submissionsByTask,
    submitCurrentUserPhoto,
    simulateFriendSubmission,
    startNewTree,
  } = useDailyTasks()

  function handleNewTreeConfirmation(referencePhoto) {
    startNewTree(referencePhoto)
    setIsCreatingNewTree(false)
  }

  if (!hasActiveTree) {
    return (
      <main>
        <header>
          <h1>Bloom</h1>
          <p>You and your friend are connected. Start your first shared tree.</p>
        </header>
        <NewTreeForm onConfirm={handleNewTreeConfirmation} />
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
          <h2 id="daily-tasks-heading">Today&apos;s tasks</h2>
          <div className="task-list">
            {mockTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                submission={submissionsByTask[task.id] ?? {
                  currentUser: null,
                  friendSubmitted: false,
                }}
                isCompleted={completedTaskIds.includes(task.id)}
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
