# MediQ — System Architecture Document

## Executive Summary & Overview

**MediQ** is an AI-powered caregiver coordination and burnout-prevention platform designed to connect family caregivers, professional nurses, clinicians, and care coordinators around a single, unified longitudinal patient record.

The platform provides:
- Voice and text observation logging with Web Audio API capture.
- Whisper speech-to-text transcription and Pydantic-constrained LLM structured metadata extraction.
- **Human-in-the-Loop (HITL)** split-screen review and confirmation modal.
- **Deterministic Safety Bypass Engine** operating independently of AI to detect critical emergencies (falls, stroke, choking).
- **Smart Shift Handovers** with baseline deviation calculations and prioritized watch items.
- **Non-punitive Caregiver Burnout Engine** monitoring strain signals in strict privacy.
- **RAG Clinical Guidance Search** backed by Supabase `pgvector` HNSW indexes.

---

## 1. Overall System Architecture

```mermaid
graph TD
    subgraph Users ["MediQ User Roles"]
        FC["Family Caregiver"]
        PC["Professional Caregiver"]
        CL["Clinician"]
        CO["Care Coordinator"]
    end

    subgraph FrontendLayer ["Frontend Layer (React + Vite + TypeScript)"]
        UI["App Shell & Navigation"]
        AuthCtx["Auth Context (Supabase Auth)"]
        PatCtx["Patient Context & Isolation"]
        RoleViews["Role-Specific Views (/family, /professional, /clinician, /coordinator)"]
        HitlModal["Human-in-the-Loop Review Modal"]
        VoiceRecorder["Web Audio API Voice Recorder"]
    end

    Users -->|HTTPS / REST / WSS| UI

    subgraph BackendLayer ["Backend Layer (FastAPI + Python 3.11+)"]
        API["FastAPI REST Router (/api/v1)"]
        AuthMiddleware["JWT & Membership Verification"]
        SafetyEngine["Deterministic Safety Bypass Engine (Regex/Rules)"]
        ServiceLayer["Business Services (Observation, Handover, Guidance, Burnout)"]
        AIOrchestrator["AI Orchestrator & Provider Abstractions"]
    end

    UI -->|JWT Auth Header + HTTPS| API

    subgraph AsyncLayer ["Background Task Queue (Redis + Celery)"]
        RedisQueue[("Redis Broker & Result Store")]
        CeleryWorkers["Celery Worker Pool"]
        TaskSTT["Task: Whisper Speech-to-Text"]
        TaskExtract["Task: LLM Structured Extraction"]
        TaskEmbed["Task: Guidance Embedding Ingestion"]
        TaskHandover["Task: Baseline Deviation & Handover"]
        TaskBurnout["Task: Caregiver Strain Sentiment Analysis"]
    end

    API -->|Enqueue Jobs| RedisQueue
    RedisQueue --> CeleryWorkers
    CeleryWorkers --> TaskSTT
    CeleryWorkers --> TaskExtract
    CeleryWorkers --> TaskEmbed
    CeleryWorkers --> TaskHandover
    CeleryWorkers --> TaskBurnout

    subgraph AILayer ["AI / ML Integration Layer"]
        STTProvider["SpeechToTextProvider (Local Whisper / OpenAI Whisper)"]
        LLMProvider["ExtractionProvider (Local LLM / GPT-4o-mini JSON Mode)"]
        EmbedProvider["EmbeddingProvider (Local SentenceTransformer / OpenAI text-embedding-3-small)"]
        SentProvider["SentimentProvider (Local VADER/Transformer)"]
        HandoverLLM["HandoverProvider (Local LLM / GPT-4o-mini)"]
    end

    TaskSTT --> STTProvider
    TaskExtract --> LLMProvider
    TaskEmbed --> EmbedProvider
    TaskHandover --> HandoverLLM
    TaskBurnout --> SentProvider
    AIOrchestrator --> AILayer

    subgraph SupabaseLayer ["Database, Storage & Auth Layer (Supabase / PostgreSQL)"]
        SupaAuth["Supabase Auth (JWT Management)"]
        PostgresDB[("PostgreSQL DB + Row Level Security (RLS)")]
        VectorStore[("pgvector Extension (HNSW Index)")]
        PrivateStorage[("Supabase Storage (caregiver_audio - Private)")]
        RealtimeBus["Supabase Realtime (Alerts & Shift Handovers)"]
    end

    AuthMiddleware -->|Verify Token & RLS| SupaAuth
    ServiceLayer -->|Service Role / User JWT| PostgresDB
    ServiceLayer -->|Vector Similarity Search| VectorStore
    ServiceLayer -->|Signed Upload/Read URLs| PrivateStorage
    CeleryWorkers -->|Persist Results| PostgresDB
    SafetyEngine -->|Emergency Escalation Alert| RealtimeBus
    RealtimeBus -->|Push Notification| UI
```

