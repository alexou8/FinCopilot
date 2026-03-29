# Financial Issue Research Agent

An issue-driven browser companion for FinCopilot that launches from each financial issue card, uses the OpenAI API to ground recommendations in current web information, and opens a real browser tab for user-guided follow-through.

## Goal

Turn each issue-button click into a guided research workflow instead of a dead-end navigation jump. The user should be able to:

- open a research workspace from any detected financial issue
- see what the agent is trying to verify
- launch a focused web search in a new tab
- review current sources, rates, costs, or support options
- convert that research into a concrete next move

## Product Positioning

This is a guided browser layer, not a hidden autonomous crawler.

- The app should narrate what it is researching.
- The user should control when a new tab opens.
- Current sources should be visible inside the UI.
- The first version should bias toward trusted pages and short research loops.
- If live web research fails, the workspace should fall back to a manual search plan instead of breaking.

## Entry Points

Each issue button becomes a research launch action.

- `See payoff options` -> debt payoff resources, balance transfer pages, counselling options
- `Compare savings options` -> current HISA / cash-account rates and fee pages
- `Build a cash buffer` -> emergency-fund tactics and no-fee cash storage options
- `Review budget changes` -> current low-cost service plans, discounts, support programs
- `Run a housing scenario` -> rent, roommate, transit, and internet cost examples
- `Stress-test this month` -> payment plans, bursaries, and short-term bridge resources
- `Compare alternative plans` -> current cost examples that reset an unrealistic goal timeline

## UX Shape

The research workspace should show:

1. issue title and severity
2. a browser goal
3. a companion agent tab that can stay open beside the main app
4. a search query the user can open in a new tab
5. narrated browser steps
6. current findings or cost signals
7. cited sources
8. recommended next moves

The tone should feel like: "Here is what I am checking, here is why it matters, and here are the pages worth opening."

### Companion-Tab Pattern

To match the stronger browser-agent interaction model, the issue flow should not live only inside the dashboard panel.

- clicking an issue button should prepare the task and open a dedicated companion tab
- the companion tab should show agent state: running, paused, needs input, done
- the user should be able to pause, resume, stop, and answer one focused question there
- the companion tab should open trusted source pages while keeping the task controls visible in its own surface
- the main dashboard should still keep a summary and offer a reopen action

## Technical Slice

### Backend

- Add `POST /issues/research`
- Load the user's baseline profile
- Re-detect the selected issue from `rule_id`
- Use the OpenAI Responses API with the built-in `web_search` tool
- Ask for structured output: query, browser goal, summary, findings, steps, recommendations
- Extract cited URLs from the model response
- Return a manual fallback plan if the OpenAI call fails

### Frontend

- Add a research workspace panel
- Launch it from issue-card buttons
- Open a dedicated companion tab for the browser task
- Show loading, error, and empty states
- Offer `Open search tab` and `Open top source`
- Persist task state so the companion tab can be reopened
- Preserve cited sources in the UI
- Allow the user to move back to the issues panel at any time

## Current Implementation Boundary

This version is intentionally not full browser automation.

- It opens a real tab from the client.
- It uses OpenAI web search to prepare the guided research pack.
- It does not click through websites automatically.
- It does not fill forms, log in, or scrape arbitrary pages.

That keeps the feature demo-safe while still proving the concept.

## Next Step After This Slice

If the team wants the stronger "reality check agent" version later, the next upgrade is a controlled browser worker:

- Playwright or similar for whitelisted navigation
- visible step cards and approval gates
- page highlights for extracted values
- simulator handoff after the user approves the gathered numbers

The main principle should stay the same: guide, cite, and let the user stay in control.
