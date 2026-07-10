from datetime import datetime, timezone, timedelta
import random
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
                );"""
    await database.execute(query)


@app.on_event("shutdown")
async def database_disconnect():
    await database.disconnect()    

def generate_random_ipv4():
    octet1 = random.randint(0, 223) # IPv4 classes A, B and C are used
    octet2 = random.randint(0, 255)
    octet3 = random.randint(0, 255)
    octet4 = random.randint(0, 255)
    return f"{octet1}.{octet2}.{octet3}.{octet4}"

# Map user - ip relation so in mock system, it looks like same user connects with same ip address. Add to the dict in background
users = { "admin": "183.43.14.251" }
def generate_user():    
    users[random.choice(usernames)] = generate_random_ipv4()
# Generate 10 users for initial startup
for i in range(0, 10):
    generate_user()

async def play_brute_force():
    username = random.choice(list(users.keys()))
    source_ip = users[username]
    event_type = "LOGIN_FAILED"
    
    timestamp = datetime.now(timezone.utc).replace(microsecond=0)    
    timestamp = timestamp.isoformat()
    query = "INSERT INTO events (timestamp, source_ip, event_type, username) VALUES(:timestamp, :source_ip, :event_type, :username);"
    values = [
        {
            "timestamp": timestamp,
            "source_ip": source_ip,
            "event_type": event_type,
            "username": username
        }
    ]
    
    for i in range(random.randint(5, 8)):
        await database.execute_many(query=query, values=values)

@app.on_event("startup")
@repeat_every(seconds=2)
async def insert_mock_event():    
    rand = random.random()    
    if rand > 0.93:
        generate_user() # Generate new user, seldomly
    elif rand < 0.27:
        users.pop(random.choice(users.keys())) # Delete random user moderately so new clients come and go
    elif rand > 0.45 and rand < 0.48:
        return # Sometimes skip so it is not perfectly linear
    
    ### DEMO SCRIPT ###
    if rand > 0.80 and rand < 0.87:
        await play_brute_force()
    ### DEMO SCRIPT ###
    
    # Microsecond part is not required in the PDR, hide
    timestamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    
    event_type = random.choice(
        ["LOGIN_FAILED", "LOGIN_SUCCESS", "HIGH_CPU", "HIGH_MEMORY", "HIGH_DISK", "BANDWIDTH_LIMIT", "REQUEST"]
    )
    
    username = random.choice(list(users.keys()))
    if not event_type.startswith("LOGIN"):
        username = None
        source_ip = generate_random_ipv4()
    else:
        source_ip = users[username]

    query = "INSERT INTO events (timestamp, source_ip, event_type, username) VALUES(:timestamp, :source_ip, :event_type, :username);"
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

async def select_events_before(dminutes, event_type=None):
    dtime = datetime.now(timezone.utc).replace(microsecond=0)
    dtime = dtime - timedelta(minutes=dminutes)
    dtime = dtime.isoformat()
    
    query = "SELECT * FROM events WHERE (timestamp > :dtime);"
    values = { "dtime": dtime }
    if event_type != None:
        query = "SELECT * FROM events WHERE (event_type = :event_type and timestamp > :dtime);"        
        values = { "event_type": event_type, "dtime": dtime }
    
    results = await database.fetch_all(query=query, values=values)
    
    d = []
    for result in results:
        d.append(dict(zip(result.keys(), result.values())))    
    return d

async def check_brute_force():
    events = await select_events_before(dminutes=25, event_type="LOGIN_FAILED")
    
    attackers = {}
    ip_counter = {}
    for event in events:
        if event["source_ip"] not in ip_counter:
            ip_counter[event["source_ip"]] = 0
        ip_counter[event["source_ip"]] += 1
    
    for ip in ip_counter:
        count = ip_counter[ip]
        if count > 5:
            attackers[event["source_ip"]] = count
        
    return attackers

async def check_traffic_spike():
    events = await select_events_before(dminutes=1)
    count = len(events)
    
    if count > 100:
        return count
    else:
        return 0
    
async def check_high_cpu():
    events = await select_events_before(dminutes=2, event_type="HIGH_CPU")
    count = len(events)
    
    if count > 3:
        return count
    else:
        return 0

@app.get("/api/alerts")
async def api_alerts():
    results = []    
    attackers = await check_brute_force()
    for attacker in attackers:
        results.append({
            "type": "BRUTE_FORCE",
            "severity": "HIGH",
            "source_ip": attacker,
            "event_count": attackers[attacker],
            "desription": f"{attacker} adresinden 5 dakikada {attackers[attacker]} basarisiz giris"
        })
        
    event_count = await check_traffic_spike()
    if event_count != 0:
        results.append({
            "type": "TRAFFIC_SPIKE",
            "severity": "MEDIUM",
            "event_count": event_count,
            "description": f"Son 1 dakika icerisinde {event_count} adet olay oldu, trafik limiti 100 asildi"
        })
        
    event_count = await check_high_cpu()
    if event_count != 0:
        results.append({
            "type": "HIGH_CPU",
            "severity": "LOW",
            "event_count": event_count,
            "description": f"Son 2 dakika icerisinde {event_count} adet yuksek CPU kullanimi olayi olustu"
        })    
    
    return results
