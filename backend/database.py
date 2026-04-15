import os
from sqlalchemy import create_engine, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker, Session
from typing import Generator

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./pozos.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={"sslmode": "require", "connect_timeout": 10},
    )

SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


class Well(Base):
    __tablename__ = "wells"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    lat: Mapped[float]
    lon: Mapped[float]


class Reading(Base):
    __tablename__ = "readings"

    id: Mapped[int] = mapped_column(primary_key=True)
    well_id: Mapped[int] = mapped_column(ForeignKey("wells.id"))
    timestamp: Mapped[str]
    pressure: Mapped[float]
    temperature: Mapped[float]
    flow_rate: Mapped[float]


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True)
    well_id: Mapped[int] = mapped_column(ForeignKey("wells.id"))
    well_name: Mapped[str]
    timestamp: Mapped[str]
    pressure: Mapped[float]
    temperature: Mapped[float]
    flow_rate: Mapped[float]
    risk_score: Mapped[float]


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
