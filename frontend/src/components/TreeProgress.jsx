import moneyBag from '../assets/figma/money-bag.svg'
import treeBloom from '../assets/figma/tree-100.png'
import treeDead from '../assets/figma/tree-die.png'
import treeSprout from '../assets/figma/tree-25.png'
import treeSmall from '../assets/figma/tree-50.png'
import treeMature from '../assets/figma/tree-75.png'
import treeSeed from '../assets/figma/tree-seed.png'
import { getTreeStage, treeStages } from '../data/treeStages'

const stageImages = [treeSeed, treeSprout, treeSmall, treeMature, treeBloom]

function TreeProgress({ progress, isDead = false }) {
  const currentStage = getTreeStage(progress)
  const stageIndex = treeStages.findIndex((stage) => stage.name === currentStage.name)
  const image = isDead ? treeDead : stageImages[stageIndex]
  const stageClass = isDead ? 100 : currentStage.minProgress
  const stageName = isDead ? 'Inactive tree' : currentStage.name
  return (
    <section className="garden-panel" aria-labelledby="tree-progress-heading">
      <h2 className="sr-only" id="tree-progress-heading">Tree progress</h2>
      <div className="progress-copy">
        <strong>{progress}%</strong>
      </div>
      <progress value={progress} max="100" aria-label={`Tree growth: ${progress}%`}>{progress}%</progress>
      <span className="coin-pill"><img src={moneyBag} alt="" /><span className="sr-only">Garden currency</span></span>
      <div className={`tree-art tree-stage-${stageClass}`} aria-label={`Current tree stage: ${stageName}`}>
        <img src={image} alt={isDead ? 'Bloom tree that became inactive' : `Bloom tree at ${currentStage.minProgress}% growth`} />
      </div>
      <p className="stage-name sr-only">{stageName}</p>
      <ol className="tree-stages sr-only" aria-label="Tree growth stages">
        {treeStages.map((stage) => <li key={stage.name}>{stage.name}</li>)}
      </ol>
    </section>
  )
}

export default TreeProgress
