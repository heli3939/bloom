import { useState } from 'react'

function NewTreeForm({ friends, onConfirm }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [friendId, setFriendId] = useState('')
  const selectedFriendId = friendId || friends[0]?.id || ''

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
    if (selectedPhoto && selectedFriendId) onConfirm(selectedPhoto, selectedFriendId)
  }

  if (friends.length === 0) {
    return <p>Add a friend first, then you can start a shared tree.</p>
  }

  return (
    <form className="new-tree-form" onSubmit={handleSubmit}>
      <h3>Choose your new tree</h3>
      <p>Take or upload a photo of the real tree you want to grow together.</p>

      <label htmlFor="new-tree-friend">Friend</label>{' '}
      <select
        id="new-tree-friend"
        value={selectedFriendId}
        onChange={(event) => setFriendId(event.target.value)}
        required
      >
        {friends.map((friend) => (
          <option key={friend.id} value={friend.id}>
            {friend.username}
          </option>
        ))}
      </select>

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

      <button type="submit" disabled={!selectedPhoto || !selectedFriendId}>Use this tree</button>
    </form>
  )
}

export default NewTreeForm
