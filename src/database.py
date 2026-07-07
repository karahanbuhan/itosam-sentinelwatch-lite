import json

from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, as_declarative

# Database setup
db_engine = create_engine("sqlite:///./database.db")
SessionLocal = sessionmaker(autocommit=True, autoflush=False, bind=db_engine)

@as_declarative()
class Base(object):
    pass

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String, index=False, nullable=False)
    source_ip = Column(String, index=False, nullable=False)
    event_type = Column(String, index=False, nullable=False)
    username = Column(String, index=False, nullable=True)
    
    def __repr__(self):
        data = {}
        data["id"] = self.id
        data["timestamp"] = self.timestamp
        data["source_id"] = self.source_ip
        data["username"] = self.username
        return json.dumps(data)