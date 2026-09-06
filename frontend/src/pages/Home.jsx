import { useState } from 'react'
import NewTreeForm from '../components/NewTreeForm'
import TaskCard from '../components/TaskCard'
import TreeProgress from '../components/TreeProgress'
import { useDailyTasks } from '../hooks/useDailyTasks'
import { logout } from '../services/api'

function Home({ currentUser, onLogout }) {
  const [isCreatingNewTree, setIsCreatingNewTree] = useState(false)
  const [friendName, setFriendName] = useState('')
  const {
    loading,
    error,
    setError,
    friends,
    hasActiveTree,
    treeProgress,
    isTreeCompleted,
    dailyTasks,
    submitCurrentUserPhoto,
    startNewTree,
    connectFriend,
  } = useDailyTasks(currentUser)

  async function handleNewTreeConfirmation(referencePhoto, friendId) {
    try {
      await startNewTree(referencePhoto, friendId)
      setIsCreatingNewTree(false)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAddFriend(event) {
    event.preventDefault()
    try {
      await connectFriend(friendName)
      setFriendName('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSubmitPhoto(task, photo) {
    try {
      await submitCurrentUserPhoto(task, photo)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleLogout() {
    logout()
    onLogout()
  }

  if (loading) {
    return (
      <main>
        <p>Loading your tree…</p>
      </main>
    )
  }

  return (
    <main>
      <header>
        <h1>Bloom</h1>
        <p>Signed in as {currentUser.username}.</p>
        <button type="button" onClick={handleLogout}>Log out</button>
      </header>

      {error && <p className="form-error">{error}</p>}

      <section aria-labelledby="friends-heading">
        <h2 id="friends-heading">Friends</h2>
        {friends.length === 0 ? (
          <p>No friends yet. Add your partner by username.</p>
        ) : (
          <ul>
            {friends.map((friend) => (
              <li key={friend.id}>{friend.username}</li>
            ))}
          </ul>
        )}
        <form className="friend-form" onSubmit={handleAddFriend}>
          <label htmlFor="friend-username">Add friend</label>{' '}
          <input
            id="friend-username"
            value={friendName}
            onChange={(event) => setFriendName(event.target.value)}
            placeholder="username"
            required
          />
          <button type="submit">Add</button>
        </form>
      </section>

      {!hasActiveTree ? (
        <section>
          <p>Start your first shared tree with a friend.</p>
          <NewTreeForm friends={friends} onConfirm={handleNewTreeConfirmation} />
        </section>
      ) : (
        <>
          <p>Complete today&apos;s activities to help your tree grow.</p>
          <TreeProgress progress={treeProgress} />

          {isTreeCompleted ? (
            <section aria-labelledby="tree-complete-heading">
              <h2 id="tree-complete-heading">Your tree has fully bloomed!</h2>
              <p>You and your friend completed this tree together.</p>
              {isCreatingNewTree ? (
                <NewTreeForm friends={friends} onConfirm={handleNewTreeConfirmation} />
              ) : (
                <button type="button" onClick={() => setIsCreatingNewTree(true)}>
                  Start a new tree
                </button>
              )}
            </section>
          ) : (
            <section aria-labelledby="daily-tasks-heading">
              <h2 id="daily-tasks-heading">Today&apos;s tasks</h2>
              <div className="task-list">
                {dailyTasks.map((task) => {
                  const mine = task.completions.find((item) => item.userId === currentUser.id)
                  const friend = task.completions.find((item) => item.userId !== currentUser.id)
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      submission={{
                        currentUser: mine?.photoUrl
                          ? { previewUrl: mine.photoUrl, name: 'Your photo' }
                          : null,
                        friendSubmitted: Boolean(friend?.photoUrl),
                      }}
                      isCompleted={task.completed}
                      onSubmitPhoto={handleSubmitPhoto}
                    />
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default Home
