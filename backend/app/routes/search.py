from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Album, Song
from ..schemas import SongSearchResult

router = APIRouter(prefix="/search", tags=["search"])


def first_matching_line(lyrics: str, query: str) -> str:
    query_lower = query.casefold()
    return next(
        (line for line in lyrics.splitlines() if query_lower in line.casefold()),
        "Match found in the song lyrics.",
    )


@router.get("/songs", response_model=list[SongSearchResult])
def search_songs(
    q: str = Query(min_length=2, max_length=200),
    db: Session = Depends(get_db),
) -> list[SongSearchResult]:
    # Escape SQL wildcard characters so people can search for literal lyric text.
    escaped_query = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    pattern = f"%{escaped_query}%"
    results = db.execute(
        select(Song, Album.title)
        .join(Album, Song.album_id == Album.id)
        .where(or_(Song.title.ilike(pattern, escape="\\"), Song.lyrics.ilike(pattern, escape="\\")))
        .order_by(Album.display_order, Song.track_number)
    ).all()
    return [
        SongSearchResult(
            id=song.id,
            album_id=song.album_id,
            album_title=album_title,
            title=song.title,
            track_number=song.track_number,
            matching_line=first_matching_line(song.lyrics, q),
        )
        for song, album_title in results
    ]
