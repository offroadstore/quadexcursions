import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const pages = JSON.parse(await fs.readFile(path.join(root, "site-pages/manifest.json"), "utf8"));
const output = path.join(root, "dist/public");
const base = process.env.BASE_PATH || "/quad-excursions-design/";
const errors = [];
for (const page of pages) {
  const filename = path.join(output, page.path.replace(/^\/+|\/+$/g, ""), "index.html");
  const html = await fs.readFile(filename, "utf8");
  assert(html.includes("<title>"), `Missing title: ${page.path}`);
  assert(html.includes('content="noindex, follow"'), `Missing staging noindex: ${page.path}`);
  assert(!html.includes("/__mockup/"), `Sandbox dependency: ${page.path}`);
  assert(!html.includes("/src/main.tsx"), `Unbuilt entry point: ${page.path}`);
  assert(!html.includes(`${base}${base.slice(1)}`), `Duplicated prefix: ${page.path}`);
  const script = html.match(/<script[^>]*type="module"[^>]*src="([^"]+)"/);
  assert(script, `Missing application script: ${page.path}`);
  for (const match of html.matchAll(/\b(?:src|href|poster)=["'](\/[^"']+)["']/g)) {
    const url = match[1];
    if (!url.includes("/migrated-assets/") && !url.includes("/assets/")) continue;
    if (!url.startsWith(base)) errors.push(`${page.path}: asset escapes prefix: ${url}`);
    const file = path.join(output, url.slice(base.length).split(/[?#]/)[0]);
    try { await fs.access(file); } catch { errors.push(`${page.path}: missing asset: ${url}`); }
  }
}
assert.equal(errors.length, 0, errors.join("\n"));
console.log(`Verified ${pages.length} prerendered routes, runtime entry points, indexing protection and referenced media.`);
