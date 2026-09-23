import os
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user
from app.api.v1.patients import get_user_supabase_client
from app.ai import observation_extraction

client = TestClient(app)

print("--- Running AI Observation Extraction Tests ---")

class MockResponse:
    def __init__(self, data):
        self.data = data

class MockQueryBuilder:
    def __init__(self, table, user_id):
        self.table = table
        self.user_id = user_id
    def select(self, *args): return self
    def update(self, data):
        self.update_data = data
        return self
    def eq(self, column, value):
        self.column = column
        self.value = value
        return self
    def execute(self):
        if self.table == "observations":
            if hasattr(self, 'update_data'):
                if self.user_id == "00000000-0000-0000-0000-000000000003" and self.value == "00000000-0000-0000-0000-000000000001":
                    return MockResponse([{
                        "id": self.value, "status": "pending", "patient_id": "00000000-0000-0000-0000-000000000099",
                        "recorded_by": self.user_id, "raw_text": "Patient has a mild fever.",
                        "original_audio_path": None,
                        "extracted_metadata": self.update_data.get('extracted_metadata', {}), 
                        "priority_score": 0, "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z"
                    }])
                return MockResponse([])
            else: # select
                if self.user_id == "00000000-0000-0000-0000-000000000003":
                    if self.value == "00000000-0000-0000-0000-000000000001": # Valid text
                        return MockResponse([{
                            "id": self.value, "status": "pending", "patient_id": "00000000-0000-0000-0000-000000000099",
                            "recorded_by": self.user_id, "raw_text": "Patient has a mild fever.", "original_audio_path": None,
                            "extracted_metadata": {}, "priority_score": 0, "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z"
                        }])
                    elif self.value == "00000000-0000-0000-0000-000000000002": # Empty text
                        return MockResponse([{
                            "id": self.value, "status": "pending", "patient_id": "00000000-0000-0000-0000-000000000099",
                            "recorded_by": self.user_id, "raw_text": "", "original_audio_path": None,
                            "extracted_metadata": {}, "priority_score": 0, "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z"
                        }])
                return MockResponse([])
        return MockResponse([])

class MockClient:
    def __init__(self, user_id):
        self.user_id = user_id
    def table(self, table_name):
        return MockQueryBuilder(table_name, self.user_id)

app.dependency_overrides[get_current_user] = lambda: "00000000-0000-0000-0000-000000000003"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("00000000-0000-0000-0000-000000000003")

def mock_extract_metadata(text):
    return {
        "category": "symptom report",
        "symptoms": ["mild fever"],
        "relevant_clinical_details": [],
        "concern_indicators": [],
        "sentiment_indicators": "neutral",
        "extracted_entities": ["fever"]
    }
observation_extraction.extract_metadata = mock_extract_metadata

# 1. Anonymous request -> 401
app.dependency_overrides = {}
resp = client.post("/api/v1/observations/00000000-0000-0000-0000-000000000001/analyze")
if resp.status_code == 401:
    print("Test: Anonymous analyze request -> PASS")
else:
    print(f"Test: Anonymous analyze request -> FAIL ({resp.status_code})")

app.dependency_overrides[get_current_user] = lambda: "00000000-0000-0000-0000-000000000003"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("00000000-0000-0000-0000-000000000003")

# 2. Unauthorized patient -> DENIED
app.dependency_overrides[get_current_user] = lambda: "no-auth-user"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("no-auth-user")
resp = client.post("/api/v1/observations/00000000-0000-0000-0000-000000000001/analyze", headers={"Authorization": "Bearer mock"})
if resp.status_code == 404:
    print("Test: Unauthorized patient -> DENIED -> PASS")
else:
    print(f"Test: Unauthorized patient -> FAIL ({resp.status_code})")

app.dependency_overrides[get_current_user] = lambda: "00000000-0000-0000-0000-000000000003"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("00000000-0000-0000-0000-000000000003")

# 3. Empty raw_text -> 400
resp = client.post("/api/v1/observations/00000000-0000-0000-0000-000000000002/analyze", headers={"Authorization": "Bearer mock"})
if resp.status_code == 400:
    print("Test: Empty raw_text -> PASS")
else:
    print(f"Test: Empty raw_text -> FAIL ({resp.status_code})")

# 4. Valid observation -> extraction PASS
resp = client.post("/api/v1/observations/00000000-0000-0000-0000-000000000001/analyze", headers={"Authorization": "Bearer mock"})
if resp.status_code == 200:
    print("Test: Valid observation -> extraction PASS")
    data = resp.json()
    
    # 5. Structured output matches schema and stored
    meta = data["extracted_metadata"]
    if meta.get("category") == "symptom report" and "mild fever" in meta.get("symptoms", []):
        print("Test: Structured output matches schema & extracted_metadata is stored successfully -> PASS")
    else:
        print("Test: Structured output matches schema -> FAIL")
        
    # 6. Existing raw_text preserved
    if data["raw_text"] == "Patient has a mild fever.":
        print("Test: Existing raw_text is preserved -> PASS")
    else:
        print("Test: Existing raw_text is preserved -> FAIL")
        
    # 7. Remains pending
    if data["status"] == "pending":
        print("Test: Observation remains pending/not automatically confirmed -> PASS")
    else:
        print("Test: Observation remains pending -> FAIL")
        
    # 8. No diagnosis
    if "diagnosis" not in meta and "medication" not in meta:
        print("Test: No diagnosis or medication is invented -> PASS")
    else:
        print("Test: No diagnosis or medication is invented -> FAIL")
else:
    print(f"Test: Valid observation -> FAIL ({resp.status_code})")
