CREATE TABLE IF NOT EXISTS rules (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    threshold_count INTEGER NOT NULL,
    time_window_seconds INTEGER NOT NULL,
    severity TEXT NOT NULL,
    is_active INTEGER NOT NULL
);