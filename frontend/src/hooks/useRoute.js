import { useEffect, useState } from 'react'

function currentPath() {
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

export function useRoute() {
  const [path, setPath] = useState(currentPath)

  useEffect(() => {
    function handlePopState() {
      setPath(currentPath())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigate(nextPath, { replace = false } = {}) {
    const normalizedPath = nextPath.replace(/\/+$/, '') || '/'
    if (normalizedPath === currentPath()) return
    window.history[replace ? 'replaceState' : 'pushState']({}, '', normalizedPath)
    setPath(normalizedPath)
  }

  return { path, navigate }
}
