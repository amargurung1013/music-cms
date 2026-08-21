# Personal Discography

A small React and FastAPI archive for albums, songs, and lyrics.

## Run the whole application

### Prerequisites

Install the following tools before starting the application:

- Docker Desktop or Docker Engine with the Compose plugin
- Python 3.11 or newer
- [`uv`](https://docs.astral.sh/uv/)
- Node.js and npm

The application has three parts: a PostgreSQL database, a FastAPI backend, and a Vite/React frontend. Start each part in a separate terminal.

### 1. Start the database

From the project root, run:

```bash
docker compose up -d
```

PostgreSQL runs on `localhost:5433` so it does not conflict with a local PostgreSQL installation using the usual port `5432`. Check its status with:

```bash
docker compose ps
```

### 2. Start the backend API

In a second terminal, from the project root, run:

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

The API is available at http://localhost:8000. Interactive API documentation is available at http://localhost:8000/docs.

The database tables and seed data are created automatically when the API starts.

### 3. Start the frontend

In a third terminal, from the project root, run:

```bash
cd frontend
npm install
npm run dev
```

Open the application at http://localhost:5173. The frontend automatically uses the API at http://localhost:8000.

### 4. Add and manage music

Open http://localhost:5173/edit to add albums and songs. Use the main discography page to browse the collection, or use **Arrange** and **Search** from the navigation.

Albums have two edition types: **Standard album** and **Deluxe album**. Add Standard albums from `/edit/albums`, then create a Deluxe version from `/edit/albums/deluxe` by choosing the Standard album and optionally supplying different artwork. If no Deluxe artwork is supplied, the Standard artwork is reused. The main Discography page shows matching editions as one album card; its detail page starts with Standard artwork and tracks, and lets visitors switch to Deluxe to swap artwork and append the Deluxe tracks. Songs and song arrangement are selected separately for each edition.

Saved albums are also separated in the editor: standard albums are available at `/edit/saved/standard`, and deluxe albums are available at `/edit/saved/deluxe`.

Dedicated edit pages are available at `/edit/albums/edit` and `/edit/songs/edit`. Each page first asks for the edition type, then the album, and finally the record to edit before showing its form.

### Configuration

The backend uses this default database connection:

```text
postgresql+psycopg://postgres:postgres@localhost:5433/songs
```

To use another database, copy `.env.example` to `.env`, set `DATABASE_URL`, and restart the backend. To point the frontend at a different API, set `VITE_API_URL` before running `npm run dev`.

## View the PostgreSQL data

This project runs PostgreSQL inside Docker. The database connection details are:

- Host: `localhost`
- Port: `5433`
- Database: `songs`
- User: `postgres`
- Password: `postgres`

The PostgreSQL container uses the `songs_data` Docker volume, so your albums and songs remain available when the container is stopped and started again.

### 1. Start PostgreSQL

From the project root, run:

```bash
docker compose up -d
```

Check that the database is running:

```bash
docker compose ps
```

You should see `music-cms-database-1` with a status such as `Up` and a port mapping similar to `0.0.0.0:5433->5432/tcp`.

### 2. Open the PostgreSQL terminal

Run this from the project root:

```bash
docker compose exec database psql -U postgres -d songs
```

You are now inside the PostgreSQL command-line client. The prompt will look similar to:

```text
songs=#
```

### 3. List the database tables

Inside `psql`, run:

```sql
\dt
```

This project normally has two tables:

- `albums` — album titles, artwork, release dates, descriptions, and display order
- `songs` — song titles, lyrics, track numbers, and their album IDs

To see the columns and types in a table:

```sql
\d albums
\d songs
```

### 4. Count your saved records

```sql
SELECT COUNT(*) AS album_count FROM albums;
SELECT COUNT(*) AS song_count FROM songs;
```

### 5. View all albums

```sql
SELECT id, title, release_date, display_order
FROM albums
ORDER BY display_order, id;
```

For a wider, easier-to-read display, turn on expanded output first:

```sql
\x on
SELECT * FROM albums ORDER BY display_order, id;
```

Run `\x off` to return to the normal table layout.

### 6. View all songs

```sql
SELECT id, album_id, track_number, title
FROM songs
ORDER BY album_id, track_number, id;
```

To view the lyrics as well:

```sql
SELECT id, album_id, track_number, title, lyrics
FROM songs
ORDER BY album_id, track_number, id;
```

### 7. View albums together with their songs

This query is useful because it replaces the numeric `album_id` with the album title:

```sql
SELECT
  albums.title AS album,
  songs.track_number AS track,
  songs.title AS song,
  songs.lyrics
FROM songs
JOIN albums ON albums.id = songs.album_id
ORDER BY albums.display_order, albums.id, songs.track_number, songs.id;
```

To inspect one album only, add a `WHERE` clause. For example:

```sql
SELECT
  albums.title AS album,
  songs.track_number AS track,
  songs.title AS song,
  songs.lyrics
FROM songs
JOIN albums ON albums.id = songs.album_id
WHERE albums.title = 'Merry, The Man'
ORDER BY songs.track_number, songs.id;
```

### 8. Exit PostgreSQL

When finished, run:

```sql
\q
```

This exits the PostgreSQL terminal but does not delete anything.

### 9. Stop PostgreSQL safely

To stop the container while keeping the database volume and all saved data:

```bash
docker compose stop
```

Start it again later with:

```bash
docker compose start
```

You can also use `docker compose down`; the named `songs_data` volume remains unless you explicitly remove volumes. Do **not** run `docker compose down -v` unless you intend to permanently delete the database volume and its data.

### Optional: connect using a desktop PostgreSQL app

You can also use a tool such as DBeaver, TablePlus, or pgAdmin with these connection settings:

```text
Host:     localhost
Port:     5433
Database: songs
Username: postgres
Password: postgres
```

After connecting, open the `albums` and `songs` tables to browse the saved records.

Seed data is created automatically when the API starts. Replace `PLACEHOLDER_COVER` in `backend/app/seed.py`, or supply a `cover_image` URL when creating albums through the API.

## Adding your music

Open http://localhost:5173/edit after both servers are running. Add an album, then use the song form to select that album, set its track number, and paste its lyrics. The public discography reads from the same database, so the album and tracks appear immediately after saving.

Choose an album in the song form to see its saved tracks. Select **Edit** to update a title, track number, or lyrics, or **Delete** to permanently remove a song.

Use **Edit** in the album list to change an album title, release date, or artwork URL. **Delete** removes the album and all songs it contains after confirmation.

Open **Arrange** in the navigation to set album and song order separately. Use the **Up** and **Down** controls; changes save immediately and are reflected in the discography and album pages.

Open **Search** to find a song by title or any phrase in its lyrics. Each result shows the matching lyric line; selecting it opens the song with the searched text highlighted.

When adding a song, leave **Track number** blank to append it as the final track on its album. Album descriptions can be added or edited in **Edit collection** and appear beneath the cover artwork.

## Accessing the application

### Public visitor view

After the database, backend, and frontend are running, open:

```text
http://localhost:5173
```

Visitors can use the following options:

- **ARCHIVE** — returns to the main archive and discography
- **Discography** — browses the albums and opens album and lyric pages
- **Search** — searches song titles and lyric text

The public navigation does not display **Edit collection** or **Arrange**. **Ask AI** is available from the main navigation.

### Editor view

To manage the collection yourself, open the editor directly:

```text
http://localhost:5173/edit
```

You can also open the arrangement page directly:

```text
http://localhost:5173/arrange
```

These pages are hidden from the public navigation, but they are not password-protected. Anyone who knows these URLs can open them. Add authentication before using this application with untrusted users if the editor must be private.

### Accessing a deployed version

When the frontend is deployed, replace `http://localhost:5173` with the frontend URL supplied by your hosting provider. For example:

```text
https://your-discography.example.com
```

The public pages are available from that base URL:

```text
https://your-discography.example.com/
https://your-discography.example.com/discography
https://your-discography.example.com/search
```

The frontend must be configured with the deployed backend URL using `VITE_API_URL` before building:

```bash
VITE_API_URL=https://your-api.example.com npm run build
```

After deployment, share only the frontend URL with visitors. Keep the backend URL and the `/edit` and `/arrange` paths for your own administration.
