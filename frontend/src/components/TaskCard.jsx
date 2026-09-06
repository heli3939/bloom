import { useState } from 'react'

function TaskCard({
  task,
  submission,
  isCompleted,
  onSubmitPhoto,
}) {
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const submittedPhoto = submission.currentUser
  const previewPhoto = submittedPhoto ?? selectedPhoto

  function handlePhotoSelection(event) {
    const file = event.target.files?.[0]
    if (!file) {
      setSelectedPhoto(null)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setSelectedPhoto({
        name: file.name,
        type: file.type,
        size: file.size,
        previewUrl: reader.result,
      })
    }
    reader.readAsDataURL(file)
  }

  function handlePhotoSubmit(event) {
    event.preventDefault()
    if (!selectedPhoto || submittedPhoto) return
    onSubmitPhoto(task, selectedPhoto)
  }

  return (
    <article className="task-card">
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <p>Tree growth after both submissions: +{task.growthValue}%</p>

      <dl>
        <div>
          <dt>You</dt>
          <dd>{submittedPhoto ? 'Submitted' : 'Waiting'}</dd>
        </div>
        <div>
          <dt>Friend</dt>
          <dd>{submission.friendSubmitted ? 'Submitted' : 'Waiting'}</dd>
        </div>
      </dl>

      <form onSubmit={handlePhotoSubmit}>
        <label htmlFor={`photo-${task.id}`}>Choose one photo</label>{' '}
        <input
          id={`photo-${task.id}`}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelection}
          disabled={Boolean(submittedPhoto)}
        />

        {previewPhoto && (
          <figure>
            <img
              className="photo-preview"
              src={previewPhoto.previewUrl}
              alt={`Preview for ${task.title}`}
            />
            <figcaption>{previewPhoto.name}</figcaption>
          </figure>
        )}

        <button type="submit" disabled={!selectedPhoto || Boolean(submittedPhoto)}>
          {submittedPhoto ? 'Photo submitted' : 'Submit my photo'}
        </button>
      </form>

      {isCompleted && <p><strong>Task completed by both users.</strong></p>}
    </article>
  )
}

export default TaskCard
