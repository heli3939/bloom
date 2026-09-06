import { useState } from 'react'
import refreshIcon from '../assets/figma/refresh.png'
import saveIcon from '../assets/figma/save.svg'

function ActivityCapture({ task, initialPhoto, isLocked, onSubmit }) {
  const [selectedPhoto, setSelectedPhoto] = useState(initialPhoto)

  function handlePhotoSelection(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setSelectedPhoto({
      name: file.name,
      type: file.type,
      size: file.size,
      previewUrl: reader.result,
    })
    reader.readAsDataURL(file)
  }

  function handleSubmit() {
    if (!selectedPhoto || isLocked) return
    onSubmit(task, selectedPhoto)
  }

  return (
    <section className="capture-screen" aria-labelledby="capture-heading">
      <h1 id="capture-heading">Capture the activity</h1>
      <input className="file-input" id="activity-photo" type="file" accept="image/*" capture="environment" onChange={handlePhotoSelection} />
      <label className="figma-capture-zone" htmlFor="activity-photo">
        {selectedPhoto && <img src={selectedPhoto.previewUrl} alt={`Selected photo for ${task.title}`} />}
      </label>
      <button className="capture-save" type="button" aria-label="Download disabled" disabled>
        <img src={saveIcon} alt="" />
      </button>
      <button
        className="capture-shutter"
        type="button"
        aria-label="Submit activity photo"
        disabled={!selectedPhoto || isLocked}
        onClick={handleSubmit}
      />
      <button className="capture-refresh" type="button" aria-label="Rotate disabled" disabled>
        <img src={refreshIcon} alt="" />
      </button>
    </section>
  )
}

export default ActivityCapture
