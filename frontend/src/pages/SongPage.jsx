import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useParams, useSearchParams } from 'react-router-dom'
import StateMessage from '../components/StateMessage'
import { api } from '../api'
import { highlightMatch } from '../highlight'
import RecommendedSongs from '../components/RecommendedSongs'

export default function SongPage() {
  const { albumId, songId } = useParams()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [song, setSong] = useState(null)
  const [album, setAlbum] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([api(`/songs/${songId}`), api(`/albums/${albumId}`)])
      .then(([foundSong, foundAlbum]) => {
        if (foundSong.album_id !== Number(albumId)) throw new Error('Song not found in this album')
        setSong(foundSong); setAlbum(foundAlbum)
      })
      .catch((err) => setError(err.message))
  }, [albumId, songId])
  if (error) return <main><StateMessage error>{error}</StateMessage></main>
  if (!song || !album) return <main><StateMessage>Loading song…</StateMessage></main>
  return (
    <main className="song-page">
      <div className="lyrics-content"><Link className="song-album-card" to={`/albums/${album.id}`}><div className="song-album-cover">{album.cover_image ? <img src={album.cover_image} alt="" /> : <div className="cover-placeholder">No art</div>}</div><span>{album.title}</span></Link><h1>{song.title}</h1><div className="rule" /><article className="lyrics">{highlightMatch(song.lyrics, query)}</article></div>
      <RecommendedSongs songId={song.id} />
    </main>
  )
}
