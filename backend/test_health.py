from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("--- Testing GET /health ---")
response = client.get("/health")
print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")

print("\n--- Testing GET /health/db ---")
response = client.get("/health/db")
print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")
