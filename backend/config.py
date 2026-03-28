import os
from pathlib import Path
from dotenv import load_dotenv

# Ensure we load .env from the project root regardless of working directory
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)

OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

# Hardcoded user ID for MVP (no auth)
DEFAULT_USER_ID: str = "default_user"
