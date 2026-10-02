import http from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { resolve, relative, isAbsolute, extname } from "node:path";
import { fileURLToPath } from "node:url";
const root = await realpath(fileURLToPath(new URL("../public/", import.meta.url)));
const inside = (path) => {
  const rel = relative(root, path);
  return rel !== ".." && !rel.startsWith("..\\") && !rel.startsWith("../") && !isAbsolute(rel);
};
http
  .createServer(async (req, res) => {
    try {
      if (!["GET", "HEAD"].includes(req.method)) {
        res.writeHead(405, { Allow: "GET, HEAD" });
        return res.end();
      }
      const name = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      if (name.includes("\0")) {
        res.writeHead(400);
        return res.end();
      }
      const path = resolve(root, "." + (name === "/" ? "/index.html" : name));
      if (!inside(path)) {
        res.writeHead(403);
        return res.end();
      }
      const actual = await realpath(path);
      if (!inside(actual)) {
        res.writeHead(403);
        return res.end();
      }
      const data = await readFile(actual);
      res.writeHead(200, {
        "Content-Type":
          {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".svg": "image/svg+xml",
          }[extname(actual)] || "application/octet-stream",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(req.method === "HEAD" ? undefined : data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(8080, "127.0.0.1", () => console.log("Nexus GymB: http://localhost:8080"));