---

## 2. Frontend Architecture

```mermaid
graph TD
    subgraph FrontendApp ["React + Vite Application"]
        Entry["App.tsx & providers.tsx"]
        AuthCtx["AuthContext (Session & Role)"]
        PatCtx["PatientContext (Active Patient)"]
        Router["Role-Based Route Guard"]

        Entry --> AuthCtx
        Entry --> PatCtx
        AuthCtx --> Router
        PatCtx --> Router

        subgraph Shell ["Global App Shell"]
            TopNav["Top Navigation Bar (Patient Switcher, Bell, Avatar)"]
            QuickBar["Persistent Quick Action Toolbar"]
        end

        Router --> Shell

        subgraph Pages ["Role-Specific Pages"]
            FamilyView["/family (Timeline + Guidance)"]
            ProView["/professional (Shift Checklist + Handover)"]
            ClinView["/clinician (Recharts Trends)"]
            CoordView["/coordinator (Triage Alerts & Roster)"]
        end

        Shell --> Pages

        subgraph CaptureFlow ["Observation Capture & Human-in-the-Loop"]
            VoiceModal["Voice Recording Modal (Web Audio API Waveform)"]
            SplitReviewModal["Split-Screen Review Modal (Transcript | Editable JSON)"]
            ConfirmAction["Human Confirmation Action"]
        end

        QuickBar --> VoiceModal
        VoiceModal -->|Submit Audio/Text| SplitReviewModal
        SplitReviewModal --> ConfirmAction
    end

    ConfirmAction -->|POST /api/v1/observations/confirm| BackendAPI["FastAPI Backend"]
```

---

## 3. Backend Architecture

```mermaid
graph TD
    subgraph RequestIngress ["Request Ingress & Security Middleware"]
        HTTPReq["HTTPS Client Request"] --> FastAPIApp["FastAPI (main.py)"]
        FastAPIApp --> CorsMiddleware["CORS & Rate Limiter"]
        CorsMiddleware --> AuthDep["Security Dependency (core/dependencies.py)"]
        AuthDep -->|1. Validate JWT| JWTVerifier["Supabase JWT Verifier"]
        AuthDep -->|2. Verify Membership| MemberCheck["Patient Membership Verifier"]
    end

    MemberCheck --> Routers["API Router (/api/v1/*)"]

    subgraph ServiceLayer ["Service & Business Domain Layer"]
        Routers --> ObsService["Observation Service"]
        Routers --> HandoverService["Handover Service"]
        Routers --> GuidanceService["Guidance Service (RAG)"]
        Routers --> BurnoutService["Burnout Service"]
    end

    subgraph SynchronousSafety ["Synchronous Deterministic Safety Engine"]
        ObsService --> SafetyEngine["emergency_detector.py (Deterministic Python Regex)"]
        SafetyEngine -->|Emergency Match| InstantEscalate["Set Status: ESCALATED & Push Realtime Alert"]
    end

    subgraph QueueDispatch ["Asynchronous Job Queue Dispatch"]
        ObsService -->|Normal Stream| RedisBroker[("Redis Task Queue")]
        HandoverService --> RedisBroker
        GuidanceService --> RedisBroker
    end

    subgraph AsyncWorkers ["Celery Workers (app/workers/tasks.py)"]
        RedisBroker --> CeleryPool["Celery Worker Pool"]
        CeleryPool --> TaskSTT["Task: Whisper Speech-to-Text"]
        CeleryPool --> TaskExtraction["Task: LLM Schema Extraction"]
        CeleryPool --> TaskHandover["Task: Baseline Deviation Handover"]
    end

    subgraph AIProviders ["AI Provider Abstraction Layer"]
        TaskSTT --> STTInterface["BaseSpeechProvider"]
        TaskExtraction --> ExtInterface["BaseExtractionProvider"]
        TaskHandover --> HandInterface["BaseHandoverProvider"]
    end
```

