import cameraIcon from '../assets/figma/camera.svg'
import fenceIcon from '../assets/figma/fence.svg'
import gameCardsIcon from '../assets/figma/game-cards.svg'
import peopleIcon from '../assets/figma/people.svg'
import storeIcon from '../assets/figma/store.svg'

function BottomNav({ activeView, needsNewTree, onCaptureTree, onNavigate }) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <button type="button" aria-label="Store — coming soon" disabled>
        <img src={storeIcon} alt="" />
      </button>
      <button
        className="nav-fence"
        type="button"
        aria-label="Planted trees"
        aria-current={activeView === 'gallery' ? 'page' : undefined}
        onClick={() => onNavigate('gallery')}
      >
        <img src={fenceIcon} alt="" />
      </button>
      <button
        className="camera-button"
        type="button"
        aria-label="Capture a new tree"
        disabled={!needsNewTree}
        aria-current={activeView === 'garden' ? 'page' : undefined}
        onClick={onCaptureTree}
      >
        <img src={cameraIcon} alt="" />
      </button>
      <button
        className="nav-activities"
        type="button"
        aria-label="Activities"
        disabled={needsNewTree}
        aria-current={activeView === 'activities' ? 'page' : undefined}
        onClick={() => onNavigate('activities')}
      >
        <img src={gameCardsIcon} alt="" />
      </button>
      <button
        className="nav-people"
        type="button"
        aria-label="Invite friends"
        aria-current={activeView === 'invite' ? 'page' : undefined}
        onClick={() => onNavigate('invite')}
      >
        <img src={peopleIcon} alt="" />
      </button>
    </nav>
  )
}

export default BottomNav
