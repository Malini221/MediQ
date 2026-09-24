from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import health
from app.api.v1 import auth, patients, observations, handovers, clinical_guidance, burnout

app = FastAPI(
    title="MediQ Backend API",
    description="AI-powered caregiver coordination platform",
    version="0.1.0",
)

# Local Vite ports can change (5173, 5174, etc.). During development we allow
# localhost/127.0.0.1 origins and all request headers/methods so Authorization
# bearer tokens can pass the browser's CORS preflight. Production remains explicit.
if settings.ENVIRONMENT == "development":
    cors_origins = ["*"]
    cors_allow_credentials = False
else:
    cors_origins = [settings.FRONTEND_URL] if settings.FRONTEND_URL else []
    cors_allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\\.0\\.0\\.1)(:\\d+)?$" if settings.ENVIRONMENT == "development" else None,
    allow_credentials=cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(patients.router, prefix="/api/v1/patients", tags=["Patients"])
app.include_router(observations.router, prefix="/api/v1/observations", tags=["Observations"])
app.include_router(handovers.router, prefix="/api/v1/handovers", tags=["Handovers"])
app.include_router(clinical_guidance.router, prefix="/api/v1/clinical-guidance", tags=["Clinical Guidance"])
app.include_router(burnout.router, prefix="/api/v1/burnout", tags=["Burnout"])
