import moneyBag from '../assets/figma/money-bag.svg'
import treeBloom from '../assets/figma/tree-100.png'
import treeSprout from '../assets/figma/tree-25.png'
import treeSmall from '../assets/figma/tree-50.png'
import treeMature from '../assets/figma/tree-75.png'
import treeSeed from '../assets/figma/tree-seed.png'
import { getTreeStage, treeStages } from '../data/treeStages'

const stageImages = [treeSeed, treeSprout, treeSmall, treeMature, treeBloom]

function TreeProgress({ progress }) {
  const currentStage = getTreeStage(progress)
  const stageIndex = treeStages.findIndex((stage) => stage.name === currentStage.name)
  return (
    <section className="garden-panel" aria-labelledby="tree-progress-heading">
      <h2 className="sr-only" id="tree-progress-heading">Tree progress</h2>
      <div className="progress-copy">
        <strong>{progress}%</strong>
      </div>
      <progress value={progress} max="100" aria-label={`Tree growth: ${progress}%`}>{progress}%</progress>
      <span className="coin-pill"><img src={moneyBag} alt="" /><span className="sr-only">Garden currency</span></span>
      <div className={`tree-art tree-stage-${currentStage.minProgress}`} aria-label={`Current tree stage: ${currentStage.name}`}>
        <img src={stageImages[stageIndex]} alt={`Bloom tree at ${currentStage.minProgress}% growth`} />
      </div>
      <p className="stage-name sr-only">{currentStage.name}</p>
      <ol className="tree-stages sr-only" aria-label="Tree growth stages">
        {treeStages.map((stage) => <li key={stage.name}>{stage.name}</li>)}
      </ol>
    </section>
  )
}

export default TreeProgress
