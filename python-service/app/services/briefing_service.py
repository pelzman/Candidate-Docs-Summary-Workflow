from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.briefing import Briefing, BriefingPoint, BriefingMetric
from app.schemas.briefing import BriefingCreate
from app.services.report_formatter import ReportFormatter


class BriefingService:
    def __init__(self, db: Session, formatter: ReportFormatter = None):
        self._db = db
        self._formatter = ReportFormatter() if formatter is None else formatter

    def create_briefing(self, data: BriefingCreate) -> Briefing:
        briefing = Briefing(
            company_name=data.companyName,
            ticker=data.ticker,
            sector=data.sector,
            analyst_name=data.analystName,
            summary=data.summary,
            recommendation=data.recommendation,
        )
        
        # Add key points
        for i, point_text in enumerate(data.keyPoints):
            briefing.points.append(BriefingPoint(content=point_text, point_type="key_point", display_order=i))
            
        # Add risks
        for i, risk_text in enumerate(data.risks):
            briefing.points.append(BriefingPoint(content=risk_text, point_type="risk", display_order=i))
            
        # Add metrics
        if data.metrics:
            for metric in data.metrics:
                briefing.metrics.append(BriefingMetric(name=metric.name, value=metric.value))

        self._db.add(briefing)
        self._db.commit()
        self._db.refresh(briefing)
        return briefing

    def get_briefing(self, briefing_id: UUID) -> Briefing | None:
        return self._db.scalar(select(Briefing).where(Briefing.id == briefing_id))

    def generate_report(self, briefing_id: UUID) -> Briefing | None:
        briefing = self.get_briefing(briefing_id)
        if not briefing:
            return None
            
        briefing.generated_at = datetime.now(timezone.utc)
        self._db.commit()
        self._db.refresh(briefing)
        return briefing

    def get_html_report(self, briefing_id: UUID) -> str | None:
        briefing = self.get_briefing(briefing_id)
        if not briefing or not briefing.generated_at:
            return None
        return self._formatter.render_briefing(briefing)
