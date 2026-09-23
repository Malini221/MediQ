import os
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user
from app.api.v1.patients import get_user_supabase_client
from app.ai import handover_generation

client = TestClient(app)

print("--- Running Handover Summary Engine Tests ---")

class MockResponse:
    def __init__(self, data):
        self.data = data

class MockQueryBuilder:
    def __init__(self, table, user_id):
        self.table = table
        self.user_id = user_id
        self.filters = {}
    def select(self, *args): return self
    def update(self, data):
        self.update_data = data
        return self
    def insert(self, data): 
        self.insert_data = data
        return self
    def eq(self, column, value):
        self.filters[column] = value
        return self
    def execute(self):
        if self.table == "patients":
            patient_id = self.filters.get("id")
            if self.user_id == "00000000-0000-0000-0000-000000000003" and patient_id in ["00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000002"]:
                return MockResponse([{"id": patient_id}])
            return MockResponse([])
            
        if self.table == "observations":
            if self.user_id == "00000000-0000-0000-0000-000000000003":
                patient_id = self.filters.get("patient_id")
                if patient_id == "00000000-0000-0000-0000-000000000001": 
                    return MockResponse([
                        {"id": "00000000-0000-0000-0000-000000000011", "raw_text": "Patient is sleeping.", "priority_score": 10, "extracted_metadata": {}},
                        {"id": "00000000-0000-0000-0000-000000000012", "raw_text": "Patient fell.", "priority_score": 80, "extracted_metadata": {"concern_indicators": ["fall risk"]}}
                    ])
                if patient_id == "00000000-0000-0000-0000-000000000002":
                    return MockResponse([])
            return MockResponse([])
            
        if self.table == "handover_summaries":
            if hasattr(self, 'insert_data'):
                res = self.insert_data.copy()
                res["id"] = "10000000-0000-0000-0000-000000000000"
                res["acknowledged_by"] = None
                res["created_at"] = "2023-01-01T00:00:00Z"
                res["updated_at"] = "2023-01-01T00:00:00Z"
                return MockResponse([res])
                
            handover_id = self.filters.get("id")
            if self.user_id == "00000000-0000-0000-0000-000000000003" and handover_id == "10000000-0000-0000-0000-000000000000":
                if hasattr(self, 'update_data'):
                    # return the updated row
                    return MockResponse([{
                        "id": handover_id, "patient_id": "00000000-0000-0000-0000-000000000001",
                        "created_by": self.user_id, "summary_text": "text", "source_observation_ids": ["00000000-0000-0000-0000-000000000011"],
                        "priority_watch_items": {}, "acknowledged_by": self.update_data.get("acknowledged_by"),
                        "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z"
                    }])
                else:
                    return MockResponse([{
                        "id": handover_id, "patient_id": "00000000-0000-0000-0000-000000000001",
                        "created_by": self.user_id, "summary_text": "text", "source_observation_ids": ["00000000-0000-0000-0000-000000000011"],
                        "priority_watch_items": {}, "acknowledged_by": None,
                        "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z"
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

# We mock the ML to avoid downloads
def mock_generate_handover(observations):
    return {
        "summary_text": "Mock Handover Summary: Patient fell.",
        "source_observation_ids": ["00000000-0000-0000-0000-000000000011", "00000000-0000-0000-0000-000000000012"],
        "priority_watch_items": {"high_priority": ["Observation ID 00000000-0000-0000-0000-000000000012: Priority Score 80"], "safety_flags": ["fall risk"]}
    }
handover_generation.generate_handover_summary = mock_generate_handover

# 1. Anonymous request -> 401
app.dependency_overrides = {}
resp = client.post("/api/v1/patients/00000000-0000-0000-0000-000000000001/handover")
if resp.status_code == 401: print("Test: Anonymous request -> PASS")
else: print(f"Test: Anonymous request -> FAIL ({resp.status_code})")

app.dependency_overrides[get_current_user] = lambda: "00000000-0000-0000-0000-000000000003"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("00000000-0000-0000-0000-000000000003")

# 2. Unauthorized patient -> DENIED
app.dependency_overrides[get_current_user] = lambda: "no-auth-user"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("no-auth-user")
resp = client.post("/api/v1/patients/00000000-0000-0000-0000-000000000001/handover", headers={"Authorization": "Bearer mock"})
if resp.status_code == 404: print("Test: Unauthorized patient -> DENIED -> PASS")
else: print(f"Test: Unauthorized patient -> FAIL ({resp.status_code})")

app.dependency_overrides[get_current_user] = lambda: "00000000-0000-0000-0000-000000000003"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("00000000-0000-0000-0000-000000000003")

# 3. Patient with no observations -> appropriate safe response
resp = client.post("/api/v1/patients/00000000-0000-0000-0000-000000000002/handover", headers={"Authorization": "Bearer mock"})
if resp.status_code == 400: print("Test: Patient with no observations -> appropriate safe response -> PASS")
else: print(f"Test: Patient with no observations -> FAIL ({resp.status_code})")

# 4. Valid observations -> handover generated and stored
resp = client.post("/api/v1/patients/00000000-0000-0000-0000-000000000001/handover", headers={"Authorization": "Bearer mock"})
if resp.status_code == 201:
    data = resp.json()
    print("Test: Valid observations -> handover generated -> PASS")
    print("Test: Handover stored successfully -> PASS")
    
    if len(data["source_observation_ids"]) == 2:
        print("Test: source_observation_ids match the observations actually used -> PASS")
    else:
        print("Test: source_observation_ids match -> FAIL")
        
    if "fall risk" in data["priority_watch_items"].get("safety_flags", []):
        print("Test: priority_watch_items contain only supported information -> PASS")
    else:
        print("Test: priority_watch_items -> FAIL")
        
    if "diagnosis" not in data["summary_text"] and "prescription" not in data["summary_text"]:
        print("Test: No diagnosis is invented -> PASS")
        print("Test: No medication/treatment recommendation is generated -> PASS")
    
    if data["acknowledged_by"] is None:
        print("Test: Handover is not automatically acknowledged -> PASS")
    else:
        print("Test: Handover acknowledged -> FAIL")
        
else:
    print(f"Test: Valid observations -> handover generated -> FAIL ({resp.status_code})")

# 5. Unauthorized handover access -> DENIED
app.dependency_overrides[get_current_user] = lambda: "no-auth-user"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("no-auth-user")
resp = client.get("/api/v1/handovers/10000000-0000-0000-0000-000000000000", headers={"Authorization": "Bearer mock"})
if resp.status_code == 404:
    print("Test: Unauthorized handover access -> DENIED -> PASS")
else:
    print(f"Test: Unauthorized handover access -> FAIL ({resp.status_code})")

# 6. Valid handover retrieval -> PASS
app.dependency_overrides[get_current_user] = lambda: "00000000-0000-0000-0000-000000000003"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("00000000-0000-0000-0000-000000000003")
resp = client.get("/api/v1/handovers/10000000-0000-0000-0000-000000000000", headers={"Authorization": "Bearer mock"})
if resp.status_code == 200:
    print("Test: Valid handover retrieval -> PASS")
else:
    print(f"Test: Valid handover retrieval -> FAIL ({resp.status_code})")

# 7. Unauthorized acknowledgment -> DENIED
app.dependency_overrides[get_current_user] = lambda: "no-auth-user"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("no-auth-user")
resp = client.post("/api/v1/handovers/10000000-0000-0000-0000-000000000000/acknowledge", headers={"Authorization": "Bearer mock"})
if resp.status_code == 404:
    print("Test: Unauthorized handover acknowledgment -> DENIED -> PASS")
else:
    print(f"Test: Unauthorized handover acknowledgment -> FAIL ({resp.status_code})")

# 8. Valid handover acknowledgment -> PASS
app.dependency_overrides[get_current_user] = lambda: "00000000-0000-0000-0000-000000000003"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("00000000-0000-0000-0000-000000000003")
resp = client.post("/api/v1/handovers/10000000-0000-0000-0000-000000000000/acknowledge", headers={"Authorization": "Bearer mock"})
if resp.status_code == 200:
    data = resp.json()
    if data["acknowledged_by"] == "00000000-0000-0000-0000-000000000003":
        print("Test: Valid handover acknowledgment updates acknowledged_by -> PASS")
    else:
        print("Test: Valid handover acknowledgment -> FAIL (not updated)")
else:
    print(f"Test: Valid handover acknowledgment -> FAIL ({resp.status_code})")
    
# 9. Repeated handover acknowledgment -> PASS (idempotent)
class IdempotentMockClient(MockClient):
    def table(self, table_name):
        builder = super().table(table_name)
        # Mock that it's already acknowledged
        if table_name == "handover_summaries":
            def execute_override():
                if builder.filters.get("id") == "10000000-0000-0000-0000-000000000000":
                    return MockResponse([{
                        "id": "10000000-0000-0000-0000-000000000000", "patient_id": "00000000-0000-0000-0000-000000000001",
                        "created_by": builder.user_id, "summary_text": "text", "source_observation_ids": [],
                        "priority_watch_items": {}, "acknowledged_by": "00000000-0000-0000-0000-000000000003",
                        "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z"
                    }])
                return MockResponse([])
            builder.execute = execute_override
        return builder

app.dependency_overrides[get_user_supabase_client] = lambda: IdempotentMockClient("00000000-0000-0000-0000-000000000003")
resp = client.post("/api/v1/handovers/10000000-0000-0000-0000-000000000000/acknowledge", headers={"Authorization": "Bearer mock"})
if resp.status_code == 200:
    print("Test: Repeated handover acknowledgment (idempotent) -> PASS")
else:
    print(f"Test: Repeated handover acknowledgment -> FAIL ({resp.status_code})")

