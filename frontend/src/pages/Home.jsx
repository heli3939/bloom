import TaskCard from '../components/TaskCard'
import TreeProgress from '../components/TreeProgress'
import { mockTasks } from '../data/mockTasks'
import { useDailyTasks } from '../hooks/useDailyTasks'

function Home() {
  const {
    treeProgress,
    completedTaskIds,
    submissionsByTask,
    submitCurrentUserPhoto,
    simulateFriendSubmission,
  } = useDailyTasks()

  return (
    <main>
      <header>
        <h1>Bloom</h1>
        <p>Complete today&apos;s activities to help your tree grow.</p>
      </header>

      <TreeProgress progress={treeProgress} />

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
    </main>
  )
}

export default Home