---

## 4. Authentication & RLS Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Caregiver
    participant FE as React Frontend
    participant Auth as Supabase Auth
    participant BE as FastAPI Backend
    participant DB as PostgreSQL (RLS)

    User->>FE: Enter Credentials
    FE->>Auth: signInWithPassword()
    Auth-->>FE: Return JWT Token (with auth.uid)
    FE->>BE: GET /api/v1/observations?patient_id=XYZ<br/>Header: Authorization: Bearer <JWT>
    BE->>Auth: Verify JWT & extract user_id
    BE->>DB: Query patient_memberships(user_id, patient_id)
    alt No Membership Record
        DB-->>BE: 0 Rows Returned
        BE-->>FE: 403 Forbidden ("Access to patient denied")
    else Membership Validated
        BE->>DB: Execute Query with User JWT / Context
        Note over DB: Postgres Evaluates RLS Policy:<br/>EXISTS(patient_memberships WHERE user_id = auth.uid())
        DB-->>BE: Return Filtered Observations
        BE-->>FE: 200 OK (Observation Data)
    end
```

---

## 5. Observation Processing & Human-in-the-Loop Flow

```mermaid
flowchart TD
    Start(["Caregiver Ingests Observation (Voice WebM or Text)"]) --> UploadFE["Frontend: Captures Payload & Validates Size/Type"]
    UploadFE --> APIPost["POST /api/v1/observations/submit"]

    APIPost --> VerifyAuth["FastAPI: Authenticate User & Validate Patient Membership"]
    VerifyAuth --> CheckAudio{"Is Audio File Provided?"}

    CheckAudio -- Yes --> StoreAudio["Upload to Supabase Storage: 'caregiver_audio' (Private Bucket)"]
    StoreAudio --> SavePendingAudio["Insert Observation Record (status = 'pending', audio_path)"]
    CheckAudio -- No --> SavePendingText["Insert Observation Record (status = 'pending', raw_text)"]

    SavePendingAudio --> TriggerSafety["Execute Deterministic Python Safety Engine (Regex/Rules)"]
    SavePendingText --> TriggerSafety

    TriggerSafety --> EmergencyCheck{"Critical Emergency Keyword Match?<br/>(fall, stroke, choking, unconscious)"}

    EmergencyCheck -- YES (Emergency Detected) --> EscalateState["Mark Record: status = 'escalated', priority = 100"]
    EscalateState --> RealtimeAlert["Broadcast Emergency Alert via Supabase Realtime Bus"]
    RealtimeAlert --> FastNotify["Push Urgent UI Banner to Coordinator & Care Team"]

    EmergencyCheck -- NO (Normal Path) --> EnqueueJob["Enqueue Celery Background Job (Worker A)"]

    subgraph AsyncWorkerA ["Worker A Task Execution"]
        EnqueueJob --> WhisperSTT{"If Audio: Call Whisper SpeechToTextProvider"}
        WhisperSTT --> TranscriptResult["Generate Verbatim Transcript"]
        TranscriptResult --> LLMExtraction["Call LLM ExtractionProvider (Pydantic JSON Mode Schema)"]
        LLMExtraction --> StructuredJSON["Output Metadata: Mood, Sleep, Appetite, Symptoms, Notes"]
    end

    StructuredJSON --> UpdateObsDraft["Update Observation Record with Draft Extracted JSON"]
    UpdateObsDraft --> NotifyFE["Notify Frontend: Extraction Ready for Review"]

    NotifyFE --> HitlModal["Frontend Displays Split-Screen Review Modal"]
    subgraph HitlReview ["Human-in-the-Loop Confirmation"]
        HitlModal --> LeftSide["Left Column: Verbatim Audio Transcript"]
        HitlModal --> RightSide["Right Column: Editable Metadata Dropdowns & Notes"]
        RightSide --> CaregiverEdit["Caregiver Modifies / Corrects Any Errors"]
        CaregiverEdit --> UserConfirm["Caregiver Clicks 'Confirm & Save'"]
    end

    UserConfirm --> APIConfirm["POST /api/v1/observations/{id}/confirm"]
    APIConfirm --> FinalCommit["Update DB Record: status = 'confirmed', final_metadata"]
    FinalCommit --> End(["Observation Sealed in Longitudinal Record"])
