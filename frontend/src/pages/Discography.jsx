import { useEffect, useState } from 'react'
import AlbumCard from '../components/AlbumCard'
import StateMessage from '../components/StateMessage'
import { api } from '../api'
import DailyLyric from '../components/DailyLyric'

export default function Discography() {
  const [albums, setAlbums] = useState(null)
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
  return (
    <main>
      <DailyLyric />
      <section className="intro"><p className="eyebrow">Collection / Discography</p><h1>Discography</h1></section>
      {error && <StateMessage error>{error}</StateMessage>}
      {!albums && !error && <StateMessage>Loading albums…</StateMessage>}
      {albums && (visibleAlbums.length ? <section className="album-grid">{visibleAlbums.map((album) => <AlbumCard key={album.id} album={album} />)}</section> : <StateMessage>No albums have been added yet.</StateMessage>)}
    </main>
  )
}
