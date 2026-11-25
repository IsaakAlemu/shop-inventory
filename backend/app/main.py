# Initializes the FastAPI application and defines the /health check endpoint.

from fastapi import FastAPI

from app.core.config import settings

app = FastAPI(title=settings.app_name, debug=settings.debug)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
