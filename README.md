# MediQ — AI-Powered Caregiver Coordination & Patient Care Platform

MediQ is a secure care-coordination platform designed to connect **patients, family caregivers, professional caregivers, clinicians, and care coordinators** in one place.

The main goal is to reduce fragmented care information, improve communication between care teams, make patient observations easier to capture, and support caregivers in managing workload and continuity of care.

---

## 1. The Problem

In real-world caregiving, patient information is often scattered across:

* Verbal handovers
* Manual notes
* Messages
* Separate records
* Different caregivers and shifts

Because of this, important changes in a patient's condition can be missed, repeated information may be recorded, and caregivers may spend significant time documenting and communicating updates.

Patients can also have limited visibility into what their care team has recorded or communicated.

**MediQ addresses this coordination gap by bringing the patient and care team into one connected platform.**

---

## 2. Our Solution

MediQ provides two connected experiences:

### Patient Portal

Patients can:

* View their care overview
* Check their care team
* View recent care updates
* Submit health observations
* Send text or voice reports
* Share how they are feeling
* View notifications
* Access approved care guidance
* View relevant patient information

### Caregiver Portal

Caregivers can:

* Select and manage assigned patients
* View patient information
* Record observations
* Capture voice-based observations
* Review patient reports
* Monitor important changes
* Review safety alerts
* Generate and review handovers
* Access clinical guidance
* Track caregiver support/strain signals

---

# 3. How MediQ Works

```text
Patient / Caregiver
        ↓
 Text or Voice Input
        ↓
 Observation Processing
        ↓
 Safety Detection
        ↓
 AI Extraction
        ↓
 Human Confirmation
        ↓
 Structured Patient Record
        ↓
 Care Team
        ↓
 Handover / Guidance / Notifications
```

For example:

**Patient reports:**
"I have been feeling unusually tired since yesterday."

MediQ can capture the report, associate it with the correct patient, process the information, and make the update available to the authorized care team.

---

# 4. AI Intelligence

AI is used to assist caregivers rather than replace human decision-making.

### Speech-to-Text

Voice observations can be converted into text using a **local/open-source Whisper implementation**.

### Structured Extraction

An open-source/local language model can extract structured information from caregiver observations.

The generated information is validated using **Pydantic** before it is stored.

### Safety Detection

Emergency detection is handled separately using **deterministic Python rules/regex**.

This means the emergency pathway does not depend only on an AI model.

### Semantic Guidance Search

Approved clinical guidance can be converted into embeddings and searched using semantic similarity through **pgvector**.

### Handover Intelligence

Recent observations, priorities, safety information, and patient changes can be combined to generate structured shift-handover information.

---

# 5. Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* Lucide React

## Backend

* Python
* FastAPI
* Pydantic
* REST APIs

## Database & Authentication

* Supabase Auth
* PostgreSQL
* Row Level Security (RLS)
* Supabase Storage
* pgvector

## AI / ML

* Local/open-source Whisper
* Local/open-source LLM
* Local embedding model
* Python-based safety detection
* Local/open-source sentiment/strain analysis

## Background Processing

* Redis
* Celery

---

# 6. System Architecture

```text
                    MEDIQ USERS
                         │
          ┌──────────────┴──────────────┐
          │                             │
       PATIENT                      CARE TEAM
          │                             │
          └──────────────┬──────────────┘
                         ↓
                React + TypeScript
                   Frontend
                         │
                      HTTPS
                         ↓
                 FastAPI Backend
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
       AI Layer       Safety        Business
                       Engine         Logic
          │              │              │
          └──────────────┼──────────────┘
                         ↓
                 Supabase Backend
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
     PostgreSQL       Storage        pgvector
          │
          ↓
    Patient / Care
       Records
```

---

# 7. Security & Privacy

MediQ handles potentially sensitive healthcare information, so security is part of the architecture.

Key measures include:

* Supabase authentication
* Role-based access
* Patient-level access control
* PostgreSQL Row Level Security
* Private caregiver audio storage
* Backend authorization
* Server-side patient membership verification
* Environment-based secret management
* No private API keys in the frontend
* Secure file validation
* HTTPS in production

A patient should only be able to access information belonging to them, while caregivers can only access patients assigned to them.

