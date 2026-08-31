import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AlbumCard from '../components/AlbumCard'
import StateMessage from '../components/StateMessage'
import { api } from '../api'
import DailyLyric from '../components/DailyLyric'
import LyricMarquee from '../components/LyricMarquee'

export default function Discography() {
  const [albums, setAlbums] = useState(null)
  const [lyric, setLyric] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { api('/albums').then(setAlbums).catch((err) => setError(err.message)) }, [])
  useEffect(() => { api('/songs/random-lyric').then(setLyric).catch(() => setLyric(null)) }, [])

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
  return (
    <main className="discography-page">
      <DailyLyric lyric={lyric} />
      <LyricMarquee lyric={lyric} />
      {visibleAlbums?.length > 0 && <aside className="album-sidebar" aria-label="Album navigation"><span className="album-sidebar-label">Albums</span><nav>{visibleAlbums.map((album, index) => <Link key={album.id} to={`/albums/${album.id}`}><span>{String(index + 1).padStart(2, '0')}</span>{album.title}</Link>)}</nav></aside>}
      <div className="discography-content">
        {error && <StateMessage error>{error}</StateMessage>}
        {!albums && !error && <StateMessage>Loading albums…</StateMessage>}
        {albums && (visibleAlbums.length ? <section className="album-grid">{visibleAlbums.map((album) => <AlbumCard key={album.id} album={album} />)}</section> : <StateMessage>No albums have been added yet.</StateMessage>)}
      </div>
    </main>
  )
}
