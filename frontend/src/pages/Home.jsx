import { useState } from 'react'
import backIcon from '../assets/figma/back.svg'
import bloomLogo from '../assets/figma/bloom-logo.svg'
import completionGarden from '../assets/figma/completion-garden.png'
import cyclingScene from '../assets/figma/cycling-1.png'
import galleryTree15 from '../assets/figma/gallery-tree-15.svg'
import galleryTree20 from '../assets/figma/gallery-tree-20.svg'
import galleryTree30 from '../assets/figma/gallery-tree-30.svg'
import galleryTree5 from '../assets/figma/gallery-tree-5.svg'
import mealScene from '../assets/figma/meal-1.png'
import moneyBag from '../assets/figma/money-bag.svg'
import paintScene from '../assets/figma/paint-1.png'
import picnicScene from '../assets/figma/picnic.png'
import placeScene from '../assets/figma/place-1.png'
import ActivityCapture from '../components/ActivityCapture'
import ActivitySelector from '../components/ActivitySelector'
import BottomNav from '../components/BottomNav'
import FlowerBackdrop from '../components/FlowerBackdrop'
import NewTreeForm from '../components/NewTreeForm'
import TreeProgress from '../components/TreeProgress'
import { useDailyTasks } from '../hooks/useDailyTasks'

const activityArtwork = [picnicScene, mealScene, placeScene, cyclingScene, paintScene]
const galleryArtwork = [galleryTree5, galleryTree15, galleryTree20, galleryTree30]

function Home() {
  const [view, setView] = useState('garden')
  const [isCreatingNewTree, setIsCreatingNewTree] = useState(false)
  const [activityIndex, setActivityIndex] = useState(0)
  const [captureState, setCaptureState] = useState(null)
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
    completedTrees,
    loadCompletedTrees,
  } = useDailyTasks()
  const isDailyLimitReached = completedTaskIds.length >= 3
  const needsNewTree = !hasActiveTree || isTreeCompleted || isTreeDead
  const displayedProgress = isTreeCompleted
    ? 100
    : !hasActiveTree || isTreeDead
      ? 0
      : treeProgress

  async function handleNewTreeConfirmation(referencePhoto) {
    const createdTree = await startNewTree(referencePhoto)
    if (!createdTree) return
    setIsCreatingNewTree(false)
    setView('garden')
  }

  function handleNavigate(nextView) {
    setView(nextView)
    if (nextView === 'gallery') loadCompletedTrees()
  }

  function handleCameraClick() {
    setIsCreatingNewTree(true)
  }

  function openActivityCapture(task, photo = null) {
    const selectedIndex = tasks.findIndex((item) => item.id === task.id)
    if (selectedIndex >= 0) setActivityIndex(selectedIndex)
    setCaptureState({ task, photo })
  }

  async function handleActivitySubmit(task, photo) {
    const updatedTree = await submitCurrentUserPhoto(task, photo)
    setCaptureState(null)
    if (updatedTree?.status === 'completed') setView('garden')
  }

  if (isLoading) {
    return <main className="figma-shell loading-screen"><p>Connecting to Bloom…</p></main>
  }

  if (isCreatingNewTree) {
    return (
      <main className="figma-shell onboarding-page">
        <FlowerBackdrop variant="capture" />
        {isTreeDead && <p className="tree-dead-note">Your tree was inactive for 15 days. Plant a new one to begin again.</p>}
        {error && <p className="error-note" role="alert">{error}</p>}
        <NewTreeForm onConfirm={handleNewTreeConfirmation} />
      </main>
    )
  }

  if (captureState && !isTreeCompleted) {
    const captureCompleted = completedTaskIds.includes(captureState.task.id)
    return (
      <main className="figma-shell activity-capture-page">
        <FlowerBackdrop variant="capture" />
        <ActivityCapture
          key={captureState.task.id}
          task={captureState.task}
          initialPhoto={captureState.photo}
          isLocked={isDailyLimitReached && !captureCompleted}
          onSubmit={handleActivitySubmit}
        />
        {error && <p className="error-note floating-error" role="alert">{error}</p>}
      </main>
    )
  }

  if (view === 'activities' && !isTreeCompleted) {
    return (
      <main className="figma-shell activities-page">
        <FlowerBackdrop variant="activities" />
        <ActivitySelector
          tasks={tasks}
          artwork={activityArtwork}
          progress={treeProgress}
          dayNumber={dayNumber}
          completedTaskIds={completedTaskIds}
          submissionsByTask={submissionsByTask}
          isDailyLimitReached={isDailyLimitReached}
          activeIndex={Math.min(activityIndex, Math.max(tasks.length - 1, 0))}
          onIndexChange={setActivityIndex}
          onBack={() => setView('garden')}
          onCapture={(task) => openActivityCapture(task)}
          onPhotoSelected={openActivityCapture}
          isDemoMode={isDemoMode}
          onSimulateFriend={simulateFriendSubmission}
          onSimulateNextDay={simulateNextDay}
        />
        {error && <p className="error-note floating-error" role="alert">{error}</p>}
      </main>
    )
  }

  if (view === 'gallery') {
    return (
      <main className="figma-shell gallery-page">
        <FlowerBackdrop />
        <button className="plain-back-button" type="button" aria-label="Back to tree" onClick={() => setView('garden')}>
          <img src={backIcon} alt="" />
        </button>
        <span className="gallery-money"><img src={moneyBag} alt="" /></span>
        <h1>Good Job!</h1>
        <div className="completion-art">
          <img src={completionGarden} alt="The garden of trees planted with your friend" />
        </div>
        <div className="completed-tree-strip" aria-label="Completed trees">
          {completedTrees.length ? completedTrees.map((tree, index) => (
            <article key={tree._id}>
              <img src={galleryArtwork[index % galleryArtwork.length]} alt="" />
              <span>Tree {index + 1}</span>
            </article>
          )) : (
            <p>Your completed trees will grow here.</p>
          )}
        </div>
        {error && <p className="error-note floating-error" role="alert">{error}</p>}
      </main>
    )
  }

  return (
    <main className="figma-shell garden-page">
      <FlowerBackdrop />
      <img className="bloom-logo" src={bloomLogo} alt="Bloom" />
      <TreeProgress progress={displayedProgress} />
      {isTreeCompleted && (
        <p className="completed-tree-prompt" role="status">
          Your tree bloomed! Tap the camera to plant a new tree.
        </p>
      )}
      <BottomNav
        activeView={view}
        needsNewTree={needsNewTree}
        onCaptureTree={handleCameraClick}
        onNavigate={handleNavigate}
      />
      {error && <p className="error-note floating-error" role="alert">{error}</p>}
    </main>
  )
}

export default Home