```

---

## 6. AI Provider Abstraction Architecture

```mermaid
graph TD
    subgraph Services ["Backend Application Services"]
        ObsSvc["Observation Service"]
        HandSvc["Handover Service"]
        GuidSvc["Guidance Service"]
    end

    subgraph ProviderInterfaces ["Abstract Provider Interfaces (app/providers/)"]
        STTInterface["BaseSpeechProvider"]
        ExtractInterface["BaseExtractionProvider"]
        EmbedInterface["BaseEmbeddingProvider"]
        HandoverInterface["BaseHandoverProvider"]
    end

    ObsSvc --> STTInterface
    ObsSvc --> ExtractInterface
    HandSvc --> HandoverInterface
    GuidSvc --> EmbedInterface

    subgraph ConcreteImpls ["Swappable Provider Implementations"]
        STTInterface --> LocalWhisper["LocalWhisperProvider (faster-whisper / GGML)"]
        STTInterface --> CloudWhisper["OpenAIWhisperProvider (API)"]

        ExtractInterface --> LocalLLM["LocalLLMProvider (Ollama / vLLM / Llama-3)"]
        ExtractInterface --> CloudLLM["OpenAILLMProvider (GPT-4o-mini JSON Mode)"]

        EmbedInterface --> LocalEmbed["LocalEmbeddingProvider (SentenceTransformers / MiniLM)"]
        EmbedInterface --> CloudEmbed["OpenAIEmbeddingProvider (text-embedding-3-small)"]

        HandoverInterface --> LocalHandover["LocalHandoverProvider (Llama-3)"]
        HandoverInterface --> CloudHandover["OpenAIHandoverProvider (GPT-4o-mini)"]
    end
```

---

## 7. RAG / pgvector Flow

```mermaid
flowchart TD
    subgraph Ingestion ["1. Guidance Document Ingestion Pipeline"]
        DocInput["Approved Clinical Guidance Markdown/Text"] --> Chunker["Text Chunker (500 Token Chunks + 50 Overlap)"]
        Chunker --> EmbedGen["EmbeddingProvider (Generate Embeddings)"]
        EmbedGen --> InsertPG["Insert into clinical_guidance (content, metadata, embedding)"]
        InsertPG --> HNSWBuild["PostgreSQL HNSW Vector Indexing"]
    end

    subgraph Retrieval ["2. Similarity Retrieval Pipeline"]
        UserQuery["Caregiver Query (e.g. 'How to handle dementia agitation?')"] --> QueryEmbed["Generate Query Embedding Vector"]
        QueryEmbed --> VectorSearch["Execute pgvector Cosine Distance Query (<->)"]

        VectorSearch --> SQLQuery["SELECT id, title, content, 1 - (embedding <=> query_vec) AS similarity<br/>FROM clinical_guidance<br/>WHERE is_approved = TRUE<br/>ORDER BY embedding <=> query_vec LIMIT 5;"]

        SQLQuery --> FilteredResults["Retrieve Top-K Approved Care Tips"]
        FilteredResults --> FERender["Display Grounded Care Guidance in UI"]
    end
```

---

## 8. Background Task Queue (Redis + Celery)

```mermaid
graph TD
    subgraph Application ["FastAPI Application"]
        Endpoint["Observation API / Handover API"] --> CeleryClient["Celery Task Dispatcher"]
    end

    CeleryClient -->|AMQP / Redis Protocol| RedisBroker[("Redis Broker (DB 0)")]

    subgraph WorkerPool ["Celery Worker Process Pool"]
        WorkerA["Worker Node 1: Speech & Extraction"]
        WorkerB["Worker Node 2: Handover & Baselines"]
        WorkerC["Worker Node 3: Embeddings & Sentiment"]
    end

    RedisBroker --> WorkerA
    RedisBroker --> WorkerB
    RedisBroker --> WorkerC

    subgraph TaskExec ["Task Implementations (app/workers/tasks.py)"]
        WorkerA --> TaskSTT["process_speech_transcription(obs_id, audio_path)"]
        WorkerA --> TaskExtract["process_llm_extraction(obs_id, transcript)"]
        WorkerB --> TaskHandover["generate_shift_handover(patient_id)"]
        WorkerC --> TaskEmbed["generate_guidance_embeddings(guidance_id)"]
        WorkerC --> TaskBurnout["analyze_caregiver_strain(user_id)"]
    end

    TaskSTT & TaskExtract & TaskHandover & TaskEmbed & TaskBurnout -->|Store Results| RedisBackend[("Redis Result Store (DB 1)")]
    TaskSTT & TaskExtract & TaskHandover & TaskEmbed & TaskBurnout -->|Persist Final State| SupabaseDB[("Supabase PostgreSQL DB")]
