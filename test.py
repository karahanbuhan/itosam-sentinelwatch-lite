import sqlite3

con = sqlite3.connect("database.db")
cur = con.cursor()

cur.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY,
                timestamp TEXT NOT NULL,
                source_ip TEXT NOT NULL,
                event_type TEXT NOT NULL,
                username TEXT
            )
    """)
con.commit();
cur.execute("INSERT INTO events (timestamp, source_ip, event_type, username) VALUES ('2026-07-06T14:32:10Z', '192.168.1.1', 'LOGIN_FAILED', 'karahan');")
con.commit()

cur.execute("SELECT * FROM events;")
print(cur.fetchall())

cur.close()
con.close()
