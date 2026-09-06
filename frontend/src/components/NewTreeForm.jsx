import { useState } from 'react'
import refreshIcon from '../assets/figma/refresh.png'

function NewTreeForm({ onConfirm }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null)

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

  return (
    <section className="new-tree-screen" aria-labelledby="new-tree-heading">
      <h1 id="new-tree-heading">Capture your first<br />plant outdoor</h1>
      <input className="file-input" id="new-tree-photo" type="file" accept="image/*" capture="environment" onChange={handlePhotoSelection} />
      <label className="figma-capture-zone" htmlFor="new-tree-photo">
        {selectedPhoto && <img src={selectedPhoto.previewUrl} alt="Selected outdoor plant" />}
      </label>
      <label className="photo-library-button" htmlFor="new-tree-photo" aria-label="Choose a plant photo">
        <span />
        <span />
      </label>
      {selectedPhoto ? (
        <button className="tree-shutter" type="button" aria-label="Plant this tree" onClick={() => onConfirm(selectedPhoto)} />
      ) : (
        <label className="tree-shutter" htmlFor="new-tree-photo" aria-label="Capture a plant photo" />
      )}
      <label className="tree-refresh" htmlFor="new-tree-photo" aria-label="Choose another plant photo">
        <img src={refreshIcon} alt="" />
      </label>
    </section>
  )
}

export default NewTreeForm
