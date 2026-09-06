import { useState } from 'react'

function NewTreeForm({ onConfirm }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null)

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

  function handleSubmit(event) {
    event.preventDefault()
    if (selectedPhoto) onConfirm(selectedPhoto)
  }

  return (
    <form className="new-tree-form" onSubmit={handleSubmit}>
      <h3>Choose your new tree</h3>
      <p>Take or upload a photo of the real tree you want to grow together.</p>

      <label htmlFor="new-tree-photo">Tree reference photo</label>{' '}
      <input
        id="new-tree-photo"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoSelection}
      />

      {selectedPhoto && (
        <figure>
          <img
            className="photo-preview"
            src={selectedPhoto.previewUrl}
            alt="Selected tree reference preview"
          />
          <figcaption>{selectedPhoto.name}</figcaption>
        </figure>
      )}

      <button type="submit" disabled={!selectedPhoto}>Use this tree</button>
    </form>
  )
}

export default NewTreeForm
