import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend/ directory where it actually lives
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")  # anon/public key (used by frontend auth)
# Service role key bypasses RLS — required for server-side writes (profiles, simulations, conversations).
# Falls back to SUPABASE_KEY if not set, but RLS errors will occur unless that key is the service role.
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", SUPABASE_KEY)

# Hardcoded user ID for MVP (no auth)
DEFAULT_USER_ID: str = "default_user"
