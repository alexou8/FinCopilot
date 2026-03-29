# FinCopilot

FinCopilot is a conversational finance copilot for students. It guides users through financial onboarding, builds a live profile from the conversation, flags important money issues, and compares "what if" scenarios so users can make better financial decisions.

## What the project does

- Collects financial context through a chat-based onboarding flow
- Builds and stores a financial profile in Supabase
- Detects issues such as risky spending patterns or weak savings choices
- Explains detected issues and can launch a browser-agent research workflow for deeper investigation
- Runs scenario simulations and compares before/after net-worth outcomes over time

## Tech stack

- Frontend: Next.js, React, Tailwind CSS, Supabase auth
- Backend: FastAPI, OpenAI API, Supabase, Playwright

## Project structure

```text
backend/        FastAPI API, prompts, services, tests, and environment config
frontend/       Next.js app, dashboard UI, auth flow, and client services
project-plan/   Planning documents and supporting project notes
```

## Prerequisites

- Node.js 20+
- npm
- Python 3.12+
- A Supabase project
- An OpenAI API key
- Playwright Chromium installed locally if you want to use the browser-agent flow

## Installation

Install the JavaScript dependencies from the repo root and the frontend app:

```bash
npm install
npm install --prefix frontend
```

Create and activate a Python virtual environment, then install the backend dependencies:

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

macOS/Linux:

```bash
source .venv/bin/activate
pip install -r backend/requirements.txt
```

If you want the browser-agent workflow, also install Chromium for Playwright:

```bash
python -m playwright install chromium
```

## Environment setup

### Backend

Create `backend/.env` by copying `backend/.env.example`, then fill in your values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
OPENAI_BROWSER_AGENT_MODEL=computer-use-preview
OPENAI_BROWSER_AGENT_FALLBACK_MODEL=gpt-4.1-mini
```

Notes:

- `backend/.env` must live inside the `backend/` folder because the API loads it from there.
- `SUPABASE_SERVICE_KEY` is recommended for reliable server-side writes. If it is missing, the backend falls back to `SUPABASE_KEY`, which can cause RLS errors.
- The browser-agent model variables are only needed for the browser-agent workflow.

### Frontend

Create `frontend/.env.local` with your Supabase client values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
BACKEND_URL=http://localhost:8000
```

Notes:

- `BACKEND_URL` is optional if your backend runs on `http://localhost:8000`.
- If the Supabase frontend variables are missing, the app can fall back to demo behavior and the real browser-agent flow will not start.

## How to run the project

After activating your Python virtual environment, start both services from the repo root:

```bash
npm run dev
```

This starts:

- Backend API: `http://localhost:8000`
- Frontend app: `http://localhost:3000`

If you want to run the services separately:

```bash
uvicorn backend.main:app --reload --port 8000
npm run dev --prefix frontend
```

## Helpful commands

```bash
python -m unittest backend.tests.test_issue_detection
npm run build --prefix frontend
```

For the full visible browser-agent setup and smoke-test workflow, see [BROWSER_AGENT_LOCAL_TESTING.md](./BROWSER_AGENT_LOCAL_TESTING.md).

## Team members and contributions

Based on the local git history in this repository:

- Alex Ou: browser-agent research workspace, landing/dashboard polish, auth and UI updates, and local testing/docs work
- Chris Anghel: onboarding and chat-context improvements, prompt updates, simulation UX polish, and shared UI feedback/toast work
- antonnemch: deterministic issue-detection rules, simulation-engine/backend logic, persistence updates, and backend test coverage
