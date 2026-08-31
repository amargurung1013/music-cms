import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'

export default function DailyLyric() {
  const [lyric, setLyric] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { api('/songs/random-lyric').then(setLyric).catch(() => setLyric(null)) }, [])
  if (!lyric) return null

  return <section className="daily-lyric" role="link" tabIndex="0" onClick={() => navigate(`/albums/${lyric.album_id}`)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') navigate(`/albums/${lyric.album_id}`) }}><div className="daily-lyric-cover">{lyric.album_cover_image ? <img src={lyric.album_cover_image} alt={`${lyric.album_title} cover`} /> : <div className="cover-placeholder">No artwork</div>}</div><div className="daily-lyric-content"><p className="eyebrow">Random lyrics</p><Link className="daily-lyric-text" to={`/albums/${lyric.album_id}/songs/${lyric.id}`} onClick={(event) => event.stopPropagation()}>“{lyric.lyric}”</Link><p className="daily-lyric-source">{lyric.title} <span>({lyric.album_title})</span></p></div></section>
}
