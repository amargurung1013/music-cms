from contextlib import asynccontextmanager
import os

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from .database import Base, SessionLocal, engine
from .routes import ai, albums, search, songs
from .seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    # `create_all` does not alter existing tables, so add this small migration
    # for archives created before manual album ordering was introduced.
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE albums ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0"))
        connection.execute(text("ALTER TABLE albums ADD COLUMN IF NOT EXISTS description TEXT"))
        connection.execute(text("ALTER TABLE albums ADD COLUMN IF NOT EXISTS edition_type VARCHAR(20) NOT NULL DEFAULT 'standard'"))
        connection.execute(text("ALTER TABLE albums ADD COLUMN IF NOT EXISTS version_name VARCHAR(100) NOT NULL DEFAULT 'Standard'"))
        connection.execute(text("ALTER TABLE albums ADD COLUMN IF NOT EXISTS base_album_id INTEGER REFERENCES albums(id) ON DELETE SET NULL"))
        connection.execute(text("UPDATE albums SET version_name = CASE WHEN edition_type = 'deluxe' THEN 'Deluxe' ELSE 'Standard' END WHERE version_name IS NULL OR version_name = '' OR (edition_type = 'deluxe' AND version_name = 'Standard')"))
        connection.execute(text("UPDATE albums AS deluxe SET base_album_id = standard.id FROM albums AS standard WHERE deluxe.edition_type = 'deluxe' AND deluxe.base_album_id IS NULL AND standard.edition_type = 'standard' AND LOWER(TRIM(deluxe.title)) = LOWER(TRIM(standard.title))"))
        connection.execute(text("UPDATE albums SET display_order = id WHERE display_order = 0"))
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(title="Personal Discography API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    # Vite may be opened through either localhost or 127.0.0.1. Keep the
    # explicit local origins, while allowing a configured UI origin for a
    # deployment where the frontend is hosted elsewhere.
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        *filter(None, [os.getenv("FRONTEND_ORIGIN")]),
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(albums.router)
app.include_router(songs.router)
app.include_router(search.router)
app.include_router(ai.router)


@app.exception_handler(RequestValidationError)
async def invalid_request(_: Request, __: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": "Invalid request"})


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
