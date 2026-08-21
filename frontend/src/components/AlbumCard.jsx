import { Link } from 'react-router-dom'

export default function AlbumCard({ album }) {
  return (
    <Link to={`/albums/${album.id}`} className="album-card">
      <div className="cover-frame">
        {album.cover_image ? <img src={album.cover_image} alt={`${album.title} cover`} /> : <div className="cover-placeholder">No artwork</div>}
      </div>
      <h2>{album.title}</h2>
      {album.release_date && <p>{album.release_date}</p>}
    </Link>
  )
}
