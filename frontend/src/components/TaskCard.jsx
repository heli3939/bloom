import { useState } from 'react'

function TaskCard({ task, artwork, submission, isCompleted, isDailyLimitReached, canSimulateFriend, onSubmitPhoto, onSimulateFriendSubmission }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const submittedPhoto = submission.currentUser
  const previewPhoto = submittedPhoto ?? selectedPhoto
  const isLocked = isDailyLimitReached && !isCompleted

  function handlePhotoSelection(event) {
    const file = event.target.files?.[0]
    if (!file) return setSelectedPhoto(null)
    const reader = new FileReader()
    reader.onload = () => setSelectedPhoto({ name: file.name, type: file.type, size: file.size, previewUrl: reader.result })
    reader.readAsDataURL(file)
  }

  function handlePhotoSubmit(event) {
    event.preventDefault()
    if (selectedPhoto && !submittedPhoto && !isLocked) onSubmitPhoto(task, selectedPhoto)
  }

  return (
    <article className={`task-card ${isCompleted ? 'completed' : ''}`}>
      <div className="task-heading">
        <div><p className="eyebrow">Shared activity</p><h3>{task.title}</h3></div>
        <span className="growth-chip">+{task.growthValue}%</span>
      </div>
      <form onSubmit={handlePhotoSubmit}>
        <input className="file-input" id={`photo-${task.id}`} type="file" accept="image/*" onChange={handlePhotoSelection} disabled={Boolean(submittedPhoto) || isLocked} />
        <label className="task-upload" htmlFor={`photo-${task.id}`}>
          {previewPhoto?.previewUrl ? (
            <figure><img className="photo-preview" src={previewPhoto.previewUrl} alt={`Preview for ${task.title}`} /><figcaption>{previewPhoto.name}</figcaption></figure>
          ) : (
            <figure>
              <img className="activity-art" src={artwork} alt="" />
              <figcaption>{submittedPhoto ? 'Photo submitted' : 'Tap the image to upload your photo'}</figcaption>
            </figure>
          )}
        </label>
        <p className="task-description">{task.description}</p>
        <dl className="submission-status">
          <div><dt>You</dt><dd>{submittedPhoto ? 'Submitted' : 'Waiting'}</dd></div>
          <div><dt>Friend</dt><dd>{submission.friendSubmitted ? 'Submitted' : 'Waiting'}</dd></div>
        </dl>
        <button className="primary-button task-submit" type="submit" disabled={!selectedPhoto || Boolean(submittedPhoto) || isLocked}>
          {isLocked ? 'Daily limit reached' : submittedPhoto ? 'Photo submitted' : 'Submit my photo'}
        </button>
      </form>
      {canSimulateFriend && (
        <button className="secondary-button" type="button" onClick={() => onSimulateFriendSubmission(task)} disabled={submission.friendSubmitted || isLocked}>
          {isLocked ? 'Daily limit reached' : submission.friendSubmitted ? 'Friend submission simulated' : 'Simulate friend submission'}
        </button>
      )}
      {isCompleted && <p className="success-note"><strong>Task completed by both gardeners!</strong></p>}
      {isLocked && <p className="locked-note">This task cannot be submitted today.</p>}
    </article>
  )
}

export default TaskCard
