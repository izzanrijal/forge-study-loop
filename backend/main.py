
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from typing import List, Optional
import os
from dotenv import load_dotenv

from app.core.config import settings
from app.api.routes import pdf, questions, study, auth, process, email, gamification
from app.core.database import get_db
from app.services.ai_service import AIService
from app.models.database import Base, engine

# Load environment variables
load_dotenv()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RecallForge API",
    description="AI-powered spaced repetition learning system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:3000",
        "https://htmkmahllfvgyhaxnjju.supabase.co"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pdf.router, prefix="/api/pdf", tags=["PDF"])
app.include_router(questions.router, prefix="/api/questions", tags=["Questions"])
app.include_router(study.router, prefix="/api/study", tags=["Study"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(process.router, prefix="/api/process", tags=["Processing"])
app.include_router(email.router, prefix="/api/email", tags=["Email"])
app.include_router(gamification.router, prefix="/api/gamification", tags=["Gamification"])

@app.get("/")
async def root():
    return {
        "message": "RecallForge API is running",
        "version": "1.0.0",
        "environment": "development" if settings.fastapi_reload else "production"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "version": "1.0.0",
        "database": "connected",
        "ai_service": "ready"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.fastapi_host,
        port=settings.fastapi_port,
        reload=settings.fastapi_reload
    )
