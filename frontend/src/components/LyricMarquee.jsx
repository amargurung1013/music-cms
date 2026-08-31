import { Link } from 'react-router-dom'

const sectionHeading = /^\s*\[(?:verse|chorus|bridge|pre[- ]?chorus|refrain|outro|intro)(?:\s+\d+)?\]\s*$/i

const marqueePalettes = {
  dark: ['#D03E7D', '#3E393F'],
  feelings: ['#BC4118', '#E89934'],
  a: ['#F6F1EB', '#603B2A'],
  'a-one': ['#F6F1EB', '#603B2A'],
  monochrome: ['#E5E5E5', '#1A1A1A'],
  'merry, the man': ['#CDC3BF', '#191919'],
  'the male ego': ['#A0927A', '#3B1C21'],
  'my hermes': ['#0A0C11', '#9F7C52'],
  'please know that i tried': ['#4A5E79', '#010409'],
  'eastern values': ['#000000', '#FFFFFF'],
  'abt this initial': ['linear-gradient(180deg, #367E9A 0%, #807763 100%)', '#36312E'],
  "abt this initial, 's'": ['linear-gradient(180deg, #367E9A 0%, #807763 100%)', '#36312E'],
  "abt this initial, ‘s’": ['linear-gradient(180deg, #367E9A 0%, #807763 100%)', '#36312E'],
  "amarfromd'baazar": ['#CCCDC9', '#96030E'],
  'amarfromd’baazar': ['#CCCDC9', '#96030E'],
}

function cleanLyrics(lyrics, fallback) {
  const lines = String(lyrics || '').split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !sectionHeading.test(line))
  return lines.join(' • ') || fallback
}

export default function LyricMarquee({ lyric }) {
  if (!lyric) return null
  const text = cleanLyrics(lyric.lyrics || lyric.lyric, lyric.title)
  const palette = marqueePalettes[lyric.album_title.trim().toLocaleLowerCase()] || ['var(--surface)', 'var(--blue-soft)']
  return <section className="lyric-marquee-section" style={{ '--marquee-bg': palette[0], '--marquee-text': palette[1] }} aria-label="Scrolling lyrics"><div className="lyric-marquee"><Link className="lyric-marquee-track" to={`/albums/${lyric.album_id}/songs/${lyric.id}`}><span>{text}</span><span aria-hidden="true">{text}</span></Link></div></section>
}
