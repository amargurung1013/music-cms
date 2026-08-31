import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useParams, useSearchParams } from 'react-router-dom'
import StateMessage from '../components/StateMessage'
import { api } from '../api'
import { highlightMatch } from '../highlight'
import RecommendedSongs from '../components/RecommendedSongs'
import TrackList from '../components/TrackList'

export default function SongPage() {
  const { albumId, songId } = useParams()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [song, setSong] = useState(null)
  const [album, setAlbum] = useState(null)
  const [error, setError] = useState('')
  const orderedSongs = useMemo(() => [...(album?.songs ?? [])].sort((first, second) => first.track_number - second.track_number), [album])
  const currentSongIndex = orderedSongs.findIndex((albumSong) => albumSong.id === song?.id)
  const previousSong = currentSongIndex > 0 ? orderedSongs[currentSongIndex - 1] : null
  const nextSong = currentSongIndex >= 0 && currentSongIndex < orderedSongs.length - 1 ? orderedSongs[currentSongIndex + 1] : null
  const songLink = (albumSong) => `/albums/${albumSong.album_id}/songs/${albumSong.id}${query ? `?q=${encodeURIComponent(query)}` : ''}`
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
      <div className="lyrics-content"><Link className="song-album-card" to={`/albums/${album.id}`}><div className="song-album-cover">{album.cover_image ? <img src={album.cover_image} alt="" /> : <div className="cover-placeholder">No art</div>}</div><span>{album.title}</span></Link><h1>{song.title}</h1><div className="rule" /><article className="lyrics">{highlightMatch(song.lyrics, query)}</article><nav className="song-navigation" aria-label="Song navigation"><span className="song-navigation-label">Track {song.track_number} of {orderedSongs.length}</span><div className="song-navigation-links">{previousSong ? <Link className="song-navigation-link previous" to={songLink(previousSong)}><span className="song-navigation-arrow" aria-hidden="true">←</span><span><small>Previous song</small><strong>{previousSong.title}</strong></span></Link> : <span className="song-navigation-link disabled previous"><span className="song-navigation-arrow" aria-hidden="true">←</span><span><small>Previous song</small><strong>Start of album</strong></span></span>}{nextSong ? <Link className="song-navigation-link next" to={songLink(nextSong)}><span><small>Next song</small><strong>{nextSong.title}</strong></span><span className="song-navigation-arrow" aria-hidden="true">→</span></Link> : <span className="song-navigation-link disabled next"><span><small>Next song</small><strong>End of album</strong></span><span className="song-navigation-arrow" aria-hidden="true">→</span></span>}</div></nav><section className="song-tracklist-section" aria-labelledby="album-tracklist-heading"><p className="eyebrow">Album tracklist</p><h2 id="album-tracklist-heading">{album.title}</h2><TrackList albumId={album.id} songs={orderedSongs} activeSongId={song.id} query={query} /></section></div>
      <RecommendedSongs songId={song.id} />
    </main>
  )
}
