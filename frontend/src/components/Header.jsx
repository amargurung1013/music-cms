import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const location = useLocation()
  const isDetailPage = location.pathname.startsWith('/albums/')

  return (
    <header className="site-header">
      {isDetailPage && <Link to="/discography" className="wordmark">Back</Link>}
      <nav className="site-nav" aria-label="Main navigation">
        <Link to="/discography">Discography</Link>
        <Link to="/search">Search</Link>
      </nav>
    </header>
  )
}
