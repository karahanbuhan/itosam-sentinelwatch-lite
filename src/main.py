from fastapi import FastAPI
import json

app = FastAPI()


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