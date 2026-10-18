import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";

const distDir = resolve(new URL("../dist", import.meta.url).pathname);
const PORT = 4501;
const MIME = { ".html": "text/html", ".js": "text/javascript" };

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://127.0.0.1");
  const path = pathname === "/" ? "/index.html" : pathname;
  const filePath = join(distDir, path);
  try {
    await stat(filePath);
  } catch {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "content-type": MIME[extname(filePath)] ?? "application/octet-stream" });
  createReadStream(filePath).pipe(res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[chrome83-floor] serving ${distDir} on http://127.0.0.1:${PORT}`);
});
