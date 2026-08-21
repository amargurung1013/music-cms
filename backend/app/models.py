from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Album(Base):
    __tablename__ = "albums"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    edition_type: Mapped[str] = mapped_column(String(20), nullable=False, default="standard", server_default="standard")
    version_name: Mapped[str] = mapped_column(String(100), nullable=False, default="Standard", server_default="Standard")
    base_album_id: Mapped[int | None] = mapped_column(ForeignKey("albums.id", ondelete="SET NULL"), nullable=True)
    cover_image: Mapped[str | None] = mapped_column(Text, nullable=True)
    release_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    songs: Mapped[list[Song]] = relationship(
        back_populates="album", cascade="all, delete-orphan", order_by="Song.track_number"
    )


class Song(Base):
    __tablename__ = "songs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    album_id: Mapped[int] = mapped_column(ForeignKey("albums.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    track_number: Mapped[int] = mapped_column(Integer, nullable=False)
    lyrics: Mapped[str] = mapped_column(Text, nullable=False)
    album: Mapped[Album] = relationship(back_populates="songs")
