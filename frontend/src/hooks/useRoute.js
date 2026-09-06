import { useEffect, useState } from 'react'
import { BASE_URL } from '../paths'

function currentPath() {
  const base = BASE_URL.replace(/\/$/, '')
  let path = window.location.pathname
  if (base && path.startsWith(base)) {
    path = path.slice(base.length) || '/'
  }
  return path.replace(/\/+$/, '') || '/'
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
    const base = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`
    const url = normalizedPath === '/' ? base : `${base}${normalizedPath.replace(/^\//, '')}`
    window.history[replace ? 'replaceState' : 'pushState']({}, '', url)
    setPath(normalizedPath)
  }

  return { path, navigate }
}
