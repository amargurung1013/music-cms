from __future__ import annotations

import os
import re
from typing import Any, TypedDict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langchain_ollama import ChatOllama
from langgraph.graph import END, START, StateGraph
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .models import Album
from .prompts import SYSTEM_PROMPT


class AskState(TypedDict, total=False):
    question: str
    history: list[dict[str, str]]
    context: str
    sources: list[str]
    answer: str


MAX_CONTEXT_CHARS = 16000


def _exact_archive_answer(db: Session, question: str) -> str | None:
    """Answer factual archive inventory questions directly from PostgreSQL."""
    normalized = question.casefold()
    inventory_phrases = (
        "how many", "count", "total", "list", "all songs", "all tracks",
        "all albums", "what songs", "which songs", "songs in the archive",
    )
    asks_inventory = any(phrase in normalized for phrase in inventory_phrases)
    asks_songs = "song" in normalized or "track" in normalized
    asks_albums = "album" in normalized or "record" in normalized
    if not asks_inventory or (not asks_songs and not asks_albums):
        return None

    albums = db.scalars(
        select(Album)
        .options(selectinload(Album.songs))
        .order_by(Album.display_order, Album.id)
    ).all()
    song_count = sum(len(album.songs) for album in albums)
    lines = [f"## Archive", f"There are **{len(albums)} albums** and **{song_count} songs** in the archive."]
    if asks_songs:
        lines.append("")
        lines.append("### Songs by album")
        for album in albums:
            lines.append(f"\n**{album.title}**")
            for song in sorted(album.songs, key=lambda item: (item.track_number, item.id)):
                lines.append(f"{song.track_number}. {song.title}")
    elif asks_albums:
        lines.append("")
        lines.append("### Albums")
        lines.extend(f"- {album.title}" for album in albums)
    return "\n".join(lines)


def _library_context(db: Session, question: str) -> tuple[str, list[str]]:
    albums = db.scalars(
        select(Album)
        .options(selectinload(Album.songs))
        .order_by(Album.display_order, Album.id)
    ).all()
    search_terms = {term for term in re.findall(r"[\w'-]+", question.casefold()) if len(term) > 2}
    album_lines: list[str] = [
        f"LIBRARY TOTALS: {len(albums)} albums, "
        f"{sum(len(album.songs) for album in albums)} songs",
        "ALBUM CATALOG:",
    ]
    song_index_lines: list[str] = ["COMPLETE SONG INDEX:"]
    song_records: list[tuple[int, str, str, str, str]] = []
    for album in albums:
        album_source = f"Album: {album.title}"
        album_lines.append(
            f"- {album.title} | Type: {album.edition_type} | Release: {album.release_date or 'Unknown'} | "
            f"Description: {album.description or 'No description provided.'}"
        )
        for song in sorted(album.songs, key=lambda item: (item.track_number, item.id)):
            song_index_lines.append(f"- {album.title} | Track {song.track_number} | {song.title}")
            searchable = f"{album.title} {album.description or ''} {song.title} {song.lyrics}".casefold()
            score = sum(searchable.count(term) for term in search_terms)
            song_records.append((score, album.title, song.title, song.lyrics, album_source))

    # Always include the catalog, then add the most relevant lyrics. This keeps
    # broad mood/theme questions useful while preventing large archives from
    # exceeding the model's token-per-minute limit.
    song_records.sort(key=lambda record: (-record[0], record[1], record[2]))
    selected = [record for record in song_records if record[0] > 0][:8]
    if not selected:
        selected = song_records[:6]
    sections = ["\n".join(album_lines), "\n".join(song_index_lines), "MATCHING SONG LYRICS:"]
    sources: list[str] = []
    for _, album_title, song_title, lyrics, album_source in selected:
        sources.extend([album_source, f"Song: {song_title} — {album_title}"])
        sections.append(f"{album_source}\nSong: {song_title}\nLyrics:\n{lyrics[:1200]}")
    context = "\n\n---\n\n".join(sections)
    return context[:MAX_CONTEXT_CHARS], list(dict.fromkeys(sources))


def build_ask_graph(db: Session):
    provider = os.getenv("AI_PROVIDER", "ollama").casefold()
    if provider == "ollama":
        model = ChatOllama(
            model=os.getenv("AI_MODEL", "qwen3:8b"),
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            temperature=0.2,
            reasoning=False,
            num_ctx=int(os.getenv("AI_NUM_CTX", "8192")),
            num_predict=int(os.getenv("AI_NUM_PREDICT", "512")),
            keep_alive="10m",
        )
    elif provider == "groq":
        model = ChatGroq(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            temperature=0.2,
            max_retries=2,
        )
    else:
        raise RuntimeError("AI_PROVIDER must be either 'ollama' or 'groq'")

    def load_library(state: AskState) -> dict[str, Any]:
        context, sources = _library_context(db, state["question"])
        return {"context": context, "sources": sources}

    def answer_question(state: AskState) -> dict[str, str]:
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            SystemMessage(content=f"LIBRARY CONTEXT:\n{state.get('context', '')}"),
        ]
        for item in state.get("history", [])[-20:]:
            message_type = HumanMessage if item["role"] == "user" else AIMessage
            messages.append(message_type(content=item["content"]))
        messages.append(HumanMessage(content=state["question"]))
        result = model.invoke(messages)
        return {"answer": str(result.content)}

    graph = StateGraph(AskState)
    graph.add_node("load_library", load_library)
    graph.add_node("answer_question", answer_question)
    graph.add_edge(START, "load_library")
    graph.add_edge("load_library", "answer_question")
    graph.add_edge("answer_question", END)
    return graph.compile()


def ask_ai(db: Session, question: str, history: list[dict[str, str]]) -> dict[str, Any]:
    provider = os.getenv("AI_PROVIDER", "ollama").casefold()
    if provider == "groq" and not os.getenv("GROQ_API_KEY"):
        raise RuntimeError("GROQ_API_KEY is not configured while AI_PROVIDER=groq")
    exact_answer = _exact_archive_answer(db, question)
    if exact_answer is not None:
        _, sources = _library_context(db, question)
        return {"answer": exact_answer, "sources": sources}
    return build_ask_graph(db).invoke({"question": question, "history": history})
