from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class MetricSchema(BaseModel):
    name: str = Field(..., description="Name of the metric")
    value: str = Field(..., description="Value of the metric")


class BriefingCreate(BaseModel):
    companyName: str = Field(..., description="Name of the company")
    ticker: str = Field(..., description="Stock ticker symbol")
    sector: str = Field(..., description="Company sector")
    analystName: str = Field(..., description="Name of the analyst")
    summary: str = Field(..., description="Executive summary")
    recommendation: str = Field(..., description="Investment recommendation")
    keyPoints: list[str] = Field(..., min_length=2, description="At least two key points are required")
    risks: list[str] = Field(..., min_length=1, description="At least one risk is required")
    metrics: list[MetricSchema] | None = Field(default_factory=list, description="Optional metrics")

    @field_validator("ticker")
    @classmethod
    def normalize_ticker(cls, v: str) -> str:
        return v.upper() if v else v

    @field_validator("metrics")
    @classmethod
    def unique_metric_names(cls, v: list[MetricSchema] | None) -> list[MetricSchema] | None:
        if v is not None:
            names = [m.name for m in v]
            if len(names) != len(set(names)):
                raise ValueError("Metric names must be unique within the same briefing")
        return v


class BriefingResponse(BaseModel):
    id: UUID
    company_name: str
    ticker: str
    sector: str
    analyst_name: str
    summary: str
    recommendation: str
    generated_at: datetime | None
    created_at: datetime
    updated_at: datetime
    
    # We could also include nested fields for points and metrics if needed
    
    model_config = {"from_attributes": True}
