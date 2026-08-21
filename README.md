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

## Ask AI

Ask AI is a chat interface that answers questions about the albums, songs, descriptions, and lyrics currently stored in this PostgreSQL database. It is powered by a LangGraph workflow and supports either a local Ollama model or Groq's hosted chat API.

The default provider is Ollama, so the AI can run locally without an API key. The backend reloads the latest database content for every question and retrieves relevant content before calling the model.

Ask AI uses the database-grounded system prompt in `backend/app/prompts.py`. It requires the model to use the current retrieved catalog, distinguish facts from interpretations, avoid unsupported rankings such as “most mature,” and state when the database does not contain enough information. The prompt is provider-independent and is also used when `AI_PROVIDER=groq`.

### Recommended local setup: Ollama

Ollama runs the language model on your own computer. Download it from <https://ollama.com/download> for macOS, Windows, or Linux. After installation, confirm that it is available:

```bash
ollama --version
```

Pull a model. Start with the 8-billion-parameter Qwen model:

```bash
ollama pull qwen3:8b
```

You can test it directly:

```bash
ollama run qwen3:8b
```

Type a message, then press `Ctrl+D` or type `/bye` to exit. Ollama normally runs its local API at `http://localhost:11434`. If it is not already running, start it in another terminal:

```bash
ollama serve
```

For better answers, use a larger model if your computer can handle it:

```bash
ollama pull qwen3:14b
ollama pull qwen3:30b
```

