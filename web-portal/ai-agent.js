const https = require('https');
const { spawn } = require('child_process');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');

function callOpenAI(apiKey, model, messages) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ model, messages, temperature: 0.2 });
    const req = https.request(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      res => {
        let data = '';
        res.on('data', d => (data += d));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const text = parsed?.choices?.[0]?.message?.content ?? '';
            resolve(text);
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function analyzeRunWithAI(runOutput) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  if (!apiKey) return { enabled: false, summary: null };

  const messages = [
    { role: 'system', content: 'You are an assistant that summarizes Playwright test runs and suggests next debugging steps.' },
    { role: 'user', content: `Analyze the following test run output and provide a concise summary and 3 prioritized next steps:\n\n${runOutput}` },
  ];

  try {
    const summary = await callOpenAI(apiKey, model, messages);
    return { enabled: true, summary };
  } catch (e) {
    return { enabled: true, summary: `AI analysis failed: ${String(e)}` };
  }
}

function runSpecCapture(spec) {
  return new Promise((resolve) => {
    const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['playwright', 'test', spec, '--project=chromium'], { cwd: workspaceRoot });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });
    child.on('close', async (code) => {
      const combined = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
      const ai = await analyzeRunWithAI(combined);
      resolve({ exitCode: code, stdout, stderr, ai });
    });
  });
}

module.exports = { runSpecCapture };
