import { useEffect, useState } from 'react'
import backIcon from '../assets/figma/back.svg'
import bloomLogo from '../assets/figma/bloom-logo.svg'
import completionGarden from '../assets/figma/completion-garden.png'
import cyclingScene from '../assets/figma/cycling-1.png'
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
import { useRoute } from '../hooks/useRoute'

const activityArtwork = [picnicScene, mealScene, placeScene, cyclingScene, paintScene]

function activityRouteId(task) {
  return String(task.taskId ?? task.id)
}

function Home() {
  const [activityIndex, setActivityIndex] = useState(0)
  const [capturePhoto, setCapturePhoto] = useState(null)
  const { path, navigate } = useRoute()
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
  const captureMatch = path.match(/^\/activities\/([^/]+)\/capture$/)
  const activityMatch = path.match(/^\/activities\/([^/]+)$/)
  const routeTaskId = decodeURIComponent(captureMatch?.[1] ?? activityMatch?.[1] ?? '')
  const routeTaskIndex = tasks.findIndex((task) => (
    activityRouteId(task) === routeTaskId || task.id === routeTaskId
  ))
  const selectedActivityIndex = routeTaskIndex >= 0
    ? routeTaskIndex
    : Math.min(activityIndex, Math.max(tasks.length - 1, 0))
  const captureTask = captureMatch && routeTaskIndex >= 0 ? tasks[routeTaskIndex] : null
  const isActivitiesRoute = path === '/activities' || Boolean(activityMatch) || Boolean(captureMatch)

  useEffect(() => {
    if (isTreeDead && path !== '/' && path !== '/trees/new') {
      navigate('/', { replace: true })
    }
  }, [isTreeDead, navigate, path])

  useEffect(() => {
    if (isLoading) return
    if (sessionStorage.getItem('bloom.postLogin') !== 'capture') return
    sessionStorage.removeItem('bloom.postLogin')
    if (needsNewTree) {
      navigate('/trees/new', { replace: true })
      return
    }
    const firstTask = tasks[0]
    if (firstTask) {
      navigate(`/activities/${encodeURIComponent(activityRouteId(firstTask))}/capture`, { replace: true })
    }
  }, [isLoading, needsNewTree, tasks, navigate])

  async function handleNewTreeConfirmation(referencePhoto) {
    const createdTree = await startNewTree(referencePhoto)
    if (!createdTree) return
    navigate('/', { replace: true })
  }

  function handleNavigate(nextView) {
    if (nextView === 'gallery') {
      loadCompletedTrees()
      navigate('/completed-trees')
      return
    }
    if (nextView === 'activities') {
      const task = tasks[selectedActivityIndex] ?? tasks[0]
      if (task) navigate(`/activities/${encodeURIComponent(activityRouteId(task))}`)
      return
    }
    if (nextView === 'invite') {
      window.location.href = '/auth/invite.html'
      return
    }
    navigate('/')
  }

  function handleCameraClick() {
    navigate('/trees/new')
  }

  function openActivityCapture(task, photo = null) {
    const selectedIndex = tasks.findIndex((item) => item.id === task.id)
    if (selectedIndex >= 0) setActivityIndex(selectedIndex)
    setCapturePhoto(photo)
    navigate(`/activities/${encodeURIComponent(activityRouteId(task))}/capture`)
  }

  async function handleActivitySubmit(task, photo) {
    const updatedTree = await submitCurrentUserPhoto(task, photo)
    setCapturePhoto(null)
    navigate(
      updatedTree?.status === 'completed'
        ? '/'
        : `/activities/${encodeURIComponent(activityRouteId(task))}`,
      { replace: true },
    )
  }

  async function handleFriendSubmission(task) {
    const updatedTree = await simulateFriendSubmission(task)
    if (updatedTree?.status === 'completed') navigate('/')
  }

  function handleActivityIndexChange(index) {
    setActivityIndex(index)
    const task = tasks[index]
    if (task) navigate(`/activities/${encodeURIComponent(activityRouteId(task))}`, { replace: true })
  }

  if (isLoading) {
    return <main className="figma-shell loading-screen"><p>Connecting to Bloom…</p></main>
  }

  if (path === '/trees/new') {
    return (
      <main className="figma-shell onboarding-page">
        <FlowerBackdrop variant="capture" />
        {isTreeDead && <p className="tree-dead-note">Your tree was inactive for 15 days. Plant a new one to begin again.</p>}
        {error && <p className="error-note" role="alert">{error}</p>}
        <NewTreeForm onConfirm={handleNewTreeConfirmation} />
      </main>
    )
  }

  if (captureTask && !isTreeCompleted) {
    const captureCompleted = completedTaskIds.includes(captureTask.id)
    return (
      <main className="figma-shell activity-capture-page">
        <FlowerBackdrop variant="capture" />
        <ActivityCapture
          key={captureTask.id}
          task={captureTask}
          initialPhoto={capturePhoto}
          isLocked={isDailyLimitReached && !captureCompleted}
          onSubmit={handleActivitySubmit}
        />
        {error && <p className="error-note floating-error" role="alert">{error}</p>}
      </main>
    )
  }

  if (isActivitiesRoute && !isTreeCompleted) {
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
          activeIndex={selectedActivityIndex}
          onIndexChange={handleActivityIndexChange}
          onBack={() => navigate('/')}
          onCapture={(task) => openActivityCapture(task)}
          onPhotoSelected={openActivityCapture}
          isDemoMode={isDemoMode}
          onSimulateFriend={handleFriendSubmission}
          onSimulateNextDay={simulateNextDay}
        />
        {error && <p className="error-note floating-error" role="alert">{error}</p>}
      </main>
    )
  }

  if (path === '/completed-trees') {
    return (
      <main className="figma-shell gallery-page">
        <FlowerBackdrop />
        <button className="plain-back-button" type="button" aria-label="Back to tree" onClick={() => navigate('/')}>
          <img src={backIcon} alt="" />
        </button>
        <span className="gallery-money"><img src={moneyBag} alt="" /></span>
        <h1>Good Job!</h1>
        <div className="completion-art">
          <img src={completionGarden} alt="The garden of trees planted with your friend" />
        </div>
        {!completedTrees.length && <p className="empty-completed-garden">Your completed trees will grow here.</p>}
        {error && <p className="error-note floating-error" role="alert">{error}</p>}
      </main>
    )
  }

  return (
    <main className="figma-shell garden-page">
      <FlowerBackdrop />
      <img className="bloom-logo" src={bloomLogo} alt="Bloom" />
      <TreeProgress progress={displayedProgress} isDead={isTreeDead} />
      {isTreeCompleted && (
        <p className="completed-tree-prompt" role="status">
          Your tree bloomed! Tap the camera to plant a new tree.
        </p>
      )}
      {isTreeDead && (
        <p className="completed-tree-prompt dead-tree-prompt" role="status">
          Your tree died after 15 inactive days. Try more activities next time! Tap the camera to take a new plant photo and restart.
        </p>
      )}
      <BottomNav
        activeView="garden"
        needsNewTree={needsNewTree}
        onCaptureTree={handleCameraClick}
        onNavigate={handleNavigate}
      />
      {error && <p className="error-note floating-error" role="alert">{error}</p>}
    </main>
  )
}

export default Home
