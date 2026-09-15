from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
import traceback
from app.core.config import settings
from app.api.topology import router as topology_router
from app.core.database import engine, Base

logger = logging.getLogger("cloudpulse.topology")

# Database schema is already managed by the main app

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception at {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "An internal server error occurred."}
    )

# Register routes
app.include_router(topology_router, prefix=f"{settings.API_V1_STR}/topology", tags=["topology"])

@app.get(f"{settings.API_V1_STR}/cloud-config/")
async def list_cloud_configs():
    from app.core.database import SessionLocal
    from sqlalchemy import select
    from app.models.config.config_cloud_account import ConfigCloudAccount
    async with SessionLocal() as db:
        res = await db.execute(select(ConfigCloudAccount))
        accounts = []
        for a in res.scalars().all():
            modules = a.active_modules or ""
            if "topology" in modules.lower():
                accounts.append({"account_name": a.account_name, "provider": a.provider, "default_region": a.default_region, "active_modules": a.active_modules})
        return accounts

@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "healthy", "service": settings.APP_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
