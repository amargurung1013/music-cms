import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const STORAGE_KEY = 'music-cms-scroll-positions'

export default function ScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef(loadPositions())

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'

    return () => {
      window.history.scrollRestoration = 'auto'
    }
  }, [])

  useEffect(() => {
    const savePosition = () => {
      positions.current[location.key] = { x: window.scrollX, y: window.scrollY }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions.current))
    }

    window.addEventListener('scroll', savePosition, { passive: true })
    return () => {
      savePosition()
      window.removeEventListener('scroll', savePosition)
    }
  }, [location.key])

  useEffect(() => {
    const savedPosition = navigationType === 'POP' ? positions.current[location.key] : null
    if (!savedPosition) {
      window.scrollTo(0, 0)
      return undefined
    }

    let attempts = 0
    const restore = () => {
      window.scrollTo(savedPosition.x, savedPosition.y)
      attempts += 1
      if (attempts < 60 && document.documentElement.scrollHeight < savedPosition.y + window.innerHeight) {
        timer = window.setTimeout(restore, 50)
      }
    }

    let timer = window.setTimeout(restore, 0)
    return () => window.clearTimeout(timer)
  }, [location.key, navigationType])

  return null
}

function loadPositions() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}
