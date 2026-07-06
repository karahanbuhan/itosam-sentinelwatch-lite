from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import sqlite3

import sqlite3

con = sqlite3.connect("database.db")
cur = con.cursor()

def create_table():
    cur.execute("""
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY,
                    timestamp DATETIME NOT NULL,
                    source_ip TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    username TEXT
                )
        """)

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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