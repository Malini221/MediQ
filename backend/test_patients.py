import os
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user
from app.api.v1.patients import get_user_supabase_client

client = TestClient(app)

print("--- Running Patient API Tests ---")

# 1. Anonymous GET -> 401
resp = client.get("/api/v1/patients")
if resp.status_code == 401:
    print("Test: Anonymous GET /api/v1/patients -> PASS")
else:
    print(f"Test: Anonymous GET /api/v1/patients -> FAIL (Status: {resp.status_code})")

# Mocking for authenticated tests
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
        
    def execute(self):
        if self.table == "patients":
            if hasattr(self, 'value'): # get by ID
                if self.value == "00000000-0000-0000-0000-000000000001" and self.user_id == "mock-user-123":
                    return MockResponse([{"id": self.value, "full_name": "Test Patient", "date_of_birth": "1990-01-01", "primary_diagnosis": "Test", "baseline_conditions": {}, "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z"}])
                else:
                    return MockResponse([]) 
            else: # get all
                if self.user_id == "mock-user-123":
                    return MockResponse([{"id": "00000000-0000-0000-0000-000000000001", "full_name": "Test Patient", "date_of_birth": "1990-01-01", "primary_diagnosis": "Test", "baseline_conditions": {}, "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z"}])
                elif self.user_id == "no-membership-user":
                    return MockResponse([])
        return MockResponse([])

class MockClient:
    def __init__(self, user_id):
        self.user_id = user_id
    def table(self, table_name):
        return MockQueryBuilder(table_name, self.user_id)

def get_mock_client_user123():
    return MockClient("mock-user-123")

def get_mock_client_no_membership():
    return MockClient("no-membership-user")

app.dependency_overrides[get_current_user] = lambda: "mock-user-123"
app.dependency_overrides[get_user_supabase_client] = get_mock_client_user123

# 2. Authenticated user with membership -> only assigned patients returned
resp = client.get("/api/v1/patients", headers={"Authorization": "Bearer mock"})
if resp.status_code == 200 and len(resp.json()) == 1:
    print("Test: Authenticated user with membership -> only assigned patients returned -> PASS")
else:
    print(f"Test: Authenticated user with membership -> FAIL (Status: {resp.status_code})")

# 3. Authenticated user without membership -> cannot access patient
app.dependency_overrides[get_current_user] = lambda: "no-membership-user"
app.dependency_overrides[get_user_supabase_client] = get_mock_client_no_membership
resp = client.get("/api/v1/patients", headers={"Authorization": "Bearer mock"})
if resp.status_code == 200 and len(resp.json()) == 0:
    print("Test: Authenticated user without membership -> cannot access patient -> PASS")
else:
    print(f"Test: Authenticated user without membership -> FAIL (Status: {resp.status_code})")

# 4. Accessing another patient's ID -> denied
resp = client.get("/api/v1/patients/00000000-0000-0000-0000-000000000002", headers={"Authorization": "Bearer mock"})
if resp.status_code == 404:
    print("Test: Accessing another patient's ID -> denied -> PASS")
else:
    print(f"Test: Accessing another patient's ID -> denied -> FAIL (Status: {resp.status_code})")

# 5. Valid patient access -> correct patient data returned
app.dependency_overrides[get_current_user] = lambda: "mock-user-123"
app.dependency_overrides[get_user_supabase_client] = get_mock_client_user123
resp = client.get("/api/v1/patients/00000000-0000-0000-0000-000000000001", headers={"Authorization": "Bearer mock"})
if resp.status_code == 200 and resp.json()["id"] == "00000000-0000-0000-0000-000000000001":
    print("Test: Valid patient access -> correct patient data returned -> PASS")
else:
    print(f"Test: Valid patient access -> FAIL (Status: {resp.status_code})")
