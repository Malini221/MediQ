import os
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user

client = TestClient(app)

print("--- Running Authentication Tests ---")

# 1. Missing Authorization Header
resp = client.get("/api/v1/auth/me")
if resp.status_code == 401:
    print("Test: Missing Authorization header -> PASS")
else:
    print(f"Test: Missing Authorization header -> FAIL (Status: {resp.status_code})")

# 2. Invalid Bearer token
resp = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid_fake_token"})
if resp.status_code == 401:
    print("Test: Invalid Bearer token -> PASS")
else:
    print(f"Test: Invalid Bearer token -> FAIL (Status: {resp.status_code})")

# 3. Valid token
# We mock the dependency since we don't have a real Supabase user authenticated in the test runner
app.dependency_overrides[get_current_user] = lambda: "mock-user-123"
resp = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer valid_mock_token"})
if resp.status_code == 200 and resp.json() == {"id": "mock-user-123"}:
    print("Test: Valid token -> authenticated user -> PASS")
else:
    print(f"Test: Valid token -> authenticated user -> FAIL (Status: {resp.status_code})")

# 4. Protected endpoint cannot be accessed anonymously
# Remove the override
app.dependency_overrides = {}
resp = client.get("/api/v1/auth/me")
if resp.status_code == 401:
    print("Test: Protected endpoint cannot be accessed anonymously -> PASS")
else:
    print(f"Test: Protected endpoint cannot be accessed anonymously -> FAIL (Status: {resp.status_code})")