Use `qwen3:8b` for modest hardware, `qwen3:14b` for a quality improvement, and `qwen3:30b` only if you have substantial RAM/VRAM. Larger models need more disk space and are slower. See the [official Qwen3 model page](https://ollama.com/library/qwen3) for available sizes.

### Check your computer before choosing a model

Run these commands in a terminal and share the output if you want a model recommendation for your specific computer. They do not expose your API keys or personal files.

On Linux:

```bash
echo "--- operating system ---"
uname -a

echo "--- CPU ---"
lscpu | grep -E 'Model name|Socket|Core\(s\) per socket|CPU\(s\)'

echo "--- memory ---"
free -h

echo "--- disk space ---"
df -h .

echo "--- NVIDIA GPU, if installed ---"
nvidia-smi --query-gpu=name,memory.total,memory.free,driver_version --format=csv,noheader 2>/dev/null || echo "No NVIDIA GPU detected"
```

If `lscpu` or `free` is unavailable, use these alternatives:

```bash
grep -m1 'model name' /proc/cpuinfo
grep MemTotal /proc/meminfo
```

On macOS, run:

```bash
system_profiler SPHardwareDataType
df -h .
```

On Windows PowerShell, run:

```powershell
Get-CimInstance Win32_ComputerSystem | Select-Object TotalPhysicalMemory
Get-CimInstance Win32_Processor | Select-Object Name,NumberOfCores
Get-PSDrive C | Select-Object Used,Free
Get-CimInstance Win32_VideoController | Select-Object Name,AdapterRAM
```

As a rough guide, `qwen3:4b` is the safest choice for low-memory computers, `qwen3:8b` is the recommended balance for most computers, and `qwen3:14b` is appropriate when you have plenty of RAM or VRAM. The model also needs storage space when it is downloaded, and using CPU-only inference will be slower than using a supported GPU.

For the current development computer, the hardware check reported 16 CPU threads, 22 GB of RAM, and an NVIDIA GeForce RTX 5050 Laptop GPU with 8 GB of VRAM. Use `qwen3:8b` as the recommended model:

```bash
ollama pull qwen3:8b
```

Set the root `.env` file to:

```env
AI_PROVIDER=ollama
AI_MODEL=qwen3:8b
OLLAMA_BASE_URL=http://localhost:11434
AI_NUM_CTX=8192
AI_NUM_PREDICT=512
```

The larger `qwen3:14b` model may also run on this computer, but it will be slower and may rely more heavily on system RAM because it will not fit entirely in the 8 GB GPU memory. `qwen3:30b` is not recommended for this hardware.

### Search speed and complete database coverage

Ask AI searches the complete PostgreSQL archive on every request, including newly added albums, song titles, descriptions, and lyrics. It then sends only the highest-ranked matching lyric sections to Ollama. Searching the whole database locally keeps new content discoverable, while sending the entire raw archive to the model on every question would make responses slower and eventually exceed the model context window.

The Ollama settings above optimize for a responsive local model. `AI_NUM_CTX=8192` limits the working context and `AI_NUM_PREDICT=512` limits answer length. Qwen3 reasoning is disabled for normal archive questions so it answers directly instead of spending extra time on hidden reasoning. Increase `AI_NUM_PREDICT` if you need longer answers; lower it to `256` for faster replies.

Configure the project in the root `.env` file:

```env
AI_PROVIDER=ollama
AI_MODEL=qwen3:8b
OLLAMA_BASE_URL=http://localhost:11434
```

If you selected another downloaded model, use its exact name, such as `AI_MODEL=qwen3:14b`. Do not put an Ollama or Groq key in frontend code; Ollama is accessed only by the backend.

Start the database and both application servers as described in [Run the whole application](#run-the-whole-application), then open <http://localhost:5173/ask-ai>.

### Optional hosted setup: Groq

Groq remains available if you prefer a hosted model. Create a key at <https://console.groq.com/keys> and set:

```env
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Restart the backend after changing provider or model settings. Only the selected provider is called.

### Ollama troubleshooting

If Ask AI returns a connection error, check that Ollama is running and that the model exists:

```bash
ollama list
curl http://localhost:11434/api/tags
```

If the model is missing, pull it again with `ollama pull qwen3:8b`. If Ollama runs on another machine, set `OLLAMA_BASE_URL` to that machine's reachable URL, for example `http://192.168.1.20:11434`, and make sure its firewall allows the connection. Keep Ollama bound to a trusted network because the local API does not use API-key authentication.

If responses are slow or the computer runs out of memory, switch to `qwen3:4b` or `qwen3:1.7b`. If answers are too shallow, switch to `qwen3:14b` or `qwen3:30b`.

### Set up the Groq API key

1. Create a Groq account and generate an API key at <https://console.groq.com/keys>.
2. From the project root, create your local environment file:

   ```bash
   cp .env.example .env
   ```

3. Open `.env` and set the key:

   ```text
   GROQ_API_KEY=your_groq_api_key_here
   ```

   Never commit `.env` or expose the key in frontend code. The key is read only by the FastAPI backend.

`GROQ_MODEL` is optional. If it is not set, the application uses `llama-3.3-70b-versatile`. You can choose another Groq-supported chat model by setting, for example:

```text
GROQ_MODEL=llama-3.3-70b-versatile
```

Restart the backend after changing `.env` because environment variables are loaded when FastAPI starts.

### Use the chat

With PostgreSQL, the backend, and the frontend running, open <http://localhost:5173/ask-ai> or select **Ask AI** in the navigation. Example questions include:

- “I am in a reflective mood. Which album would be better for me?”
- “What is this song about?”
- “What is the main conflict of this album?”
- “Compare the themes of these two songs.”

The chat keeps the current conversation in the browser and sends recent messages with each request. The backend reloads the current database library for every question, so newly added or edited music is available without rebuilding the frontend.

Assistant responses support Markdown formatting, including headings, numbered lists, bullet lists, and emphasis. For archive-count or song-list questions, Ask AI receives exact database totals and a complete song index before it analyzes the lyrics, rather than estimating from selected lyric excerpts.

Because the assistant needs the music content to answer, the backend sends the current album and song context, including lyrics, to Groq for each question. Do not use this feature with content you are not permitted to send to a third-party AI provider.

### How the AI feature works

The `POST /ai/ask` endpoint accepts a question and optional conversation history. Its LangGraph workflow has two nodes:

1. `load_library` reads albums, descriptions, song titles, and relevant lyrics from PostgreSQL. It ranks songs against the question and applies a context-size limit so larger libraries fit within the selected model's context limits.
2. `answer_question` sends that library context and the conversation to Groq with instructions to ground its response in the archive and label interpretations as interpretations.

If the library does not contain enough information, the assistant is instructed to say so instead of inventing facts. The feature is an interpretive guide, not a source of facts about music that is not in this database.

To inspect the endpoint, open <http://localhost:8000/docs> and look for `POST /ai/ask`. A request has this shape:

```json
{
  "message": "What is the main conflict of Eastern Values?",
  "history": []
}
```

If `GROQ_API_KEY` is missing, the endpoint returns `503`. If Groq cannot be reached or returns an error, it returns `502`; the original album, song, search, and editing features continue to work.

### Stop the application

Stop the backend and frontend with `Ctrl+C` in their terminals. Stop PostgreSQL while keeping all saved data with:

```bash
docker compose stop
```

Start the database again later with `docker compose start`. `docker compose down` also preserves the named `songs_data` volume. Do not run `docker compose down -v` unless you intend to delete the database and all saved data.

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

The public navigation does not display **Edit collection**, **Arrange**, or **Ask AI**.

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
