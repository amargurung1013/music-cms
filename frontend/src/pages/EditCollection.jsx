import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { api, patch, post, remove } from '../api'
import StateMessage from '../components/StateMessage'
import SelectField from '../components/SelectField'

const emptyAlbum = { title: '', edition_type: 'standard', version_name: 'Standard', release_date: '', cover_image: '', description: '' }
const emptySong = { album_id: '', title: '', track_number: '', lyrics: '' }

export default function EditCollection({ section = 'all' }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [albums, setAlbums] = useState([])
  const [albumForm, setAlbumForm] = useState(emptyAlbum)
  const [versionAlbumId, setVersionAlbumId] = useState('')
  const [versionName, setVersionName] = useState('')
  const [versionCover, setVersionCover] = useState('')
  const [deluxeAlbumId, setDeluxeAlbumId] = useState('')
  const [deluxeCover, setDeluxeCover] = useState('')
  const [songForm, setSongForm] = useState(emptySong)
  const [songEdition, setSongEdition] = useState('')
  const [editAlbumEdition, setEditAlbumEdition] = useState('')
  const [editAlbumSelection, setEditAlbumSelection] = useState('')
  const [editSongEdition, setEditSongEdition] = useState('')
  const [editSongAlbumSelection, setEditSongAlbumSelection] = useState('')
  const [editSongSelection, setEditSongSelection] = useState('')
  const [editSongs, setEditSongs] = useState([])
  const [deleteAlbumSelection, setDeleteAlbumSelection] = useState('')
  const [deleteSongAlbumSelection, setDeleteSongAlbumSelection] = useState('')
  const [deleteSongSelection, setDeleteSongSelection] = useState('')
  const [deleteSongs, setDeleteSongs] = useState([])
  const [songs, setSongs] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editingAlbumId, setEditingAlbumId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadAlbums = () => api('/albums').then(setAlbums).catch((err) => setError(err.message))
  const loadSongs = (albumId) => {
    if (!albumId) return setSongs([])
    return api(`/albums/${albumId}`).then((album) => setSongs(album.songs)).catch((err) => setError(err.message))
  }
  useEffect(() => { loadAlbums() }, [])
  useEffect(() => { loadSongs(songForm.album_id) }, [songForm.album_id])
  useEffect(() => {
    const albumId = Number(searchParams.get('edit'))
    if (section !== 'album' || !albumId || editingAlbumId || !albums.length) return
    const album = albums.find((item) => item.id === albumId)
    if (album) {
      setAlbumForm({ title: album.title, edition_type: album.edition_type ?? 'standard', version_name: album.version_name ?? 'Standard', release_date: album.release_date ?? '', cover_image: album.cover_image ?? '', description: album.description ?? '' })
      setEditingAlbumId(album.id)
    }
  }, [albums, editingAlbumId, searchParams, section])
  useEffect(() => {
    const albumId = searchParams.get('album')
    if (section === 'song' && albumId && !songForm.album_id) setSongForm((current) => ({ ...current, album_id: albumId }))
  }, [searchParams, section, songForm.album_id])
  useEffect(() => {
    if (!songForm.album_id || !albums.length) return
    const album = albums.find((item) => item.id === Number(songForm.album_id))
    if (album) setSongEdition(album.edition_type ?? 'standard')
  }, [albums, songForm.album_id])
  useEffect(() => {
    const songId = Number(searchParams.get('edit'))
    if (section !== 'song' || !songId || editingId || !songs.length) return
    const song = songs.find((item) => item.id === songId)
    if (song) {
      setSongForm({ album_id: String(song.album_id), title: song.title, track_number: String(song.track_number), lyrics: song.lyrics })
      setEditingId(song.id)
    }
  }, [editingId, searchParams, section, songs])
  useEffect(() => {
    if (!editSongAlbumSelection) return setEditSongs([])
    api(`/albums/${editSongAlbumSelection}`).then((album) => setEditSongs(album.songs)).catch((err) => setError(err.message))
  }, [editSongAlbumSelection])
  useEffect(() => {
    if (!deleteSongAlbumSelection) return setDeleteSongs([])
    api(`/albums/${deleteSongAlbumSelection}`).then((album) => setDeleteSongs(album.songs)).catch((err) => setError(err.message))
  }, [deleteSongAlbumSelection])

  async function addAlbum(event) {
    event.preventDefault(); setError(''); setMessage('')
    try {
      const payload = { ...albumForm, cover_image: albumForm.cover_image || null, release_date: albumForm.release_date || null, description: albumForm.description || null }
      const album = editingAlbumId ? await patch(`/albums/${editingAlbumId}`, payload) : await post('/albums', payload)
      setAlbumForm(emptyAlbum); setEditingAlbumId(null)
      if (!editingAlbumId) setSongForm((current) => ({ ...current, album_id: String(album.id) }))
      await loadAlbums(); setMessage(editingAlbumId ? `“${album.title}” was updated.` : `“${album.title}” was added. You can add its songs below.`)
    } catch (err) { setError(err.message) }
  }

  async function addDeluxe(event) {
    event.preventDefault(); setError(''); setMessage('')
    const standard = albums.find((album) => album.id === Number(deluxeAlbumId))
    if (!standard) return setError('Choose a Standard album first.')
    try {
      const payload = {
        title: standard.title,
        edition_type: 'deluxe',
        cover_image: deluxeCover.trim() || standard.cover_image || null,
        release_date: standard.release_date,
        description: standard.description,
      }
      const album = await post('/albums', payload)
      setDeluxeAlbumId(''); setDeluxeCover('')
      await loadAlbums()
      setMessage(`Deluxe version of “${album.title}” was added. You can now add its Deluxe songs.`)
    } catch (err) { setError(err.message) }
  }

  async function addVersion(event) {
    event.preventDefault(); setError(''); setMessage('')
    const baseAlbum = albums.find((album) => album.id === Number(versionAlbumId))
    if (!baseAlbum) return setError('Choose an album first.')
    try {
      const normalizedName = versionName.trim()
      const album = await post('/albums', { title: baseAlbum.title, edition_type: normalizedName.toLowerCase() === 'deluxe' ? 'deluxe' : 'standard', version_name: normalizedName, base_album_id: baseAlbum.base_album_id ?? baseAlbum.id, cover_image: versionCover.trim() || baseAlbum.cover_image || null, release_date: baseAlbum.release_date, description: baseAlbum.description })
      setVersionAlbumId(''); setVersionName(''); setVersionCover(''); await loadAlbums()
      setMessage(`“${album.version_name}” version of “${album.title}” was added. You can now add songs to it.`)
    } catch (err) { setError(err.message) }
  }

  function editAlbum(album) {
    setEditingAlbumId(album.id)
    setAlbumForm({ title: album.title, edition_type: album.edition_type ?? 'standard', version_name: album.version_name ?? 'Standard', release_date: album.release_date ?? '', cover_image: album.cover_image ?? '', description: album.description ?? '' })
    setMessage('Editing this album. Save your changes when you are ready.'); setError('')
    navigate(`/edit/albums?edit=${album.id}`)
  }

  function cancelAlbumEdit() {
    setEditingAlbumId(null); setAlbumForm(emptyAlbum); setMessage('')
  }

  function selectAlbumToEdit(albumId) {
    const album = albums.find((item) => item.id === Number(albumId))
    setEditAlbumSelection(albumId)
    setEditingAlbumId(album?.id ?? null)
    if (album) setAlbumForm({ title: album.title, edition_type: album.edition_type ?? 'standard', version_name: album.version_name ?? 'Standard', release_date: album.release_date ?? '', cover_image: album.cover_image ?? '', description: album.description ?? '' })
  }

  function selectSongToEdit(songId) {
    const song = editSongs.find((item) => item.id === Number(songId))
    setEditSongSelection(songId)
    setEditingId(song?.id ?? null)
    if (song) setSongForm({ album_id: String(song.album_id), title: song.title, track_number: String(song.track_number), lyrics: song.lyrics })
  }

  async function deleteAlbum(album) {
    if (!window.confirm(`Delete “${album.title}” and every song inside it? This cannot be undone.`)) return
    setError(''); setMessage('')
    try {
      await remove(`/albums/${album.id}`)
      if (editingAlbumId === album.id) cancelAlbumEdit()
      if (Number(songForm.album_id) === album.id) {
        setSongForm(emptySong); setSongs([]); setEditingId(null)
      }
      await loadAlbums()
      setMessage(`“${album.title}” and its songs were deleted.`)
    } catch (err) { setError(err.message) }
  }

  async function saveSong(event) {
    event.preventDefault(); setError(''); setMessage('')
    try {
      const payload = { title: songForm.title, lyrics: songForm.lyrics, ...(songForm.track_number ? { track_number: Number(songForm.track_number) } : {}) }
      const song = editingId ? await patch(`/songs/${editingId}`, payload) : await post('/songs', { ...payload, album_id: Number(songForm.album_id) })
      setSongForm((current) => ({ ...emptySong, album_id: current.album_id })); setEditingId(null)
      await loadSongs(songForm.album_id)
      setMessage(editingId ? `“${song.title}” was updated.` : `“${song.title}” was added. It is now visible on its album page.`)
    } catch (err) { setError(err.message) }
  }

  function editSong(song) {
    setEditingId(song.id)
    setSongForm({ album_id: String(song.album_id), title: song.title, track_number: String(song.track_number), lyrics: song.lyrics })
    setMessage('Editing this song. Save your changes when you are ready.'); setError('')
    navigate(`/edit/songs?album=${song.album_id}&edit=${song.id}`)
  }

  function cancelEdit() {
    setEditingId(null); setSongForm((current) => ({ ...emptySong, album_id: current.album_id })); setMessage('')
  }

  async function deleteSong(song) {
    if (!window.confirm(`Delete “${song.title}”? This cannot be undone.`)) return
    setError(''); setMessage('')
    try {
      await remove(`/songs/${song.id}`)
      if (editingId === song.id) cancelEdit()
      await loadSongs(songForm.album_id)
      setMessage(`“${song.title}” was deleted.`)
    } catch (err) { setError(err.message) }
  }

  async function deleteSelectedAlbum() {
    const album = albums.find((item) => item.id === Number(deleteAlbumSelection))
    if (!album) return setError('Choose an album version first.')
    await deleteAlbum(album)
    setDeleteAlbumSelection('')
  }

  async function deleteSelectedSong() {
    const song = deleteSongs.find((item) => item.id === Number(deleteSongSelection))
    if (!song) return setError('Choose a song first.')
    await deleteSong(song)
    setDeleteSongSelection('')
    setDeleteSongs((current) => current.filter((item) => item.id !== song.id))
  }

  const savedEdition = section === 'saved-deluxe' ? 'deluxe' : 'standard'
  const savedAlbums = albums.filter((album) => (album.edition_type ?? 'standard') === savedEdition)
  const songAlbums = albums
  const editAlbumOptions = albums
  const editSongAlbumOptions = albums
  const standardAlbumsWithoutDeluxe = albums.filter((album) => (album.edition_type ?? 'standard') === 'standard' && !albums.some((candidate) => (candidate.edition_type ?? 'standard') === 'deluxe' && candidate.title.trim().toLocaleLowerCase() === album.title.trim().toLocaleLowerCase()))
  const baseAlbums = albums.filter((album) => (album.edition_type ?? 'standard') === 'standard' && !album.base_album_id)
  const pageTitle = section === 'album' ? 'Add a Standard album' : section === 'versions' ? 'Add an album version' : section === 'deluxe' ? 'Add a Deluxe version' : section === 'song' ? 'Add a song' : section === 'edit-album' ? 'Edit an album' : section === 'edit-song' ? 'Edit a song' : section === 'delete-album' ? 'Delete an album' : section === 'delete-song' ? 'Delete a song' : section === 'saved-deluxe' ? 'Saved deluxe albums' : section === 'saved-standard' ? 'Saved standard albums' : section === 'saved' ? 'Saved albums' : 'Edit collection'

  return (
    <main className="editor-page">
      <p className="eyebrow">Private editor</p><h1>{pageTitle}</h1>
      <p className="editor-intro">Add an album first, then select it to add, edit, or remove tracks and lyrics. Everything saves directly to your archive.</p>
      <div className="editor-layout">
        <aside className="editor-sidebar">
          <p className="editor-nav-title">Editor menu</p>
          <nav className="editor-nav" aria-label="Collection editor sections">
            <div className="editor-nav-group"><span className="editor-nav-label">Create</span><NavLink to="/edit/albums" end>01 — Add album</NavLink><NavLink to="/edit/albums/versions">01b — Add version</NavLink><NavLink to="/edit/songs">02 — Add song</NavLink></div>
            <div className="editor-nav-group"><span className="editor-nav-label">Manage</span><NavLink to="/edit/saved/standard">03 — Saved albums</NavLink><NavLink to="/edit/albums/edit">04 — Edit album</NavLink><NavLink to="/edit/songs/edit">05 — Edit song</NavLink></div>
            <div className="editor-nav-group"><span className="editor-nav-label">Remove</span><NavLink to="/edit/albums/delete">06 — Delete album</NavLink><NavLink to="/edit/songs/delete">07 — Delete song</NavLink></div>
          </nav>
        </aside>
        <div className="editor-content">
      {section === 'versions' && <section className="editor-section single-editor-section"><p className="eyebrow">01b — Album version</p><h2>Add an album version</h2><p className="editor-intro">Choose an album, name its new version, and optionally provide different artwork. Leave artwork blank to reuse the selected album’s cover.</p><form onSubmit={addVersion}><SelectField label="Album" required value={versionAlbumId} onChange={setVersionAlbumId} placeholder="Choose an album" options={baseAlbums.map((album) => ({ value: album.id, label: album.title }))} /><label>Version name<input required placeholder="Deluxe, Merry Edition, Acoustic…" value={versionName} onChange={(event) => setVersionName(event.target.value)} /></label><label>Version artwork URL <span>optional — base artwork is used when blank</span><input type="url" placeholder="https://…" value={versionCover} onChange={(event) => setVersionCover(event.target.value)} /></label><div className="form-actions"><button type="submit">Create version</button></div></form></section>}
      {(section === 'saved' || section === 'saved-standard' || section === 'saved-deluxe') && <nav className="editor-subnav" aria-label="Saved album sections"><Link className={savedEdition === 'standard' ? 'active' : ''} to="/edit/saved/standard">Standard albums</Link><Link className={savedEdition === 'deluxe' ? 'active' : ''} to="/edit/saved/deluxe">Deluxe albums</Link></nav>}
      {message && <StateMessage>{message}</StateMessage>}{error && <StateMessage error>{error}</StateMessage>}
      {section === 'edit-album' && <section className="editor-section single-editor-section"><p className="eyebrow">04 — Edit album</p><h2>Choose an album version to edit</h2><SelectField label="Album version" value={editAlbumSelection} onChange={selectAlbumToEdit} placeholder="Choose an album version" options={editAlbumOptions.map((album) => ({ value: album.id, label: `${album.title} — ${album.version_name ?? ((album.edition_type ?? 'standard') === 'deluxe' ? 'Deluxe' : 'Standard')}` }))} />{editingAlbumId && <form onSubmit={addAlbum}>
            <label>Album title<input required value={albumForm.title} onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })} /></label><label>Version name<input required value={albumForm.version_name ?? ''} onChange={(e) => setAlbumForm({ ...albumForm, version_name: e.target.value })} /></label><label>Release year or date<input value={albumForm.release_date} onChange={(e) => setAlbumForm({ ...albumForm, release_date: e.target.value })} /></label><label>Artwork URL <span>optional</span><input type="url" value={albumForm.cover_image} onChange={(e) => setAlbumForm({ ...albumForm, cover_image: e.target.value })} /></label><label>Album description <span>optional</span><textarea rows="4" value={albumForm.description} onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })} /></label><div className="form-actions"><button type="submit">Save changes</button><button type="button" className="secondary-button" onClick={cancelAlbumEdit}>Cancel</button></div>
          </form>}</section>}
      {section === 'edit-song' && <section className="editor-section single-editor-section"><p className="eyebrow">05 — Edit song</p><h2>Choose a song to edit</h2><SelectField label="Album version" value={editSongAlbumSelection} onChange={(value) => { setEditSongAlbumSelection(value); setEditSongSelection(''); setEditingId(null) }} placeholder="Choose an album version" options={editSongAlbumOptions.map((album) => ({ value: album.id, label: `${album.title} — ${album.version_name ?? ((album.edition_type ?? 'standard') === 'deluxe' ? 'Deluxe' : 'Standard')}` }))} />{editSongAlbumSelection && <SelectField label="Song" value={editSongSelection} onChange={selectSongToEdit} placeholder="Choose a song" options={editSongs.map((song) => ({ value: song.id, label: `${song.track_number}. ${song.title}` }))} />}{editingId && <form onSubmit={saveSong}><label>Song title<input required value={songForm.title} onChange={(e) => setSongForm({ ...songForm, title: e.target.value })} /></label><label>Track number<input min="1" type="number" value={songForm.track_number} onChange={(e) => setSongForm({ ...songForm, track_number: e.target.value })} /></label><label>Lyrics<textarea required rows="10" value={songForm.lyrics} onChange={(e) => setSongForm({ ...songForm, lyrics: e.target.value })} /></label><div className="form-actions"><button type="submit">Save changes</button><button type="button" className="secondary-button" onClick={cancelEdit}>Cancel</button></div></form>}</section>}
      {section === 'delete-album' && <section className="editor-section single-editor-section"><p className="eyebrow">06 — Delete album</p><h2>Choose an album to delete</h2><p className="editor-intro">Deleting an album permanently deletes every song inside that album.</p><SelectField label="Album version" value={deleteAlbumSelection} onChange={(value) => { setDeleteAlbumSelection(value); setError('') }} placeholder="Choose an album version" options={albums.map((album) => ({ value: album.id, label: `${album.title} — ${album.version_name ?? ((album.edition_type ?? 'standard') === 'deluxe' ? 'Deluxe' : 'Standard')}` }))} />{deleteAlbumSelection && <div className="form-actions"><button type="button" className="delete-action-button" onClick={deleteSelectedAlbum}>Delete album and all songs</button></div>}</section>}
      {section === 'delete-song' && <section className="editor-section single-editor-section"><p className="eyebrow">07 — Delete song</p><h2>Choose a song to delete</h2><SelectField label="Album version" value={deleteSongAlbumSelection} onChange={(value) => { setDeleteSongAlbumSelection(value); setDeleteSongSelection(''); setError('') }} placeholder="Choose an album version" options={albums.map((album) => ({ value: album.id, label: `${album.title} — ${album.version_name ?? ((album.edition_type ?? 'standard') === 'deluxe' ? 'Deluxe' : 'Standard')}` }))} />{deleteSongAlbumSelection && <SelectField label="Song" value={deleteSongSelection} onChange={(value) => { setDeleteSongSelection(value); setError('') }} placeholder="Choose a song" options={deleteSongs.map((song) => ({ value: song.id, label: `${song.track_number}. ${song.title}` }))} />}{deleteSongSelection && <div className="form-actions"><button type="button" className="delete-action-button" onClick={deleteSelectedSong}>Delete song</button></div>}</section>}
      {(section === 'all' || section === 'album') && <section className="editor-section single-editor-section" id="add-album"><p className="eyebrow">01 — Album</p><h2>{editingAlbumId ? 'Edit album' : 'Add an album'}</h2>
          <form onSubmit={addAlbum}>
            <label>Album title<input required value={albumForm.title} onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })} /></label>
            <label>Release year or date<input placeholder="2026" value={albumForm.release_date} onChange={(e) => setAlbumForm({ ...albumForm, release_date: e.target.value })} /></label>
            <label>Artwork URL <span>optional</span><input type="url" placeholder="https://…" value={albumForm.cover_image} onChange={(e) => setAlbumForm({ ...albumForm, cover_image: e.target.value })} /></label>
            <label>Album description <span>optional</span><textarea rows="4" placeholder="A few words about this album." value={albumForm.description} onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })} /></label>
            <div className="form-actions"><button type="submit">{editingAlbumId ? 'Save changes' : 'Save album'}</button>{editingAlbumId && <button type="button" className="secondary-button" onClick={cancelAlbumEdit}>Cancel</button>}</div>
          </form>
        </section>}
      {(section === 'all' || section === 'song') && <section className="editor-section single-editor-section" id="add-song"><p className="eyebrow">02 — Song</p><h2>{editingId ? 'Edit song' : 'Add a song'}</h2>
          <form onSubmit={saveSong}>
            <SelectField label="Album version" required disabled={Boolean(editingId)} value={songForm.album_id} onChange={(value) => setSongForm({ ...songForm, album_id: value })} placeholder="Choose an album version" options={songAlbums.map((album) => ({ value: album.id, label: `${album.title} — ${album.version_name ?? ((album.edition_type ?? 'standard') === 'deluxe' ? 'Deluxe' : 'Standard')}` }))} />
            <label>Song title<input required value={songForm.title} onChange={(e) => setSongForm({ ...songForm, title: e.target.value })} /></label>
            <label>Track number <span>optional — added last when blank</span><input min="1" type="number" value={songForm.track_number} onChange={(e) => setSongForm({ ...songForm, track_number: e.target.value })} /></label>
            <label>Lyrics<textarea required rows="10" placeholder={'[Verse 1]\nWrite lyrics exactly as you want them displayed.'} value={songForm.lyrics} onChange={(e) => setSongForm({ ...songForm, lyrics: e.target.value })} /></label>
            <div className="form-actions"><button type="submit">{editingId ? 'Save changes' : 'Save song'}</button>{editingId && <button type="button" className="secondary-button" onClick={cancelEdit}>Cancel</button>}</div>
          </form>
          {songForm.album_id && <div className="saved-songs"><p className="eyebrow">Saved tracks</p>{songs.length === 0 ? <p className="empty-tracks">No songs in this album yet.</p> : songs.map((song) => <div className="saved-song" key={song.id}><span>{song.track_number}. {song.title}</span><div><button type="button" className="text-button" onClick={() => editSong(song)}>Edit</button><button type="button" className="text-button delete-button" onClick={() => deleteSong(song)}>Delete</button></div></div>)}</div>}
        </section>}
      {(section === 'all' || section === 'saved' || section === 'saved-standard' || section === 'saved-deluxe') && <details open className="editor-section saved-albums-section" id="saved-albums">
        <summary><span className="eyebrow">03 — Collection</span><h2>Saved albums</h2></summary>
        {savedAlbums.length === 0 ? <p className="empty-tracks">No {savedEdition} albums saved yet.</p> : <div className="album-order">{savedAlbums.map((album) => <div className="saved-song" key={album.id}><span>{album.title}</span><div><button type="button" className="text-button" onClick={() => editAlbum(album)}>Edit</button><button type="button" className="text-button delete-button" onClick={() => deleteAlbum(album)}>Delete</button></div></div>)}</div>}
      </details>}
        </div>
      </div>
    </main>
  )
}
