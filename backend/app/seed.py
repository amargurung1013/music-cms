from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Album, Song

# Replace this remote placeholder URL with the URL of your own album artwork.
PLACEHOLDER_COVER = "https://placehold.co/1200x1200/171717/f4f1eb?text=Eastern%0AValues"


def seed_database(db: Session) -> None:
    if db.scalar(select(Album.id).limit(1)) is not None:
        return

    album = Album(title="Eastern Values", cover_image=PLACEHOLDER_COVER, release_date="2026", display_order=1)
    album.songs = [
        Song(track_number=1, title="Song 1", lyrics="[Verse 1]\nA place for the first words.\n\n[Chorus]\nA place for the refrain."),
        Song(track_number=2, title="Song 2", lyrics="[Verse 1]\nThese lines remain exactly as you write them.\n\n[Chorus]\nKeep the song close."),
        Song(track_number=3, title="Song 3", lyrics="[Verse 1]\nAnother unwritten page.\n\n[Chorus]\nA quiet archive of songs."),
        Song(track_number=4, title="Song 4", lyrics="[Verse 1]\nThe final track begins here.\n\n[Outro]\nUntil the next record."),
    ]
    db.add(album)
    db.commit()
