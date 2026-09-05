function TreeProgress({ progress }) {
  return (
    <section aria-labelledby="tree-progress-heading">
      <h2 id="tree-progress-heading">Tree progress</h2>
      <p>{progress}% grown</p>
      <progress value={progress} max="100" aria-label={`Tree growth: ${progress}%`}>
        {progress}%
      </progress>
    </section>
  )
}

export default TreeProgress
