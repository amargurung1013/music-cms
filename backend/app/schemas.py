from pydantic import BaseModel, ConfigDict, Field


class AlbumCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    edition_type: str = Field(default="standard", pattern="^(standard|deluxe)$")
    version_name: str = Field(default="Standard", min_length=1, max_length=100)
    base_album_id: int | None = None
    cover_image: str | None = None
    release_date: str | None = Field(default=None, max_length=50)
    description: str | None = None


class AlbumSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    edition_type: str
    version_name: str
    base_album_id: int | None
    cover_image: str | None
    release_date: str | None
    description: str | None
    display_order: int


class AlbumOrderUpdate(BaseModel):
    album_ids: list[int] = Field(min_length=1)


class AlbumUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    edition_type: str | None = Field(default=None, pattern="^(standard|deluxe)$")
    version_name: str | None = Field(default=None, min_length=1, max_length=100)
    base_album_id: int | None = None
    cover_image: str | None = None
    release_date: str | None = Field(default=None, max_length=50)
    description: str | None = None


class SongCreate(BaseModel):
    album_id: int
    title: str = Field(min_length=1, max_length=255)
    track_number: int | None = Field(default=None, ge=1)
    lyrics: str


class SongRead(SongCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class SongUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    track_number: int | None = Field(default=None, ge=1)
    lyrics: str | None = None


class SongOrderUpdate(BaseModel):
    song_ids: list[int] = Field(min_length=1)


class SongSearchResult(BaseModel):
    id: int
    album_id: int
    album_title: str
    title: str
    track_number: int
    matching_line: str


class SongRecommendation(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    album_id: int
    album_title: str
    album_cover_image: str | None
    title: str


class RandomLyric(BaseModel):
    id: int
    album_id: int
    title: str
    album_title: str
    album_cover_image: str | None
    lyric: str
    lyrics: str


class AlbumDetail(AlbumSummary):
    songs: list[SongRead]
