import http from "http";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PORT = 3456;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};

function run(cmd) {
  try {
    const out = execSync(cmd, { cwd: ROOT, timeout: 120000, encoding: "utf8" });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: e.stdout + "\n" + e.stderr };
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  res.setHeader("Access-Control-Allow-Origin", "*");

  if (url.pathname === "/api/build") {
    const r = run("npm run build 2>&1");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(r));
    return;
  }

  if (url.pathname === "/api/deploy") {
    const date = new Date();
    const msg = `auto deploy ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    const build = run("npm run build 2>&1");
    if (!build.ok) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, step: "build", out: build.out }));
      return;
    }
    const commit = run(`git add -A && git commit -m "${msg}" 2>&1`);
    const push = run("git push origin main 2>&1");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, build: build.out, commit: commit.out, push: push.out }));
    return;
  }

  if (url.pathname === "/api/status") {
    const r = run("git log --oneline -1 2>&1");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, lastCommit: r.out.trim() }));
    return;
  }

  let filePath = join(__dirname, url.pathname === "/" ? "index.html" : url.pathname);
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const data = readFileSync(filePath);
  const ext = extname(filePath);
  res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
  res.end(data);
});

server.listen(PORT, () => {
  console.log(`✅ AcuiCal Deploy Panel listo`);
  console.log(`   http://localhost:${PORT}`);
});
