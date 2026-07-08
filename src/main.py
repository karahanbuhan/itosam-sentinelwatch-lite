import json
from datetime import datetime, timezone
import string
import ipaddress
import random
import sys
import csv


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_utils.tasks import repeat_every
from databases import Database

# Store usernames for generating mock data
usernames = []
with open("./resources/datasets/github_users.csv", newline="", encoding="utf-8") as csvfile:
    github_users_reader = csv.reader(csvfile, delimiter=" ")
    for row in github_users_reader:
        username = " ".join(row).split(",")[0]
        
        if len(username) > 32 or not username.isalnum():
            continue
        
        usernames.append(username)

# Database setup
database = Database("sqlite:///database.db")

# Fast API setup
app = FastAPI()
# Origins used for CORS
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

# Map user - ip relation so in mock system, it looks like same user connects with same ip address. Add to the dict in background
user_ip_dict = { "admin": "183.43.14.251" }
def generate_username_and_ip():
    octet1 = random.randint(0, 223) # IPv4 classes A, B and C are used
    octet2 = random.randint(0, 255)
    octet3 = random.randint(0, 255)
    octet4 = random.randint(0, 255)
    ip = f"{octet1}.{octet2}.{octet3}.{octet4}"
    
    user_ip_dict[random.choice(usernames)] = ip
# Generate 10 users for initial startup
for i in range(0, 10):
    generate_username_and_ip()


@app.on_event("startup")
@repeat_every(seconds=2)
async def insert_mock_event():
    # Generate new user - ip, seldomly
    if (random.random() > 0.93):
        generate_username_and_ip()    
    
    # Microsecond part is not required in the PDR, hide
    timestamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    
    event_type = random.choice(
        ["LOGIN_FAILED", "LOGIN_SUCCESS", "HIGH_CPU", "REQUEST"])
    
    username = random.choice(list(user_ip_dict.keys()))
    if not event_type.startswith("LOGIN"):
        username = None
    source_ip = user_ip_dict[username]

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
