# Browser Agent Local Testing

This project has a visible browser-agent flow. It does not run in demo mode.

To test it locally, you need:

- Python 3.12+
- Node.js 20+
- npm
- A desktop session that can open a visible Chromium window
- An OpenAI API key
- Access to at least one browser-agent-capable model path:
  - preferred: `computer-use-preview`
  - fallback: `gpt-4.1-mini` or whatever you set in `OPENAI_BROWSER_AGENT_FALLBACK_MODEL`
- Playwright's Chromium browser installed locally
- Supabase configured for auth and profile storage

## 1. Install dependencies

From the repo root:

```powershell
npm install
pip install -r backend/requirements.txt
python -m playwright install chromium
```

Notes:

- `playwright` is required by the backend for the visible browser session.
- `python -m playwright install chromium` is required even after `pip install`.

## 2. Configure frontend auth env

The frontend reads Supabase credentials from [frontend/.env.local](c:/Users/Ouale/OneDrive/Documents/GitHub/FinCopilot/frontend/.env.local).

Required values:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

If these are missing, the app falls back to demo mode, and the real browser agent will not start.

## 3. Configure backend env

Create `backend/.env` with at least:

```env
OPENAI_API_KEY=...
OPENAI_BROWSER_AGENT_MODEL=computer-use-preview
OPENAI_BROWSER_AGENT_FALLBACK_MODEL=gpt-4.1-mini
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_SERVICE_KEY=...
```

Notes:

- `SUPABASE_SERVICE_KEY` should be the service-role key for reliable backend writes.
- If `computer-use-preview` is not available to your OpenAI project, the app will automatically try the fallback model.
- If neither model path is available, the browser agent will fail.

## 4. Start the app

From the repo root:

```powershell
npm run dev
```

That starts:

- FastAPI on `http://localhost:8000`
- Next.js on `http://localhost:3000`

## 5. Sign in and create test data

The browser agent starts from issue cards, so you need a real signed-in session and at least one detectable issue.

Recommended flow:

1. Open `http://localhost:3000/login`
2. Sign in with a Supabase-backed account
3. Use the chat/onboarding flow to create a financial profile
4. Make sure the profile creates at least one issue in the Issues panel
5. Open an issue with a research action
6. Let FinCopilot load the Browser Agent view and start the visible browser session

## 6. What "working" looks like

When the feature is functioning correctly:

- the dashboard switches into the Browser Agent workspace
- a visible Chromium window opens on your machine
- the agent status updates in the dashboard
- the exploration trail starts filling in
- analyzed pages and coverage counts increase
- the analysis report appears after the run completes

## 7. Common failure cases

### Demo mode

Symptom:

- the app works, but the browser agent never launches a real browser

Cause:

- frontend Supabase env is missing, so the app is running in demo mode

Fix:

- set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `frontend/.env.local`

### Playwright/Chromium missing

Symptom:

- browser agent status shows a runtime issue about Playwright or Chromium

Fix:

```powershell
pip install -r backend/requirements.txt
python -m playwright install chromium
```

### No access to `computer-use-preview`

Symptom:

- the run switches to `Vision-Guided Fallback`

Meaning:

- this is expected when the OpenAI project cannot use `computer-use-preview`

Fix:

- no fix is needed if the fallback model works
- if you want the full computer-use path, use an OpenAI project with access to `computer-use-preview`

### OpenAI setup missing

Symptom:

- browser agent fails immediately or analysis report generation fails

Fix:

- confirm `OPENAI_API_KEY` is set in `backend/.env`
- confirm the configured model names are valid for your OpenAI project

### No issues to launch from

Symptom:

- the browser agent page loads, but there is nothing meaningful to run

Fix:

- create or load a financial profile that triggers at least one issue card

## 8. Minimum smoke test

Use this quick verification checklist:

1. `npm run dev`
2. Sign in through the real Supabase-backed login flow
3. Create a profile that triggers an issue such as low-yield savings or high rent burden
4. Click the issue's research action
5. Confirm a visible Chromium window opens
6. Confirm the dashboard Browser Agent page shows:
   - live status
   - exploration trail entries
   - analyzed pages
   - final analysis report

## 9. Optional validation commands

```powershell
python -m unittest backend.tests.test_issue_detection
npm run build --prefix frontend
```
