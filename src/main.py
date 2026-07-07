import json
import sys
import sqlite3

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_utils.tasks import repeat_every

from sqlalchemy.orm import Session
from databases import Database

# Database setup
database = Database("sqlite:///database.db")

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8000",
]

@app.on_event("startup")
async def database_connect():
    await database.connect()
    
    # Create events table if it does not exist
    query = """CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    source_ip TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    username TEXT
                )"""
    await database.execute(query);
    
@app.on_event("shutdown")
async def database_disconnect():
    await database.disconnect()

@app.on_event("startup")
@repeat_every(seconds=2)
async def insert_mock_event():
    await database.execute("INSERT INTO events (timestamp, source_ip, event_type, username) VALUES('salı', '192.168.1.1', 'LOGIN_FAILED', 'Karahan')")
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