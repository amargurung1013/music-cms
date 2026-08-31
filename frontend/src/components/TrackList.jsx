import { Link } from 'react-router-dom'

export default function TrackList({ albumId, songs, activeSongId, query = '' }) {
  return (
    <ol className="track-list">
      {songs.map((song) => (
        <li key={song.id} value={song.track_number} aria-current={song.id === activeSongId ? 'page' : undefined} className={`${song.edition === 'deluxe' || song.edition === 'version' ? 'deluxe-track' : ''} ${song.id === activeSongId ? 'active-track' : ''}`}>
          <Link to={`/albums/${song.album_id ?? albumId}/songs/${song.id}${query ? `?q=${encodeURIComponent(query)}` : ''}`}>{song.title}</Link>{(song.edition === 'deluxe' || song.edition === 'version') && <span className="track-version-label"> · {song.editionLabel ?? 'DELUXE'}</span>}
        </li>
      ))}
    </ol>
  )
}
