import { useLayoutEffect, useRef } from 'react'
import arrowLeft from '../assets/figma/arrow-left.svg'
import backIcon from '../assets/figma/back.svg'

function ActivitySelector({
  tasks,
  artwork,
  progress,
  dayNumber,
  completedTaskIds,
  submissionsByTask,
  isDailyLimitReached,
  activeIndex,
  onIndexChange,
  onBack,
  onCapture,
  onPhotoSelected,
  isDemoMode,
  onSimulateFriend,
  onSimulateNextDay,
}) {
  const trackRef = useRef(null)
  const initialIndexRef = useRef(activeIndex)
  const task = tasks[activeIndex]
  const submission = task
    ? submissionsByTask[task.id] ?? { currentUser: null, friendSubmitted: false }
    : { currentUser: null, friendSubmitted: false }
  const isCompleted = task ? completedTaskIds.includes(task.id) : false
  const isLocked = isDailyLimitReached && !isCompleted

  useLayoutEffect(() => {
    if (!trackRef.current) return
    trackRef.current.scrollLeft = initialIndexRef.current * trackRef.current.clientWidth
  }, [])

  function goTo(index) {
    const nextIndex = Math.max(0, Math.min(tasks.length - 1, index))
    onIndexChange(nextIndex)
    trackRef.current?.scrollTo({ left: nextIndex * 393, behavior: 'smooth' })
  }

  function handleScroll(event) {
    const nextIndex = Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth)
    if (nextIndex !== activeIndex && tasks[nextIndex]) onIndexChange(nextIndex)
  }

  function handlePhoto(event, selectedTask) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onPhotoSelected(selectedTask, {
      name: file.name,
      type: file.type,
      size: file.size,
      previewUrl: reader.result,
    })
    reader.readAsDataURL(file)
  }

  if (!task) return null

  return (
    <section className="activity-selector" aria-labelledby="selected-activity-title">
      <button className="round-back-button" type="button" aria-label="Back to tree" onClick={onBack}>
        <img src={backIcon} alt="" />
      </button>
      <strong className="activity-progress">{progress}%</strong>
      <progress value={progress} max="100" aria-label={`Tree growth: ${progress}%`}>{progress}%</progress>
      <p className="activity-day">Day {dayNumber} · {completedTaskIds.length}/3 completed</p>
      <p className="activity-kicker">Select an activity</p>
      <h1 id="selected-activity-title">{task.title}</h1>

      <div className="activity-track" ref={trackRef} onScroll={handleScroll}>
        {tasks.map((item, index) => {
          const itemSubmission = submissionsByTask[item.id] ?? { currentUser: null }
          const itemCompleted = completedTaskIds.includes(item.id)
          const itemLocked = isDailyLimitReached && !itemCompleted
          return (
            <div className="activity-slide" key={item.id}>
              <input
                className="file-input"
                id={`quick-photo-${item.id}`}
                type="file"
                accept="image/*"
                capture="environment"
                disabled={Boolean(itemSubmission.currentUser) || itemLocked}
                onChange={(event) => handlePhoto(event, item)}
              />
              <label className="activity-image" htmlFor={`quick-photo-${item.id}`}>
                <img src={artwork[index % artwork.length]} alt={item.title} />
              </label>
            </div>
          )
        })}
      </div>

      <button className="carousel-arrow previous" type="button" aria-label="Previous activity" disabled={activeIndex === 0} onClick={() => goTo(activeIndex - 1)}>
        <img src={arrowLeft} alt="" />
      </button>
      <button className="carousel-arrow next" type="button" aria-label="Next activity" disabled={activeIndex === tasks.length - 1} onClick={() => goTo(activeIndex + 1)}>
        <img src={arrowLeft} alt="" />
      </button>
      <div className="carousel-dots" aria-hidden="true">
        {tasks.map((item, index) => <span className={index === activeIndex ? 'active' : ''} key={item.id} />)}
      </div>

      <button className="figma-next-button" type="button" disabled={isLocked || Boolean(submission.currentUser)} onClick={() => onCapture(task)}>
        {isLocked ? '3/3 DONE' : submission.currentUser ? 'SUBMITTED' : 'SELECT'}
      </button>
      {isDailyLimitReached && <p className="figma-limit-message">You can complete at most 3 tasks a day.</p>}
      {isDemoMode && (
        <div className="demo-controls">
          <button type="button" onClick={() => onSimulateFriend(task)} disabled={submission.friendSubmitted || isLocked}>Friend</button>
          <button type="button" onClick={onSimulateNextDay}>Next day</button>
        </div>
      )}
    </section>
  )
}

export default ActivitySelector
