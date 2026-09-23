import os
import io
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user
from app.api.v1.patients import get_user_supabase_client
from app.ai import speech_to_text

client = TestClient(app)

print("--- Running Audio & Speech-to-Text Tests ---")

class MockStorage:
    def __init__(self):
        self.uploads = {}
    def from_(self, bucket):
        self.current_bucket = bucket
        return self
    def upload(self, path, file, file_options):
        self.uploads[path] = file

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
                        "recorded_by": self.user_id, "raw_text": self.update_data.get('raw_text', ''),
                        "original_audio_path": self.update_data.get('original_audio_path', ''),
                        "extracted_metadata": {}, "priority_score": 0, "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z"
                    }])
                return MockResponse([])
            else: # select
                if self.user_id == "00000000-0000-0000-0000-000000000003" and self.value == "00000000-0000-0000-0000-000000000001":
                    return MockResponse([{
                        "id": self.value, "status": "pending", "patient_id": "00000000-0000-0000-0000-000000000099",
                        "recorded_by": self.user_id, "raw_text": "", "original_audio_path": None,
                        "extracted_metadata": {}, "priority_score": 0, "created_at": "2023-01-01T00:00:00Z", "updated_at": "2023-01-01T00:00:00Z"
                    }])
                return MockResponse([])

class MockClient:
    def __init__(self, user_id):
        self.user_id = user_id
        self.storage = MockStorage()
    def table(self, table_name):
        return MockQueryBuilder(table_name, self.user_id)

app.dependency_overrides[get_current_user] = lambda: "00000000-0000-0000-0000-000000000003"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("00000000-0000-0000-0000-000000000003")

def mock_transcribe(path):
    return "Mocked transcription result."
speech_to_text.transcribe_audio = mock_transcribe

# 1. Anonymous audio upload -> 401
app.dependency_overrides = {}
resp = client.post("/api/v1/observations/00000000-0000-0000-0000-000000000001/audio")
if resp.status_code == 401:
    print("Test: Anonymous audio upload -> PASS")
else:
    print(f"Test: Anonymous audio upload -> FAIL ({resp.status_code})")

app.dependency_overrides[get_current_user] = lambda: "00000000-0000-0000-0000-000000000003"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("00000000-0000-0000-0000-000000000003")

# 2. Invalid file type -> 400
resp = client.post("/api/v1/observations/00000000-0000-0000-0000-000000000001/audio", 
    files={"file": ("test.txt", io.BytesIO(b"abc"), "text/plain")},
    headers={"Authorization": "Bearer mock"}
)
if resp.status_code == 400:
    print("Test: Invalid file type -> PASS")
else:
    print(f"Test: Invalid file type -> FAIL ({resp.status_code})")

# 3. Oversized file -> DENIED (413)
big_file = b"0" * (11 * 1024 * 1024)
resp = client.post("/api/v1/observations/00000000-0000-0000-0000-000000000001/audio", 
    files={"file": ("test.wav", io.BytesIO(big_file), "audio/wav")},
    headers={"Authorization": "Bearer mock"}
)
if resp.status_code == 413:
    print("Test: Oversized file -> PASS")
else:
    print(f"Test: Oversized file -> FAIL ({resp.status_code})")

# 4. Unauthorized patient's observation -> DENIED
app.dependency_overrides[get_current_user] = lambda: "no-auth-user"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("no-auth-user")
resp = client.post("/api/v1/observations/00000000-0000-0000-0000-000000000001/audio", 
    files={"file": ("test.wav", io.BytesIO(b"audio"), "audio/wav")},
    headers={"Authorization": "Bearer mock"}
)
if resp.status_code == 404:
    print("Test: Unauthorized patient's observation -> DENIED -> PASS")
else:
    print(f"Test: Unauthorized patient's observation -> FAIL ({resp.status_code})")

# 5. Authorized upload -> PASS & check fields
app.dependency_overrides[get_current_user] = lambda: "00000000-0000-0000-0000-000000000003"
app.dependency_overrides[get_user_supabase_client] = lambda: MockClient("00000000-0000-0000-0000-000000000003")
resp = client.post("/api/v1/observations/00000000-0000-0000-0000-000000000001/audio", 
    files={"file": ("test.wav", io.BytesIO(b"audio"), "audio/wav")},
    headers={"Authorization": "Bearer mock"}
)

if resp.status_code == 200:
    print("Test: Authorized audio upload -> PASS")
    data = resp.json()
    if "observations/00000000-0000-0000-0000-000000000099/00000000-0000-0000-0000-000000000001/test.wav" in data["original_audio_path"]:
        print("Test: Audio path stored correctly -> PASS")
    else:
        print(f"Test: Audio path stored correctly -> FAIL ({data['original_audio_path']})")
        
    if "Mocked transcription result." in data["raw_text"]:
        print("Test: Speech-to-text service can be invoked & Transcription updates raw_text -> PASS")
    else:
        print("Test: Speech-to-text service can be invoked & Transcription updates raw_text -> FAIL")
        
    if data["status"] == "pending":
        print("Test: Observation is NOT automatically confirmed -> PASS")
    else:
        print(f"Test: Observation is NOT automatically confirmed -> FAIL (Status is {data['status']})")
else:
    print(f"Test: Authorized audio upload -> FAIL ({resp.status_code})")

# Unit Test for speech_to_text structure
print("\n--- AI Service Unit Tests ---")
import sys
from importlib import reload
reload(speech_to_text) # reload to get real function
try:
    assert hasattr(speech_to_text, 'transcribe_audio')
    assert hasattr(speech_to_text, 'get_whisper_model')
    print("Test: speech_to_text module structure and initialization -> PASS")
except Exception as e:
    print(f"Test: speech_to_text module -> FAIL ({e})")
