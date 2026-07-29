# Automation Web Portal

This lightweight portal lists Playwright spec files from the `tests/` folder and lets you run them from a browser or via a simple API. It also exposes a minimal AI-agent endpoint placeholder that triggers the same runner.

Prerequisites
- Node.js (16+ recommended)
- Playwright installed in the project (devDependency). Install browsers with:

```bash
npx playwright install --with-deps
```

Start the portal

1. Install Node dependencies (if you haven't already):

```bash
npm install
```

2. Start the portal server:

```bash
npm run start-portal
```

3. Open your browser at: `http://localhost:3000`

Using the UI
- The homepage will list spec files found under `tests/`.
- Click `Run` next to a spec to execute it. The JSON output (stdout/stderr and exit code) will be displayed.

API
- Run a spec via HTTP POST:

```bash
curl -s -X POST http://localhost:3000/api/run \
  -H 'Content-Type: application/json' \
  -d '{"spec":"tests/booking-happy-path.spec.ts"}' | jq
```

- Minimal AI-agent placeholder (for integration):

```bash
curl -s -X POST http://localhost:3000/api/agent/run \
  -H 'Content-Type: application/json' \
  -d '{"action":"run-test","spec":"tests/booking-happy-path.spec.ts"}' | jq
```

Security & notes
- The portal executes tests on the host running the server; do not expose it on public networks.
- Commands are run with the project working directory; ensure tests and fixtures are safe to run locally.
- The portal currently returns the full stdout/stderr after the run; for long-running suites consider streaming or polling instead.

Next improvements
- Stream real-time logs to the UI instead of waiting for process exit.
- Add authentication + role-based access to prevent unauthorized runs.
- Integrate a real AI agent (MCP/workflow) to dispatch tests and analyze traces.

Streaming logs
- Use the `Stream` button in the UI to open a live view that shows stdout/stderr from the running Playwright process.
- Or open a Server-Sent Events connection directly:

```bash
curl -N http://localhost:3000/api/stream?spec=tests/booking-happy-path.spec.ts
```

The stream will send log lines as SSE `message` events and a final `done` event with the process exit code.

AI agent integration
- If you provide an OpenAI API key in `OPENAI_API_KEY`, the portal will attempt to summarize test runs and return a short analysis. Set optionally:

```bash
export OPENAI_API_KEY=sk_...          # on Windows use setx or PowerShell $env:
export OPENAI_MODEL=gpt-4o-mini       # optional
```

- Use the agent-run endpoint to execute a spec with AI analysis:

```bash
curl -s -X POST http://localhost:3000/api/agent/run \
  -H 'Content-Type: application/json' \
  -d '{"action":"run-test","spec":"tests/booking-happy-path.spec.ts"}' | jq
```

The response includes `result.ai.summary` when AI analysis is available.
