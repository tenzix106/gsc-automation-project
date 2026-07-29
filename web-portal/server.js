const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');

const PORT = process.env.PORT || 3000;
const workspaceRoot = path.resolve(__dirname, '..');
const testsDir = path.join(workspaceRoot, 'tests');

function listTests() {
  try {
    const files = fs.readdirSync(testsDir);
    return files.filter(f => f.endsWith('.spec.ts') || f.endsWith('.spec.js'));
  } catch (e) {
    return [];
  }
}

function sendJson(res, obj, status = 200) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function serveStatic(res, urlPath) {
  const filePath = path.join(__dirname, 'static', urlPath === '/' ? 'index.html' : urlPath);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const map = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': map[ext] || 'application/octet-stream' });
  res.end(content);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname.startsWith('/static/'))) {
    const p = url.pathname === '/' ? '/' : url.pathname.replace('/static/', '');
    serveStatic(res, p);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/tests') {
    return sendJson(res, { tests: listTests() });
  }

  // Server-Sent Events endpoint for streaming live test logs.
  if (req.method === 'GET' && url.pathname === '/api/stream') {
    const spec = url.searchParams.get('spec');
    if (!spec) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('spec query param required');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('\n');

    const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['playwright', 'test', spec, '--project=chromium'], {
      cwd: workspaceRoot,
    });

    child.stdout.on('data', chunk => {
      const text = chunk.toString();
      text.split(/\r?\n/).forEach(line => {
        if (line.length === 0) return;
        res.write(`data: ${line.replace(/\u0000/g, '')}\n\n`);
      });
    });

    child.stderr.on('data', chunk => {
      const text = chunk.toString();
      text.split(/\r?\n/).forEach(line => {
        if (line.length === 0) return;
        res.write(`data: [ERR] ${line.replace(/\u0000/g, '')}\n\n`);
      });
    });

    child.on('close', code => {
      res.write(`event: done\ndata: ${code}\n\n`);
      res.end();
    });

    // If client disconnects, kill the child process
    req.on('close', () => {
      if (!child.killed) child.kill();
    });

    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/run') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const { spec } = JSON.parse(body || '{}');
        if (!spec) return sendJson(res, { error: 'spec required' }, 400);
        // Run Playwright test for the selected spec
        const cmd = `npx playwright test ${spec} --project=chromium`;
        exec(cmd, { cwd: workspaceRoot, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
          sendJson(res, {
            spec,
            exitCode: err ? err.code || 1 : 0,
            stdout,
            stderr,
          });
        });
      } catch (e) {
        sendJson(res, { error: String(e) }, 500);
      }
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/agent/run') {
    // Minimal AI agent placeholder: accepts { action, spec } and routes
    // to the same runner. Real AI integration can call this endpoint.
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        const { action, spec } = JSON.parse(body || '{}');
        if (action === 'run-test' && spec) {
          // Use the AI helper to run and optionally analyze
          const { runSpecCapture } = require('./ai-agent');
          const result = await runSpecCapture(spec);
          return sendJson(res, { action, spec, result });
        }
        sendJson(res, { error: 'unknown action or missing spec' }, 400);
      } catch (e) {
        sendJson(res, { error: String(e) }, 500);
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Web portal running on http://localhost:${PORT}`);
});
