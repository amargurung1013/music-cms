import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function RecommendedSongs({ songId }) {
  const [songs, setSongs] = useState([])

  useEffect(() => {
    api(`/songs/recommended?exclude_song_id=${songId}`).then(setSongs).catch(() => setSongs([]))
  }, [songId])

  if (!songs.length) return null
  return <aside className="recommended-songs" aria-label="Recommended songs"><p className="eyebrow">Recommended songs</p><div className="recommendation-list">{songs.map((recommended) => <Link className="recommendation-card" key={recommended.id} to={`/albums/${recommended.album_id}/songs/${recommended.id}`}><div className="recommendation-cover">{recommended.album_cover_image ? <img src={recommended.album_cover_image} alt="" /> : <div className="cover-placeholder">No art</div>}</div><div><strong>{recommended.title}</strong><span>{recommended.album_title}</span></div></Link>)}</div></aside>
}
