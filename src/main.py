import json
import sys
import sqlite3

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_utils.tasks import repeat_every

from sqlalchemy.orm import Session
from database import Event, db_engine

con = sqlite3.connect("database.db")
cur = con.cursor()

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8000",
]

@app.on_event("startup")
@repeat_every(seconds=2)
async def insert_mock_event():
    print("hello")
    with Session(db_engine) as session:
        event = Event(timestamp="pazartesi", source_ip="192.168.1.1", event_type="LOGIN_FAILED", username="karahan")
        session.add(event)
        session.commit()
    
    print("test")
    
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/events")
def api_events():
    return json.loads("""[
    {
        "id": 0,
        "timestamp": "2026-07-06T14:32:10Z",
        "sourceIp": "185.23.11.4",
        "eventType": "LOGIN_FAILED",
        "username": "admin"
    },
    {
        "id": 1,
        "timestamp": "2026-07-06T14:32:08Z",
        "sourceIp": "91.44.10.2",
        "eventType": "REQUEST",
        "username": null
    }
]""")


@app.get("/api/alerts")
def api_alerts():
    return json.loads("""[
    {
        "type": "BRUTE_FORCE",
        "severity": "high",
        "sourceIp": "185.23.11.4",
        "description": "185.23.11.4 adresinden 5 dakikada 6 basarisiz giris denemesi"
    }
]""")