import { useEffect, useState } from 'react'
import AlbumCard from '../components/AlbumCard'
import StateMessage from '../components/StateMessage'
import { api } from '../api'
import DailyLyric from '../components/DailyLyric'

export default function Discography() {
  const [albums, setAlbums] = useState(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { api('/albums').then(setAlbums).catch((err) => setError(err.message)) }, [])

  const visibleAlbums = albums && Array.from(
    albums.reduce((groups, album, _, allAlbums) => {
      const baseAlbum = album.base_album_id && allAlbums.find((candidate) => candidate.id === album.base_album_id)
      const key = (baseAlbum ?? album).title.trim().toLocaleLowerCase()
      const current = groups.get(key)
      const isBaseAlbum = !album.base_album_id && (album.edition_type ?? 'standard') === 'standard'
      const currentIsBaseAlbum = current && !current.base_album_id && (current.edition_type ?? 'standard') === 'standard'
      if (!current || (isBaseAlbum && !currentIsBaseAlbum)) groups.set(key, album)
      return groups
    }, new Map()).values(),
  )
  const filteredAlbums = visibleAlbums?.filter((album) => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return !normalizedQuery || `${album.title} ${album.release_date ?? ''}`.toLocaleLowerCase().includes(normalizedQuery)
  })
  return (
    <main>
      <DailyLyric />
      <section className="intro"><p className="eyebrow">Collection / Discography</p><h1>Discography</h1><div className="collection-meta"><span>{visibleAlbums ? `${visibleAlbums.length} albums` : 'Loading collection'}</span><span>Lyrics archive</span></div></section>
      {error && <StateMessage error>{error}</StateMessage>}
      {!albums && !error && <StateMessage>Loading albums…</StateMessage>}
      {albums && visibleAlbums.length > 0 && <section className="collection-tools" aria-label="Find an album"><label htmlFor="album-search">Find an album<input id="album-search" type="search" placeholder="Search by title or year…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>{query && <button type="button" className="secondary-button" onClick={() => setQuery('')}>Clear</button>}<span className="collection-result-count">{filteredAlbums.length} of {visibleAlbums.length}</span></section>}
      {albums && (filteredAlbums.length ? <section className="album-grid">{filteredAlbums.map((album) => <AlbumCard key={album.id} album={album} />)}</section> : visibleAlbums.length ? <StateMessage>No albums match “{query}”.</StateMessage> : <StateMessage>No albums have been added yet.</StateMessage>)}
    </main>
  )
}
