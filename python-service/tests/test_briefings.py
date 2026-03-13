from collections.abc import Generator
import sqlite3
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.briefing import Briefing, BriefingPoint, BriefingMetric

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if type(dbapi_connection) is sqlite3.Connection:
        dbapi_connection.create_function("gen_random_uuid", 0, lambda: uuid.uuid4().hex)

@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    Base.metadata.create_all(bind=engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)

def test_create_and_retrieve_briefing(client: TestClient) -> None:
    payload = {
        "companyName": "Acme Holdings",
        "ticker": "ACME",
        "sector": "Industrial Technology",
        "analystName": "Jane Doe",
        "summary": "Acme is benefiting from strong enterprise demand.",
        "recommendation": "Monitor for margin expansion.",
        "keyPoints": [
            "Revenue grew 18% year-over-year.",
            "Management raised full-year guidance."
        ],
        "risks": [
            "Top two customers account for 41% of total revenue."
        ],
        "metrics": [
            { "name": "Revenue Growth", "value": "18%" }
        ]
    }
    
    # 1. Create briefing
    create_res = client.post("/briefings", json=payload)
    assert create_res.status_code == 201
    briefing_data = create_res.json()
    assert briefing_data["company_name"] == "Acme Holdings"
    assert briefing_data["ticker"] == "ACME"
    assert briefing_data["generated_at"] is None
    briefing_id = briefing_data["id"]
    
    # 2. Retrieve briefing
    get_res = client.get(f"/briefings/{briefing_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == briefing_id
    
    # 3. Try to get HTML before generating (should fail)
    html_res_fail = client.get(f"/briefings/{briefing_id}/html")
    assert html_res_fail.status_code == 404
    
    # 4. Generate report
    gen_res = client.post(f"/briefings/{briefing_id}/generate")
    assert gen_res.status_code == 200
    assert gen_res.json()["generated_at"] is not None
    
    # 5. Get HTML
    html_res_success = client.get(f"/briefings/{briefing_id}/html")
    assert html_res_success.status_code == 200
    html_content = html_res_success.text
    assert "Acme Holdings" in html_content
    assert "ACME" in html_content
    assert "Revenue grew 18% year-over-year." in html_content
    assert "Top two customers account for 41% of total revenue." in html_content
    assert "Revenue Growth" in html_content
