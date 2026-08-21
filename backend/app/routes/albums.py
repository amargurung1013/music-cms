from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Album
from ..schemas import AlbumCreate, AlbumDetail, AlbumOrderUpdate, AlbumSummary, AlbumUpdate

router = APIRouter(prefix="/albums", tags=["albums"])


@router.get("", response_model=list[AlbumSummary])
def list_albums(db: Session = Depends(get_db)) -> list[Album]:
    return list(db.scalars(select(Album).order_by(Album.display_order, Album.id)).all())


@router.patch("/order", response_model=list[AlbumSummary])
def update_album_order(payload: AlbumOrderUpdate, db: Session = Depends(get_db)) -> list[Album]:
    if len(set(payload.album_ids)) != len(payload.album_ids):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Album IDs must be unique")
    album_ids = set(db.scalars(select(Album.id)).all())
    if set(payload.album_ids) != album_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Album order must include every album")
    for position, album_id in enumerate(payload.album_ids, start=1):
        album = db.get(Album, album_id)
        if album is not None:
            album.display_order = position
    db.commit()
    return list(db.scalars(select(Album).order_by(Album.display_order, Album.id)).all())


@router.get("/{album_id}", response_model=AlbumDetail)
def get_album(album_id: int, db: Session = Depends(get_db)) -> Album:
    album = db.scalar(select(Album).options(selectinload(Album.songs)).where(Album.id == album_id))
    if album is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")
    return album


@router.post("", response_model=AlbumSummary, status_code=status.HTTP_201_CREATED)
def create_album(payload: AlbumCreate, db: Session = Depends(get_db)) -> Album:
    last_order = db.scalar(select(func.max(Album.display_order))) or 0
    album = Album(**payload.model_dump(), display_order=last_order + 1)
    db.add(album)
    db.commit()
    db.refresh(album)
    return album


@router.patch("/{album_id}", response_model=AlbumSummary)
def update_album(album_id: int, payload: AlbumUpdate, db: Session = Depends(get_db)) -> Album:
    album = db.get(Album, album_id)
    if album is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("title") is None and "title" in changes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Album title cannot be empty")
    for field, value in changes.items():
        setattr(album, field, value)
    db.commit()
    db.refresh(album)
    return album


@router.delete("/{album_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_album(album_id: int, db: Session = Depends(get_db)) -> None:
    album = db.get(Album, album_id)
    if album is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")
    db.delete(album)
    db.commit()
