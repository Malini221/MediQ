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

# Configure CORS.
# Keep explicit production/frontend origins, while allowing Vite's localhost/127.0.0.1
# development ports so local testing does not fail on an OPTIONS preflight.
origins = [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
    "http://127.0.0.1:3000",
]

if getattr(settings, "FRONTEND_URL", None):
    origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
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
