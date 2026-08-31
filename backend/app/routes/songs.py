import random

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Album, Song
from ..schemas import RandomLyric, SongCreate, SongOrderUpdate, SongRead, SongRecommendation, SongUpdate

router = APIRouter(prefix="/songs", tags=["songs"])


@router.get("/random-lyric", response_model=RandomLyric)
def random_lyric(db: Session = Depends(get_db)) -> RandomLyric:
    row = db.execute(
        select(Song, Album.title, Album.cover_image)
        .join(Album, Song.album_id == Album.id)
        .order_by(func.random())
        .limit(1)
    ).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No songs found")
    song, album_title, cover_image = row
    lines = [line.strip() for line in song.lyrics.splitlines() if line.strip() and not line.strip().startswith('[')]
    full_lyrics = ' • '.join(lines) or song.title
    return RandomLyric(id=song.id, album_id=song.album_id, title=song.title, album_title=album_title, album_cover_image=cover_image, lyric=random.choice(lines or [song.lyrics]), lyrics=full_lyrics)


@router.get("/recommended", response_model=list[SongRecommendation])
def recommended_songs(
    exclude_song_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[SongRecommendation]:
    current_album_id = None
    if exclude_song_id is not None:
        current_song = db.get(Song, exclude_song_id)
        current_album_id = current_song.album_id if current_song else None
    query = select(Song, Album.title, Album.cover_image).join(Album, Song.album_id == Album.id)
    if exclude_song_id is not None:
        query = query.where(Song.id != exclude_song_id)
    if current_album_id is not None:
        query = query.where(Song.album_id != current_album_id)
    rows = db.execute(query).all()
    songs_by_album = {}
    for song, album_title, cover_image in rows:
        songs_by_album.setdefault(song.album_id, []).append((song, album_title, cover_image))
    recommendations = [random.choice(album_songs) for album_songs in songs_by_album.values()]
    random.shuffle(recommendations)
    return [
        SongRecommendation(
            id=song.id,
            album_id=song.album_id,
            album_title=album_title,
            album_cover_image=cover_image,
            title=song.title,
        )
        for song, album_title, cover_image in recommendations[:3]
    ]


@router.get("/{song_id}", response_model=SongRead)
def get_song(song_id: int, db: Session = Depends(get_db)) -> Song:
    song = db.get(Song, song_id)
    if song is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found")
    return song


@router.patch("/order", response_model=list[SongRead])
def update_song_order(payload: SongOrderUpdate, db: Session = Depends(get_db)) -> list[Song]:
    if len(set(payload.song_ids)) != len(payload.song_ids):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Song IDs must be unique")
    songs = list(db.scalars(select(Song).where(Song.id.in_(payload.song_ids))).all())
    if len(songs) != len(payload.song_ids):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Song order contains an unknown song")
    if len({song.album_id for song in songs}) != 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Songs must belong to the same album")
    if set(payload.song_ids) != set(db.scalars(select(Song.id).where(Song.album_id == songs[0].album_id)).all()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Song order must include every song in the album")
    songs_by_id = {song.id: song for song in songs}
    for track_number, song_id in enumerate(payload.song_ids, start=1):
        songs_by_id[song_id].track_number = track_number
    db.commit()
    return [songs_by_id[song_id] for song_id in payload.song_ids]


@router.post("", response_model=SongRead, status_code=status.HTTP_201_CREATED)
def create_song(payload: SongCreate, db: Session = Depends(get_db)) -> Song:
    if db.get(Album, payload.album_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")
    song_data = payload.model_dump()
    if song_data["track_number"] is None:
        song_data["track_number"] = (db.scalar(select(func.max(Song.track_number)).where(Song.album_id == payload.album_id)) or 0) + 1
    song = Song(**song_data)
    db.add(song)
    db.commit()
    db.refresh(song)
    return song


@router.patch("/{song_id}", response_model=SongRead)
def update_song(song_id: int, payload: SongUpdate, db: Session = Depends(get_db)) -> Song:
    song = db.get(Song, song_id)
    if song is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(song, field, value)
    db.commit()
    db.refresh(song)
    return song


@router.delete("/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_song(song_id: int, db: Session = Depends(get_db)) -> None:
    song = db.get(Song, song_id)
    if song is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found")
    db.delete(song)
    db.commit()
