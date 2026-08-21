import { Link } from 'react-router-dom'

export default function TrackList({ albumId, songs }) {
  return (
    <ol className="track-list">
      {songs.map((song) => (
        <li key={song.id} value={song.track_number} className={song.edition === 'deluxe' || song.edition === 'version' ? 'deluxe-track' : ''}>
          <Link to={`/albums/${song.album_id ?? albumId}/songs/${song.id}`}>{song.title}</Link>{(song.edition === 'deluxe' || song.edition === 'version') && <span className="track-version-label"> · {song.editionLabel ?? 'DELUXE'}</span>}
        </li>
      ))}
    </ol>
  )
}
