"""AutoExpert — FastAPI Main Application Entrypoint."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.database import Base, engine
from backend.app.routers import (
    demo,
    diagnostics,
    maintenance,
    reports,
    rules,
    settings,
    vehicles,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="AutoExpert — Vehicle Diagnosis & Mechanic Expert System API",
    description=(
        "Pure Symbolic Rule-Based Expert System for Motorcycle and Car Diagnosis. "
        "Implements 3VL Working Memory, Multi-Pass Forward Chaining, Recursive Backward Chaining, "
        "and 5-Tier Conflict Resolution."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(vehicles.router)
app.include_router(diagnostics.router)
app.include_router(rules.router)
app.include_router(reports.router)
app.include_router(maintenance.router)
app.include_router(demo.router)
app.include_router(settings.router)


@app.get("/")
def root():
    return {
        "system": "AutoExpert — Intelligent Vehicle Diagnosis & Mechanic Expert System",
        "type": "Pure Symbolic Expert System",
        "docs_url": "/docs",
        "status": "operational",
    }


@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "autoexpert-backend"}