---

# 8. Role-Based Access

### Patient

```text
Personal Care
   ↓
Reports
   ↓
Care Team
   ↓
Updates
   ↓
Notifications
```

### Family Caregiver

```text
Assigned Patients
   ↓
Patient Updates
   ↓
Observations
   ↓
Care Coordination
```

### Professional Caregiver

```text
Assigned Patients
   ↓
Observations
   ↓
Watch Items
   ↓
Shift Handover
```

### Clinician

```text
Patient History
   ↓
Observations
   ↓
Trends
   ↓
Clinical Guidance
```

### Coordinator

```text
Care Team
   ↓
Patients
   ↓
Alerts
   ↓
Handover Status
   ↓
Caregiver Support
```

---

# 9. Innovation & Uniqueness

MediQ focuses on **care continuity**, rather than simply storing patient information.

### Connected Patient + Caregiver Workflow

Information submitted by the patient can become part of the authorized caregiver's care context.

### Voice-First Observation Capture

Caregivers can record observations naturally instead of depending entirely on manual typing.

### AI-Assisted, Human-Confirmed Workflow

AI helps structure information, while important information can still be reviewed and confirmed by humans.

### Independent Safety Layer

Safety detection operates separately from the generative AI system.

### Intelligent Handover

Relevant observations and changes can be transformed into structured handover information for the next caregiver.

### Caregiver Support

MediQ also considers caregiver workload and strain signals instead of focusing only on the patient.

---

# 10. Free-First AI Architecture

MediQ follows a **free-first and local-first approach**.

Whenever practical:

```text
Local / Open Source
        ↓
Free Hosted Service
        ↓
Paid API only with approval
```

This reduces:

* API costs
* External dependencies
* Privacy exposure
* Vendor lock-in

AI providers are isolated behind provider interfaces so they can be replaced later without redesigning the whole system.

---

# 11. Data Flow Example

### Patient → Caregiver

```text
Patient
   ↓
Voice/Text Report
   ↓
MediQ
   ↓
Patient-specific record
   ↓
Authorized Caregiver
   ↓
Caregiver reviews update
```

### Caregiver → Patient

```text
Caregiver
   ↓
Observation / Care Update
   ↓
MediQ
   ↓
Patient record
   ↓
Patient Portal
   ↓
Patient sees authorized update
```

### Caregiver → Next Caregiver

```text
Observation
     ↓
AI Processing
     ↓
Priority + Safety
     ↓
Handover Generation
     ↓
Next Caregiver
```

---

# 12. Project Structure

```text
MediQ/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── ai/
│   │   ├── services/
│   │   ├── safety/
│   │   ├── providers/
│   │   └── workers/
│   └── pyproject.toml
│
├── database/
│   ├── migrations/
│   └── seed/
│
├── models/
│
├── docs/
│
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

# 13. Running the Project Locally

### Backend

```powershell
cd backend
uv run uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

### Frontend

From the frontend directory:

```powershell
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

The frontend should communicate with the FastAPI backend through the configured API base URL.

---

# 14. Development Data

For development and demonstration, MediQ can use **synthetic/demo patient data**.

Example:

```text
Patient
Name: Demo Patient
Condition: Type 2 Diabetes
Care Status: Active
```

Example care team:

```text
Family Caregiver
Professional Caregiver
Clinician
Coordinator
```

This allows the complete patient → caregiver → handover workflow to be demonstrated without using real patient information.

---

# 15. Project Goals

MediQ aims to provide:

* Better care continuity
* Easier observation capture
* Faster communication
* Structured handovers
* Patient participation
* Caregiver support
* Secure patient data isolation
* AI-assisted care coordination

---

# 16. Future Scope

Possible future extensions include:

* Mobile application
* Multilingual voice support
* Wearable integration
* Offline-first functionality
* Advanced patient trend analysis
* Healthcare-system integration
* More specialized AI models
* Real-time care-team communication

---

## 17. Final Vision

**MediQ connects the people, information, and intelligence involved in everyday care.**

Instead of patient information being scattered across notes, conversations, and shifts, MediQ creates a connected workflow where information can be **captured, understood, reviewed, and communicated to the right person.**

> **MediQ — From fragmented care information to connected care intelligence.**
