from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.briefing import BriefingCreate, BriefingResponse
from app.services.briefing_service import BriefingService
from app.services.report_formatter import ReportFormatter

router = APIRouter(prefix="/briefings", tags=["briefings"])

def get_briefing_service(db: Session = Depends(get_db)) -> BriefingService:
    return BriefingService(db=db, formatter=ReportFormatter())

@router.post("", response_model=BriefingResponse, status_code=status.HTTP_201_CREATED)
def create_briefing(
    data: BriefingCreate,
    service: BriefingService = Depends(get_briefing_service)
):
    return service.create_briefing(data)

@router.get("/{id}", response_model=BriefingResponse)
def get_briefing(
    id: UUID,
    service: BriefingService = Depends(get_briefing_service)
):
    briefing = service.get_briefing(id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return briefing

@router.post("/{id}/generate", response_model=BriefingResponse)
def generate_briefing_report(
    id: UUID,
    service: BriefingService = Depends(get_briefing_service)
):
    briefing = service.generate_report(id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return briefing

@router.get("/{id}/html", response_class=HTMLResponse)
def get_briefing_html(
    id: UUID,
    service: BriefingService = Depends(get_briefing_service)
):
    html = service.get_html_report(id)
    if not html:
        raise HTTPException(
            status_code=404, 
            detail="Briefing not found or report not generated yet"
        )
    return html
