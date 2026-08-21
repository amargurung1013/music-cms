import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Discography from './pages/Discography'
import AlbumPage from './pages/AlbumPage'
import SongPage from './pages/SongPage'
import EditCollection from './pages/EditCollection'
import ArrangeCollection from './pages/ArrangeCollection'
import SearchPage from './pages/SearchPage'
import AskAI from './pages/AskAI'
import EditLogin, { EDIT_AUTH_KEY, EDIT_FAILED_KEY } from './pages/EditLogin'
import ScrollManager from './components/ScrollManager'

export default function App() {
  const location = useLocation()
  const isProtectedRoute = location.pathname.startsWith('/edit') || location.pathname.startsWith('/arrange')
  const isAdminRoute = isProtectedRoute

  useEffect(() => {
    if (isAdminRoute) return undefined

    const isFormControl = (target) => target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"]')
    const preventCopy = (event) => {
      if (!isFormControl(event.target)) event.preventDefault()
    }
    const preventContextMenu = (event) => {
      if (!isFormControl(event.target)) event.preventDefault()
    }
    const preventCopyShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c' && !isFormControl(event.target)) event.preventDefault()
    }

    document.addEventListener('copy', preventCopy)
    document.addEventListener('contextmenu', preventContextMenu)
    document.addEventListener('keydown', preventCopyShortcut)
    return () => {
      document.removeEventListener('copy', preventCopy)
      document.removeEventListener('contextmenu', preventContextMenu)
      document.removeEventListener('keydown', preventCopyShortcut)
    }
  }, [isAdminRoute])

  if (isProtectedRoute && sessionStorage.getItem(EDIT_AUTH_KEY) !== 'true') {
    if (sessionStorage.getItem(EDIT_FAILED_KEY) === 'true') return <Navigate to="/discography" replace />
    return <EditLogin />
  }

  return <div className={isAdminRoute ? '' : 'public-content-protected'}><ScrollManager /><Header /><Routes><Route path="/" element={<Navigate to="/discography" replace />} /><Route path="/discography" element={<Discography />} /><Route path="/discography/standard" element={<Navigate to="/discography" replace />} /><Route path="/discography/deluxe" element={<Navigate to="/discography" replace />} /><Route path="/albums/:albumId" element={<AlbumPage />} /><Route path="/albums/:albumId/songs/:songId" element={<SongPage />} /><Route path="/edit" element={<Navigate to="/edit/albums" replace />} /><Route path="/edit/albums" element={<EditCollection section="album" />} /><Route path="/edit/albums/deluxe" element={<EditCollection section="versions" />} /><Route path="/edit/albums/versions" element={<EditCollection section="versions" />} /><Route path="/edit/albums/edit" element={<EditCollection section="edit-album" />} /><Route path="/edit/songs" element={<EditCollection section="song" />} /><Route path="/edit/songs/edit" element={<EditCollection section="edit-song" />} /><Route path="/edit/saved" element={<Navigate to="/edit/saved/standard" replace />} /><Route path="/edit/saved/standard" element={<EditCollection section="saved-standard" />} /><Route path="/edit/saved/deluxe" element={<EditCollection section="saved-deluxe" />} /><Route path="/arrange" element={<Navigate to="/arrange/albums" replace />} /><Route path="/arrange/albums" element={<ArrangeCollection section="album" />} /><Route path="/arrange/songs" element={<ArrangeCollection section="song" />} /><Route path="/search" element={<SearchPage />} /><Route path="/ask-ai" element={<AskAI />} /></Routes><aside className="copyright">© Amar</aside></div>
}
