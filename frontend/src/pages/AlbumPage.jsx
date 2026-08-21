import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import TrackList from '../components/TrackList'
import StateMessage from '../components/StateMessage'
import { api } from '../api'
import MarkdownInline from '../components/MarkdownInline'

export default function AlbumPage() {
  const { albumId } = useParams()
  const [album, setAlbum] = useState(null)
  const [versionId, setVersionId] = useState(null)
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    setAlbum(null)
    setVersionId(null)
    setError('')
    Promise.all([api('/albums'), api(`/albums/${albumId}`)])
      .then(([albums, selected]) => {
        const standardSummary = selected.base_album_id ? albums.find((candidate) => candidate.id === selected.base_album_id) : (selected.edition_type ?? 'standard') === 'standard' ? selected : albums.find((candidate) => candidate.edition_type === 'standard' && candidate.title.trim().toLocaleLowerCase() === selected.title.trim().toLocaleLowerCase())
        const baseId = standardSummary?.id ?? selected.id
        const versions = albums.filter((candidate) => candidate.id !== baseId && (candidate.base_album_id === baseId || candidate.title.trim().toLocaleLowerCase() === selected.title.trim().toLocaleLowerCase()))
        return Promise.all([api(`/albums/${baseId}`), ...versions.map((version) => api(`/albums/${version.id}`))])
      })
      .then(([standard, ...versions]) => setAlbum({ standard, versions }))
      .catch((err) => setError(err.message))
  }, [albumId])
  const currentAlbum = album?.standard
  const songs = useMemo(() => {
    const activeVersion = album?.versions?.find((version) => version.id === versionId)
    if (!activeVersion) return currentAlbum?.songs ?? []
    const standardTitles = new Set(currentAlbum.songs.map((song) => song.title.trim().toLocaleLowerCase()))
    const bonusSongs = activeVersion.songs
      .filter((song) => !standardTitles.has(song.title.trim().toLocaleLowerCase()))
      .map((song, index) => ({ ...song, edition: 'version', editionLabel: activeVersion.version_name, track_number: currentAlbum.songs.length + index + 1 }))
    return [...currentAlbum.songs, ...bonusSongs]
  }, [album, currentAlbum, versionId])
  const activeVersion = album?.versions?.find((version) => version.id === versionId)
  const displayAlbum = activeVersion ?? currentAlbum
  if (error) return <main><StateMessage error>{error}</StateMessage></main>
  if (!album) return <main><StateMessage>Loading album…</StateMessage></main>
  return (
    <main>
      <section className="album-detail">
        <div className="album-artwork">
          <div className="detail-cover cover-frame">
            {displayAlbum?.cover_image ? <img src={displayAlbum.cover_image} alt={`${displayAlbum.title} cover`} /> : <div className="cover-placeholder">No artwork</div>}
          </div>
          {currentAlbum.description && <button type="button" className="album-description" onClick={() => setDescriptionOpen(true)} aria-label="Read full album description"><MarkdownInline text={currentAlbum.description} /></button>}
        </div>
        <div className="album-information">
          <p className="eyebrow">{currentAlbum.release_date ?? 'Album'}</p>
          <h1>{currentAlbum.title}</h1>
          {album.versions.length > 0 && <div className="edition-picker" aria-label="Album versions"><div className="edition-buttons"><button type="button" className={`edition-button ${!versionId ? 'active' : ''}`} onClick={() => setVersionId(null)}>Standard</button>{album.versions.map((version) => <button type="button" key={version.id} className={`edition-button ${versionId === version.id ? 'active' : ''}`} onClick={() => setVersionId(version.id)}>{version.version_name}</button>)}</div></div>}
          <TrackList albumId={currentAlbum.id} songs={songs} />
        </div>
      </section>
      {descriptionOpen && <div className="description-overlay" role="dialog" aria-modal="true" aria-label={`${currentAlbum.title} description`} onClick={(event) => { if (event.target === event.currentTarget) setDescriptionOpen(false) }}><button type="button" className="description-close" onClick={() => setDescriptionOpen(false)} aria-label="Close description">×</button><article className="description-reader"><p className="eyebrow">Album description</p><h2>{currentAlbum.title}</h2><p><MarkdownInline text={currentAlbum.description} /></p></article></div>}
    </main>
  )
}
