import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="site-header">
      <Link to="/" className="wordmark">ARCHIVE</Link>
      <nav className="site-nav" aria-label="Main navigation">
        <Link to="/discography">Discography</Link>
        <Link to="/search">Search</Link>
      </nav>
    </header>
  )
}
