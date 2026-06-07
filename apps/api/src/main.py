"""Vertex AI Backend - FastAPI Application"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

from api.chat import router as chat_router
from api.tools import router as tools_router
from api.creative import router as creative_router

app = FastAPI(
    title="Vertex AI API",
    description="AI电商经营智能体后端服务",
    version="1.0.0"
)

# CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(chat_router, prefix="/api/v1")
app.include_router(tools_router, prefix="/api/v1/tools")
app.include_router(creative_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "name": "Vertex AI API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("ENVIRONMENT") == "development"
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=reload)
