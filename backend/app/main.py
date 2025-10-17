"""
WebinarWins MVP - Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

# Import routers (to be implemented)
# from app.api.v1 import webinars, attendees, emails, insights, auth

app = FastAPI(
    title="WebinarWins API",
    description="Personalized Post-Webinar Follow-up for Immediate Conversion",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "message": "WebinarWins API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "webinarwins-api",
    }


# Include API routers
from app.api.v1 import webinars
app.include_router(webinars.router, prefix="/api/v1/webinars", tags=["Webinars"])


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )

