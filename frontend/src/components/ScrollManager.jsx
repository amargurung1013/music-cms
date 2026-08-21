import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const STORAGE_KEY = 'music-cms-scroll-positions'

export default function ScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef(loadPositions())

  useEffect(() => {
    // Keep the browser from restoring a competing position on mobile Safari.
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
  }, [])

  useEffect(() => {
    const savePosition = () => {
      positions.current[location.key] = { x: window.scrollX, y: window.scrollY }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions.current))
    }

    window.addEventListener('scroll', savePosition, { passive: true })
    window.addEventListener('pagehide', savePosition)
    return () => {
      savePosition()
      window.removeEventListener('scroll', savePosition)
      window.removeEventListener('pagehide', savePosition)
    }
  }, [location.key])

  useLayoutEffect(() => {
    const savedPosition = navigationType === 'POP' ? positions.current[location.key] : null
    if (!savedPosition) {
      window.scrollTo(0, 0)
      return undefined
    }

    let frameId
    let observer
    let timeoutId
    const restore = () => {
      window.scrollTo(savedPosition.x, savedPosition.y)
      // Data-backed pages can grow after the route has changed. Keep trying
      // until the saved point exists, rather than restoring to the top once.
      if (document.documentElement.scrollHeight < savedPosition.y + window.innerHeight) {
        frameId = window.requestAnimationFrame(restore)
      }
    }

    frameId = window.requestAnimationFrame(restore)
    observer = new MutationObserver(restore)
    observer.observe(document.body, { childList: true, subtree: true })
    timeoutId = window.setTimeout(() => {
      observer.disconnect()
      window.cancelAnimationFrame(frameId)
    }, 10000)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.clearTimeout(timeoutId)
      observer?.disconnect()
    }
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
