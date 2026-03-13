from datetime import datetime, timezone
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.models.briefing import Briefing

_TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "templates"


class ReportFormatter:
    """Starter formatter utility for future report-generation work."""

    def __init__(self) -> None:
        self._env = Environment(
            loader=FileSystemLoader(str(_TEMPLATE_DIR)),
            autoescape=select_autoescape(enabled_extensions=("html", "xml"), default_for_string=True),
        )

    def render_base(self, title: str, body: str) -> str:
        template = self._env.get_template("base.html")
        return template.render(title=title, body=body, generated_at=self.generated_timestamp())

    def render_briefing(self, briefing: Briefing) -> str:
        template = self._env.get_template("briefing_report.html")
        
        # Sort points by display order and filter by type
        key_points = sorted([p for p in briefing.points if p.point_type == "key_point"], key=lambda k: k.display_order)
        risks = sorted([p for p in briefing.points if p.point_type == "risk"], key=lambda k: k.display_order)
        
        # Format the view model
        view_model = {
            "title": f"Briefing Report: {briefing.company_name} ({briefing.ticker})",
            "company_name": briefing.company_name,
            "ticker": briefing.ticker,
            "sector": briefing.sector,
            "analyst_name": briefing.analyst_name,
            "summary": briefing.summary,
            "recommendation": briefing.recommendation,
            "key_points": [p.content for p in key_points],
            "risks": [p.content for p in risks],
            "metrics": [{"name": m.name, "value": m.value} for m in briefing.metrics],
            "generated_at": briefing.generated_at.isoformat() if briefing.generated_at else self.generated_timestamp(),
        }
        return template.render(**view_model)

    @staticmethod
    def generated_timestamp() -> str:
        return datetime.now(timezone.utc).isoformat()

