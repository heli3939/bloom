import { getTreeStage, treeStages } from '../data/treeStages'

function TreeProgress({ progress }) {
  const currentStage = getTreeStage(progress)

  return (
    <section aria-labelledby="tree-progress-heading">
      <h2 id="tree-progress-heading">Tree progress</h2>
      <div className="tree-placeholder" aria-label={`Current tree stage: ${currentStage.name}`}>
        <p>Tree image placeholder</p>
        <strong>{currentStage.name}</strong>
      </div>
      <p>{progress}% grown</p>
      <progress value={progress} max="100" aria-label={`Tree growth: ${progress}%`}>
        {progress}%
      </progress>
      <ol className="tree-stages" aria-label="Tree growth stages">
        {treeStages.map((stage) => (
          <li key={stage.name} aria-current={stage.name === currentStage.name ? 'step' : undefined}>
            {stage.name} ({stage.minProgress}%)
          </li>
        ))}
      </ol>
    </section>
  )
}

export default TreeProgress
