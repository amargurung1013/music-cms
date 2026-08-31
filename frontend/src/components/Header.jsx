import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const isDetailPage = location.pathname.startsWith('/albums/')

  return (
    <header className="site-header">
      <button type="button" className="nav-orb" aria-label="Open navigation">+</button>
      <div className="nav-panel">
        {isDetailPage && <button type="button" className="wordmark back-button" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/discography')}>Back</button>}
        <nav className="site-nav" aria-label="Main navigation">
          <Link to="/discography">Home</Link>
          <Link to="/search">Search</Link>
        </nav>
      </div>
    </header>
  )
}
