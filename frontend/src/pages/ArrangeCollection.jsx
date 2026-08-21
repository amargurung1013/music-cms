import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, patch } from '../api'
import StateMessage from '../components/StateMessage'
import SelectField from '../components/SelectField'

function SortableRow({ index, label, isDragging, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd, onMove, isFirst, isLast }) {
  return <div className={`saved-song ${isDragging ? 'is-dragging' : ''} ${isDragOver ? 'is-drag-over' : ''}`} draggable onDragStart={() => onDragStart(index)} onDragOver={(event) => { event.preventDefault(); onDragOver(index) }} onDrop={(event) => { event.preventDefault(); onDrop(index) }} onDragEnd={onDragEnd}><span>{index + 1}. {label}</span><div><button type="button" className="move-button up" disabled={isFirst} onClick={() => onMove(index, -1)}>Up</button><button type="button" className="move-button down" disabled={isLast} onClick={() => onMove(index, 1)}>Down</button></div></div>
}

export default function ArrangeCollection({ section = 'all' }) {
  const [albums, setAlbums] = useState([])
  const [selectedAlbumId, setSelectedAlbumId] = useState('')
  const [albumEdition, setAlbumEdition] = useState('all')
  const [songs, setSongs] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  useEffect(() => { api('/albums').then(setAlbums).catch((err) => setError(err.message)) }, [])
  useEffect(() => {
    if (!selectedAlbumId) return setSongs([])
    api(`/albums/${selectedAlbumId}`).then((album) => setSongs(album.songs)).catch((err) => setError(err.message))
  }, [selectedAlbumId])

  const visibleAlbums = albums

  async function moveAlbum(index, direction) {
    const reordered = [...albums]
    const target = index + direction
    if (target < 0 || target >= reordered.length) return
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setError(''); setMessage('')
    try {
      setAlbums(await patch('/albums/order', { album_ids: reordered.map((album) => album.id) }))
      setMessage('Discography order saved.')
    } catch (err) { setError(err.message) }
  }

  async function moveSong(index, direction) {
    const reordered = [...songs]
    const target = index + direction
    if (target < 0 || target >= reordered.length) return
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setError(''); setMessage('')
    try {
      setSongs(await patch('/songs/order', { song_ids: reordered.map((song) => song.id) }))
      setMessage('Track order saved.')
    } catch (err) { setError(err.message) }
  }

  async function dropAlbum(index) {
    if (draggedIndex === null || draggedIndex === index) return setDragOverIndex(null)
    const reordered = [...albums]
    const [moved] = reordered.splice(draggedIndex, 1)
    reordered.splice(draggedIndex < index ? index - 1 : index, 0, moved)
    setAlbums(reordered); setDraggedIndex(null); setDragOverIndex(null); setError(''); setMessage('')
    try { setAlbums(await patch('/albums/order', { album_ids: reordered.map((album) => album.id) })); setMessage('Discography order saved.') } catch (err) { setError(err.message) }
  }

  async function dropSong(index) {
    if (draggedIndex === null || draggedIndex === index) return setDragOverIndex(null)
    const reordered = [...songs]
    const [moved] = reordered.splice(draggedIndex, 1)
    reordered.splice(draggedIndex < index ? index - 1 : index, 0, moved)
    setSongs(reordered); setDraggedIndex(null); setDragOverIndex(null); setError(''); setMessage('')
    try { setSongs(await patch('/songs/order', { song_ids: reordered.map((song) => song.id) })); setMessage('Track order saved.') } catch (err) { setError(err.message) }
  }

  function clearDrag() { setDraggedIndex(null); setDragOverIndex(null) }

  return (
    <main className="ordering-page">
      <p className="eyebrow">Collection arrangement</p>
      <h1>{section === 'song' ? 'Song order' : section === 'album' ? 'Album order' : 'Arrange'}</h1>
      <p className="editor-intro">Use Up and Down to set the exact order of your albums and tracks. Changes are saved immediately.</p>
      <nav className="editor-subnav" aria-label="Arrangement sections"><Link className={section === 'album' ? 'active' : ''} to="/arrange/albums">Album order</Link><Link className={section === 'song' ? 'active' : ''} to="/arrange/songs">Song order</Link></nav>
      {message && <StateMessage>{message}</StateMessage>}{error && <StateMessage error>{error}</StateMessage>}
      {(section === 'all' || section === 'album') && <section className="editor-section single-editor-section"><p className="eyebrow">01 — Discography</p><h2>Album order</h2>
          <div className="ordering-list">{albums.map((album, index) => <SortableRow key={album.id} index={index} label={album.title} isDragging={draggedIndex === index} isDragOver={dragOverIndex === index} onDragStart={setDraggedIndex} onDragOver={setDragOverIndex} onDrop={dropAlbum} onDragEnd={clearDrag} onMove={moveAlbum} isFirst={index === 0} isLast={index === albums.length - 1} />)}</div>
        </section>}
      {(section === 'all' || section === 'song') && <section className="editor-section single-editor-section"><p className="eyebrow">02 — Album tracks</p><h2>Song order</h2>
          <SelectField label="Album version" value={selectedAlbumId} onChange={setSelectedAlbumId} placeholder="Choose an album version" options={visibleAlbums.map((album) => ({ value: album.id, label: `${album.title} — ${album.version_name ?? ((album.edition_type ?? 'standard') === 'deluxe' ? 'Deluxe' : 'Standard')}` }))} />
          {selectedAlbumId && <div className="ordering-list">{songs.length === 0 ? <p className="empty-tracks">No songs in this album yet.</p> : songs.map((song, index) => <SortableRow key={song.id} index={index} label={song.title} isDragging={draggedIndex === index} isDragOver={dragOverIndex === index} onDragStart={setDraggedIndex} onDragOver={setDragOverIndex} onDrop={dropSong} onDragEnd={clearDrag} onMove={moveSong} isFirst={index === 0} isLast={index === songs.length - 1} />)}</div>}
        </section>}
    </main>
  )
}
