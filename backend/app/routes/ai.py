from fastapi import APIRouter, Depends, HTTPException, status
import logging
from sqlalchemy.orm import Session

from ..ai import ask_ai
from ..database import get_db
from ..schemas import AskAIRequest, AskAIResponse

router = APIRouter(prefix="/ai", tags=["ai"])
logger = logging.getLogger(__name__)


@router.post("/ask", response_model=AskAIResponse)
def ask(payload: AskAIRequest, db: Session = Depends(get_db)) -> AskAIResponse:
    try:
        result = ask_ai(db, payload.message, [item.model_dump() for item in payload.history])
    except RuntimeError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error
    except Exception as error:
        logger.exception("Ask AI request failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI service could not answer right now. Check the backend logs and Groq configuration.",
        ) from error
    return AskAIResponse(answer=result["answer"], sources=result.get("sources", []))
