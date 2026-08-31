import { Link } from 'react-router-dom'

const sectionHeading = /^\s*\[(?:verse|chorus|bridge|pre[- ]?chorus|refrain|outro|intro)(?:\s+\d+)?\]\s*$/i

function cleanLyrics(lyrics, fallback) {
  const lines = String(lyrics || '').split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !sectionHeading.test(line))
  return lines.join(' • ') || fallback
}

export default function LyricMarquee({ lyric }) {
  if (!lyric) return null
  const text = cleanLyrics(lyric.lyrics || lyric.lyric, lyric.title)
  return <section className="lyric-marquee-section" aria-label="Scrolling lyrics"><div className="lyric-marquee"><Link className="lyric-marquee-track" to={`/albums/${lyric.album_id}/songs/${lyric.id}`}><span>{text}</span><span aria-hidden="true">{text}</span></Link></div></section>
}