```

---

## 9. Security Architecture

```mermaid
graph TD
    subgraph ClientTrustBoundary ["Untrusted Client Boundary"]
        Browser["User Browser / React App"]
        NoSecrets["Strict Rule: NO Service Keys, NO API Secrets in JS Bundle"]
    end

    Browser -->|TLS 1.3 / HTTPS| NetworkEdge["Cloudflare / Network Edge Security"]

    subgraph NetworkEdge ["Edge Security Layer"]
        NetworkEdge --> DDoS["DDoS Mitigation"]
        NetworkEdge --> WAF["Web Application Firewall (WAF)"]
        NetworkEdge --> RateLimiter["API Rate Limiting (100 req/min per IP)"]
    end

    RateLimiter --> BackendEntry["FastAPI Application Gateway"]

    subgraph BackendSecurity ["Backend Authorization Layer"]
        BackendEntry --> ValidateJWT["Decode Supabase JWT Signature"]
        ValidateJWT --> CheckMembership["Query patient_memberships Table"]
        CheckMembership --> InputSanitize["Pydantic Input Sanitization & Type Validation"]
    end

    InputSanitize --> DBBoundary["PostgreSQL Database Gatekeeper"]

    subgraph DatabaseSecurity ["Database & Storage Security"]
        DBBoundary --> RLSCheck["PostgreSQL Row Level Security Policy Evaluation"]
        RLSCheck --> StorageBucket["Private Storage Bucket (Signed URLs ONLY - 15min expiry)"]
    end
```

---

## 10. Complete End-to-End Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor Caregiver as Family/Pro Caregiver
    participant FE as React Frontend
    participant API as FastAPI Backend
    participant Storage as Supabase Private Storage
    participant Celery as Celery Workers
    participant LLM as AI LLM Provider
    participant DB as Supabase PostgreSQL (RLS)
    actor Clinician as Clinician / Coordinator

    Caregiver->>FE: Record Voice Note ("Dad fell near bed, seems confused")
    FE->>API: POST /api/v1/observations/submit (WebM payload)
    API->>Storage: Store WebM in 'caregiver_audio/patient_id/uuid.webm'
    API->>DB: Insert Observation (status='pending', audio_path)
    API->>API: Run Deterministic Safety Engine
    Note over API: Safety Engine Detects Emergency Keyword: "fell"
    API->>DB: Update Status = 'escalated', priority = 100
    API-->>Clinician: Realtime WebSocket Alert: "CRITICAL: Patient Fall Reported"
    API->>Celery: Enqueue Background Extraction Job
    Celery->>LLM: Transcribe & Parse JSON Metadata
    LLM-->>Celery: Return Extracted JSON { Event: "Fall", Mood: "Confused" }
    Celery->>DB: Update Observation Record with Draft JSON
    Celery-->>FE: Notify Frontend: Extraction Complete
    FE->>Caregiver: Render Split-Screen Human-in-the-Loop Review Modal
    Caregiver->>FE: Review Transcript & Confirm Metadata
    FE->>API: POST /api/v1/observations/{id}/confirm
    API->>DB: Update Observation status = 'confirmed'
    Clinician->>FE: Open /clinician Dashboard
    FE->>API: GET /api/v1/patients/XYZ/trends
    API->>DB: Query Confirmed Longitudinal Trends
    DB-->>FE: Return Trend Data
    FE-->>Clinician: Render Recharts Trend Lines & Triage Feed
```

---

## 11. Security & Production Hardening

- **Zero Client Secrets:** The React bundle includes only public Supabase Anon keys. Service keys remain strictly on the backend.
- **Strict Row Level Security:** Every query executed against PostgreSQL is constrained by explicit membership policies (`patient_memberships`).
- **Private Audio Storage:** Audio files stored in `caregiver_audio` bucket are unreadable publicly. Access is gated by backend signed URLs with 15-minute expiration times.
- **Non-punitive Burnout Logs:** Caregiver strain scores in `burnout_logs` are locked to the user ID. Supervisors cannot query individual strain scores.
