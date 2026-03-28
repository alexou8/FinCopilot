from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import chat, issues, profiles, scenarios

app = FastAPI(title="FinCopilot API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(issues.router)
app.include_router(profiles.router)
app.include_router(scenarios.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
