function TaskCard({ task, isCompleted, onComplete }) {
  return (
    <article className="task-card">
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <p>Tree growth: +{task.growthValue}%</p>
      <button
        type="button"
        onClick={() => onComplete(task)}
        disabled={isCompleted}
      >
        {isCompleted ? 'Completed' : 'Complete task'}
      </button>
    </article>
  )
}

export default TaskCard
