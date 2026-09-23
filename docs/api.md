# MediQ — REST API Specification (`/api/v1`)

All endpoints require HTTPS and an OAuth2 Bearer token (Supabase JWT) in the `Authorization` header unless otherwise specified.

Base URL: `https://api.mediq.local/api/v1`

---

## 1. Observations Endpoints

### `POST /observations/submit`
Accepts a text observation or an uploaded WebM audio recording, validates user authorization, saves raw data, executes deterministic safety checks, and enqueues extraction workers.

- **Content-Type:** `multipart/form-data`
- **Request Parameters:**
  - `patient_id` (UUID, required): Target patient ID.
  - `text` (String, optional): Free-text observation.
  - `audio` (File binary, optional): Audio recording (`audio/webm`, max 25MB).
- **Security Checks:**
  - Validates authenticated user.
  - Verifies `patient_memberships` record for `(auth.uid, patient_id)`.
  - Rejects files with invalid MIME type or size > 25MB.
- **Response `202 Accepted`:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "patient_id": "987f6543-e21b-12d3-a456-426614174000",
  "status": "pending",
  "priority_score": 0,
  "is_emergency": false,
  "audio_path": "caregiver_audio/987f6543.../123e4567....webm",
  "message": "Observation ingested. Extraction job enqueued."
}
```
- **Error Responses:**
  - `400 Bad Request`: Missing both text and audio file.
  - `403 Forbidden`: User does not have membership access to patient.
  - `413 Payload Too Large`: Audio file exceeds 25MB limit.

---

### `POST /observations/{id}/confirm`
Accepts user-verified extracted JSON metadata and confirms the observation into the permanent database record.

- **Content-Type:** `application/json`
- **Path Parameter:** `id` (UUID) - Observation ID.
- **Request Body:**
```json
{
  "raw_text": "Patient ate half lunch, slept 6 hours, complained of mild hip pain.",
  "extracted_metadata": {
    "event_type": "Daily Log",
    "mood": "Calm",
    "appetite": "Moderate",
    "sleep_hours": 6,
    "symptoms": ["Mild hip pain"],
    "notes": "Patient requested extra pillow."
  }
}
```
- **Response `200 OK`:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "confirmed",
  "priority_score": 25,
  "updated_at": "2026-09-22T12:00:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request`: Pydantic metadata validation failure.
  - `403 Forbidden`: User did not author observation or lacks patient membership.

---

### `GET /observations`
Lists observations for a specific patient.

- **Query Parameters:**
  - `patient_id` (UUID, required): Target patient ID.
  - `status` (String, optional): Filter by `pending`, `confirmed`, `escalated`.
  - `limit` (Int, default 20): Result limit.
- **Response `200 OK`:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "patient_id": "987f6543-e21b-12d3-a456-426614174000",
    "recorded_by_name": "Jane Doe, RN",
    "raw_text": "Patient slept well...",
    "extracted_metadata": {},
    "status": "confirmed",
    "priority_score": 10,
    "created_at": "2026-09-22T10:30:00Z"
  }
]
```

---

## 2. Patients & Handovers Endpoints

### `GET /patients`
Retrieves list of patients assigned to the authenticated user.

- **Response `200 OK`:**
```json
[
  {
    "id": "987f6543-e21b-12d3-a456-426614174000",
    "full_name": "Arthur Pendelton",
    "date_of_birth": "1948-05-14",
    "primary_diagnosis": "Dementia / Hypertension",
    "assigned_role": "professional_caregiver"
  }
]
```

---

### `POST /handovers/generate`
Calculates deviations from patient baseline conditions over the past 24 hours and generates prioritized top 3–5 watch items for the incoming shift.

- **Request Body:**
```json
{
  "patient_id": "987f6543-e21b-12d3-a456-426614174000"
}
```
- **Response `200 OK`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "patient_id": "987f6543-e21b-12d3-a456-426614174000",
  "summary_text": "Shift brief: Patient exhibited acute agitation at 14:00. Sleep duration was 4.5 hours.",
  "priority_watch_items": [
    { "item": "Monitor agitation symptoms", "priority": "high" },
    { "item": "Check blood pressure at 18:00", "priority": "medium" }
  ],
  "created_at": "2026-09-22T11:00:00Z"
}
```

---

### `POST /handovers/{id}/acknowledge`
Records nurse acknowledgment for a shift handover brief.

- **Response `200 OK`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "acknowledged_by": "33333333-3333-3333-3333-333333333333",
  "acknowledged_at": "2026-09-22T11:05:00Z"
}
```

---

## 3. RAG Clinical Guidance & Burnout Endpoints

### `GET /guidance/search`
Performs vector similarity search (`pgvector` HNSW index) over approved clinical care steps.

- **Query Parameters:** `q` (String, required): Search prompt.
- **Response `200 OK`:**
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "title": "Managing Sundowning & Evening Agitation",
    "category": "Dementia Care",
    "content": "Ensure ambient lighting is softened around 16:00. Reduce background noise...",
    "similarity_score": 0.89
  }
]
```

---

### `GET /burnout`
Retrieves private strain indicators for the authenticated caregiver.

- **Response `200 OK`:**
```json
{
  "strain_score": 42,
  "status": "moderate",
  "intervention_offered": "Consider taking a 10-minute micro-break between shift logs.",
  "last_assessed": "2026-09-22T08:00:00Z"
}
```
- **Privacy Enforcement:** RLS restricts queries to `auth.uid() = user_id`. No supervisor or employer access.
