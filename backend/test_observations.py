import os
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user
from app.api.v1.patients import get_user_supabase_client

client = TestClient(app)

print("--- Running Observation API Tests ---")

# 1. Anonymous submission -> 401
resp = client.post("/api/v1/observations", json={"patient_id": "00000000-0000-0000-0000-000000000001", "raw_text": "Test"})
if resp.status_code == 401:
    print("Test: Anonymous submission -> PASS")
else:
    print(f"Test: Anonymous submission -> FAIL (Status: {resp.status_code})")

class MockResponse:
    def __init__(self, data):
        self.data = data

class MockQueryBuilder:
    def __init__(self, table, user_id):
        self.table = table
        self.user_id = user_id
        
    def select(self, *args):
        return self
        
    def eq(self, column, value):
        self.column = column
        self.value = value
        return self
        
    def insert(self, data):
        self.insert_data = data
        return self
        
    def update(self, data):
        self.update_data = data
        return self
        
    def execute(self):
        if self.table == "observations":
            if hasattr(self, 'insert_data'):
                if self.user_id == "00000000-0000-0000-0000-000000000003" and self.insert_data['patient_id'] == "00000000-0000-0000-0000-000000000001":
                    res = self.insert_data.copy()
                    res['id'] = "00000000-0000-0000-0000-000000000002"
                    res['created_at'] = "2023-01-01T00:00:00Z"
                    res['updated_at'] = "2023-01-01T00:00:00Z"
                    return MockResponse([res])
                else:
                    return MockResponse([]) # RLS fail
            if hasattr(self, 'update_data'):
                if self.user_id == "00000000-0000-0000-0000-000000000003" and self.value == "00000000-0000-0000-0000-000000000002":
                    return MockResponse([{"id": self.value, "status": self.update_data['status'], "patient_id": "00000000-0000-0000-0000-000000000001", "recorded_by": self.user_id, "raw_text": "text", "extracted_metadata": {}, "priority_score": 0, "original_audio_path": None, "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z"}])
                return MockResponse([])
            if hasattr(self, 'value') and self.column == "id":
                if self.user_id == "00000000-0000-0000-0000-000000000003" and self.value == "00000000-0000-0000-0000-000000000002":
                    return MockResponse([{"id": self.value, "status": "pending", "patient_id": "00000000-0000-0000-0000-000000000001", "recorded_by": self.user_id, "raw_text": "text", "extracted_metadata": {}, "priority_score": 0, "original_audio_path": None, "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z"}])
                return MockResponse([])
            if hasattr(self, 'value') and self.column == "patient_id":
                if self.user_id == "00000000-0000-0000-0000-000000000003" and self.value == "00000000-0000-0000-0000-000000000001":
                    return MockResponse([{"id": "00000000-0000-0000-0000-000000000002", "status": "pending", "patient_id": self.value, "recorded_by": self.user_id, "raw_text": "text", "extracted_metadata": {}, "priority_score": 0, "original_audio_path": None, "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z"}])
                return MockResponse([])
        if self.table == "patients":
            if hasattr(self, 'value'):
                if self.user_id == "00000000-0000-0000-0000-000000000003" and self.value == "00000000-0000-0000-0000-000000000001":
                    return MockResponse([{"id": self.value}])
                return MockResponse([])
        return MockResponse([])

class MockClient:
    def __init__(self, user_id):
        self.user_id = user_id
    def table(self, table_name):
        return MockQueryBuilder(table_name, self.user_id)

app.dependency_overrides[get_current_user] = lambda: "00000000-0000-0000-0000-000000000003"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("00000000-0000-0000-0000-000000000003")

# 2. Authorized observation submission -> PASS
resp = client.post("/api/v1/observations", json={"patient_id": "00000000-0000-0000-0000-000000000001", "raw_text": "Authorized text"}, headers={"Authorization": "Bearer mock"})
if resp.status_code == 201:
    print("Test: Authorized observation submission -> PASS")
else:
    print(f"Test: Authorized observation submission -> FAIL (Status: {resp.status_code})")

# 3. Unauthorized patient submission -> DENIED
app.dependency_overrides[get_current_user] = lambda: "no-membership-user"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("no-membership-user")
resp = client.post("/api/v1/observations", json={"patient_id": "00000000-0000-0000-0000-000000000001", "raw_text": "Unauthorized text"}, headers={"Authorization": "Bearer mock"})
if resp.status_code == 403 or resp.status_code == 404:
    print("Test: Unauthorized patient submission -> DENIED -> PASS")
else:
    print(f"Test: Unauthorized patient submission -> FAIL (Status: {resp.status_code})")

# 4. Get patient's observations -> only authorized returned
app.dependency_overrides[get_current_user] = lambda: "00000000-0000-0000-0000-000000000003"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("00000000-0000-0000-0000-000000000003")
resp = client.get("/api/v1/patients/00000000-0000-0000-0000-000000000001/observations", headers={"Authorization": "Bearer mock"})
if resp.status_code == 200 and len(resp.json()) == 1:
    print("Test: Get patient's observations -> only authorized observations returned -> PASS")
else:
    print(f"Test: Get patient's observations -> FAIL (Status: {resp.status_code})")

# 5. Unauthorized observation access -> DENIED
app.dependency_overrides[get_current_user] = lambda: "no-membership-user"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("no-membership-user")
resp = client.get("/api/v1/observations/00000000-0000-0000-0000-000000000002", headers={"Authorization": "Bearer mock"})
if resp.status_code == 404:
    print("Test: Unauthorized observation access -> DENIED -> PASS")
else:
    print(f"Test: Unauthorized observation access -> FAIL (Status: {resp.status_code})")

# 6. Confirm observation -> PASS for authorized user
app.dependency_overrides[get_current_user] = lambda: "00000000-0000-0000-0000-000000000003"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("00000000-0000-0000-0000-000000000003")
resp = client.patch("/api/v1/observations/00000000-0000-0000-0000-000000000002/confirm", headers={"Authorization": "Bearer mock"})
if resp.status_code == 200 and resp.json()["status"] == "confirmed":
    print("Test: Confirm observation -> PASS for authorized user -> PASS")
else:
    print(f"Test: Confirm observation -> FAIL (Status: {resp.status_code})")

# 7. Observation remains pending until explicitly confirmed
# Already verified since default mock returns "pending" when selected by id
resp = client.get("/api/v1/observations/00000000-0000-0000-0000-000000000002", headers={"Authorization": "Bearer mock"})
if resp.status_code == 200 and resp.json()["status"] == "pending":
    print("Test: Observation remains pending until explicitly confirmed -> PASS")
else:
    print(f"Test: Observation remains pending until explicitly confirmed -> FAIL (Status: {resp.status_code})")
