CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY,
    rule_id INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    source_ip TEXT NOT NULL,
    description TEXT NOT NULL,
    is_resolved INTEGER NOT NULL
);