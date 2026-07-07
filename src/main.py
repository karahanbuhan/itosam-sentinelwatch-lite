import json
import datetime
import string
import ipaddress
import random
import sys


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_utils.tasks import repeat_every
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
    await database.execute(query)


@app.on_event("shutdown")
async def database_disconnect():
    await database.disconnect()


def generate_username():
    characters = string.ascii_letters + string.digits + '._-'
    username = ''.join(random.choice(characters)
                       for _ in range(random.randint(5, 32)))
    return username


@app.on_event("startup")
@repeat_every(seconds=2)
async def insert_mock_event():
    timestamp = datetime.datetime.now(
        datetime.timezone.utc).replace(microsecond=0).isoformat()
    # TODO: Generate IPv4s from specified classes
    source_ip = '{}.{}.{}.{}'.format(
        *__import__('random').sample(range(0, 255), 4))
    event_type = random.choice(
        ["LOGIN_FAILED", "LOGIN_SUCCESS", "HIGH_CPU", "REQUEST"])

    username = None
    if event_type.startswith("LOGIN"):
        username = random.choice(
            ["admin", "karahan", "ahmet", generate_username()])

    query = "INSERT INTO events (timestamp, source_ip, event_type, username) VALUES(:timestamp, :source_ip, :event_type, :username)"
    values = [
        {
            "timestamp": timestamp,
            "source_ip": source_ip,
            "event_type": event_type,
            "username": username
        }
    ]

    await database.execute_many(query=query, values=values)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/events")
async def api_events():
    query = "SELECT * FROM events"
    results = await database.fetch_all(query=query)
    return results


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
