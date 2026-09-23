# MediQ — AI-Powered Caregiver Coordination & Burnout Prevention Platform

**MediQ** is a multi-role healthcare platform connecting family caregivers, professional nurses, clinicians, and care coordinators around a unified longitudinal patient record.

---

## Technical System Architecture

Complete architecture documentation, database schema, security flows, and API specifications are available in the [`docs/`](file:///d:/MediQ/docs) directory:

- 📐 [**System Architecture (`docs/architecture.md`)**](file:///d:/MediQ/docs/architecture.md): Contains 11 Mermaid diagrams detailing frontend, backend, AI orchestration, background workers, security, and data flow.
- 🔌 [**REST API Specification (`docs/api.md`)**](file:///d:/MediQ/docs/api.md): Endpoint parameters, payload schemas, security requirements, and response contracts for `/api/v1/`.
- 🗄️ [**Database & RLS Specs (`docs/database.md`)**](file:///d:/MediQ/docs/database.md): PostgreSQL schemas, custom ENUMs, foreign keys, HNSW vector indexes, and Row Level Security policies.

---

## Directory Structure

```text
MediQ/
│
├── frontend/                         # React + Vite + TypeScript Frontend
├── backend/                          # FastAPI + Pydantic + Celery Backend
│
├── database/                         # PostgreSQL Schema & Seed Data
│   ├── migrations/                   # SQL Migration Scripts (001_initial_schema.sql)
│   └── seed/                         # Initial Seed Data Scripts
│
├── models/                           # Cache Directory for Local AI Model Weights
│
├── docs/                             # Complete Architecture & API Documentation
│   ├── architecture.md               # Master Architecture Document (11 Diagrams)
│   ├── api.md                        # Versioned REST API Specification
│   └── database.md                   # ERD & RLS Policy Specification
│
├── .env.example                      # Environment Configuration Template
├── .gitignore                        # Git Exclusions File
├── docker-compose.yml                # Redis & Celery Local Infrastructure Setup
└── README.md                         # Project Overview
```

---

## Core System Highlights

1. **Deterministic Safety Bypass Engine:** Operates independently of LLMs using deterministic Python rules to instantly flag critical emergency keywords (falls, stroke, choking).
2. **Human-in-the-Loop Verification:** Structured AI extractions require explicit caregiver confirmation in a split-screen review modal before committing data to PostgreSQL.
3. **Smart Shift Handovers:** Calculates deviations from baseline patient metrics to highlight prioritized top 3–5 watch items for incoming shifts.
4. **Non-punitive Caregiver Burnout Monitoring:** Caregiver strain scores are locked to the user ID via RLS policies and can never be queried by supervisors or employers.
5. **RAG Clinical Guidance:** Approved care steps are embedded and retrieved using Supabase `pgvector` HNSW cosine similarity search.
