import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { highlightMatch } from '../highlight'
import StateMessage from '../components/StateMessage'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const term = initialQuery.trim()
    if (term.length < 2) { setResults([]); setSearched(false); return }
    setError(''); setSearched(true)
    api(`/search/songs?q=${encodeURIComponent(term)}`).then(setResults).catch((err) => setError(err.message))
  }, [initialQuery])

  function submit(event) {
    event.preventDefault()
    const term = query.trim()
    if (term.length >= 2) setSearchParams({ q: term })
  }

  return (
    <main className="search-page">
      <p className="eyebrow">Song and lyric search</p><h1>Find a line</h1>
      <p className="editor-intro">Search any song title or phrase from its lyrics.</p>
      <form className="search-form" onSubmit={submit}>
        <label htmlFor="song-search">Search your archive</label>
        <div><input id="song-search" autoFocus value={query} minLength="2" onChange={(event) => setQuery(event.target.value)} placeholder="A lyric, a phrase, or song title" /><button type="submit">Search</button></div>
      </form>
      {error && <StateMessage error>{error}</StateMessage>}
      {searched && !error && <section className="search-results" aria-live="polite"><p className="eyebrow">{results.length} {results.length === 1 ? 'match' : 'matches'}</p>{results.length === 0 ? <p className="empty-tracks">No songs contain that phrase.</p> : results.map((song) => <Link className="search-result" key={song.id} to={`/albums/${song.album_id}/songs/${song.id}?q=${encodeURIComponent(initialQuery)}`}><p className="eyebrow">{song.album_title} · {song.track_number}</p><h2>{highlightMatch(song.title, initialQuery)}</h2><p className="matching-line">{highlightMatch(song.matching_line, initialQuery)}</p></Link>)}</section>}
    </main>
  )
}
