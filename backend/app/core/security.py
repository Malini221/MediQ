from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.core.config import settings

# auto_error=False allows us to throw a custom 401 instead of FastAPI's default 403
security = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Validates the Supabase JWT and returns the user ID.
    Uses the Supabase Auth API for strict verification against the remote server.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    
    try:
        # We instantiate a fresh client for auth validation using the ANON key.
        # This securely calls Supabase to verify the JWT without exposing service keys.
        auth_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        user_resp = auth_client.auth.get_user(token)
        
        if not user_resp or not user_resp.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return user_resp.user.id
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_system_role(allowed_roles: list[str]):
    """
    Factory dependency to enforce system-wide roles for users.
    (Implementation to be extended when accessing the profiles table).
    """
    def role_checker(user_id: str = Depends(get_current_user)):
        # Placeholder for actual DB role check
        return user_id
    return role_checker
