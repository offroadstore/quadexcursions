import fs from "node:fs/promises";
import path from "node:path";
import type { Plugin, ViteDevServer, PreviewServer } from "vite";

interface Page {
  path: string;
  file: string;
  title: string;
  lang: string;
  canonical: string;
  sourceFinalUrl: string;
}

/** Render real imported HTML, not an iframe or an HTML-fetching SPA. */
export function documentsPlugin(): Plugin {
  const root = import.meta.dirname;
  let base = "/";
  let pages: Page[] = [];
  const manifest = new Map<string, Page>();
  const localUrl = (value: string) => {
    if (!value.startsWith("/") || value.startsWith("//") || value.startsWith(base)) return value;
    return `${base}${value.slice(1)}`;
  };
  const localPath = (pathname: string) => {
    if (pathname === base.slice(0, -1)) return "/";
    return pathname.startsWith(base) ? `/${pathname.slice(base.length)}` : null;
  };
  const find = (pathname: string) => manifest.get(pathname) || manifest.get(`${pathname}/`);
  const prepare = (html: string, viteTransformsAssets = false) => html
    .replace(/<meta\b[^>]*name=["']robots["'][^>]*>/gi, "")
    .replace("</head>", '<meta name="robots" content="noindex, follow"></head>')
    .replace(/<(?:a|link|img|script|source|video|iframe|form|option|input|div)\b[^>]*>/gi, (tag) => {
      // Vite resolves source entry points against project root, and adds base itself.
      if (/^<script\b/i.test(tag) && /\bsrc=["']\/src\//i.test(tag)) return tag;
      if (/^<link\b/i.test(tag) && /\brel=["'](?:canonical|alternate)["']/i.test(tag)) return tag;
      return tag.replace(
        /(\b(?:href|src|action|poster|data-src|data-bg|data-search-page|value)\s*=\s*)(["'])(.*?)\2/gi,
        (whole, prefix: string, quote: string, value: string) => {
          const isLocalAttribute = !/\bvalue\s*=/i.test(prefix) || /^<option\b/i.test(tag);
          if (!isLocalAttribute) return whole;
          // Vite adds base to recognized public-asset attributes itself.
          if (viteTransformsAssets && /^(?:href|src|poster)\s*=/i.test(prefix.trim()) && value.startsWith("/migrated-assets/")) return whole;
          if (/^<a\b/i.test(tag) && /^https?:\/\/(?:www\.)?quadexcursions\.com(?:\/|$)/i.test(value)) {
            const url = new URL(value);
            value = `${url.pathname}${url.search}${url.hash}`;
          }
          return `${prefix}${quote}${localUrl(value)}${quote}`;
        },
      );
    })
    .replace(/url\((["']?)\/migrated-assets\//g, `url($1${base}migrated-assets/`);
  const notFound = () => `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Pagina non trovata | Quad Excursions</title><style>body{font:18px/1.6 system-ui;margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f6f1;color:#203537}main{max-width:600px;padding:32px}a{color:#b92d24}</style></head><body><main><h1>Pagina non trovata</h1><p>Il percorso richiesto non è disponibile.</p><a href="${base}">Torna alla homepage</a></main></body></html>`;
  const attach = (server: ViteDevServer | PreviewServer, development: boolean) => {
    server.middlewares.use(async (req, res, next) => {
      let request: URL;
      let pathname: string | null;
      try {
        request = new URL(req.url || "/", "http://localhost");
        pathname = localPath(decodeURI(request.pathname));
      } catch { next(); return; }
      if (pathname === null) { next(); return; }
      if (pathname === "/" && !request.pathname.endsWith("/")) {
        res.writeHead(301, { Location: `${base}${request.search}` }); res.end(); return;
      }
      if (/^\/(?:@|src\/|node_modules\/|migrated-assets\/|assets\/|__)/.test(pathname)) {
        next(); return;
      }
      if (path.extname(pathname) && !pathname.endsWith(".html")) { next(); return; }
      const page = find(pathname);
      if (!page) {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" });
        res.end(notFound()); return;
      }
      const finalPath = decodeURI(new URL(page.sourceFinalUrl).pathname);
      const target = manifest.get(finalPath) || page;
      if (target.path !== pathname) {
        res.writeHead(301, { Location: `${base}${target.path.slice(1)}${request.search}` });
        res.end(); return;
      }
      try {
        let html = development
          ? prepare(await fs.readFile(path.join(root, "site-pages", page.file), "utf8"), true)
          : await fs.readFile(path.join(root, "dist/public", page.path.slice(1), "index.html"), "utf8");
        if (development) html = await (server as ViteDevServer).transformIndexHtml(request.pathname, html);
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
        res.end(html);
      } catch (error) { next(error as Error); }
    });
  };
  return {
    name: "quad-independent-documents",
    enforce: "pre",
    async configResolved(config) {
      base = `${config.base.replace(/\/+$/, "")}/`;
      pages = JSON.parse(await fs.readFile(path.join(root, "site-pages/manifest.json"), "utf8"));
      pages.forEach(page => manifest.set(page.path, page));
    },
    transformIndexHtml: {
      order: "pre",
      async handler(html, context) {
        // The scaffold's root document is replaced with the actual migrated home.
        if (context.filename === path.join(root, "index.html") && !html.includes('id="migration-root"')) {
          const home = manifest.get("/")!;
          return prepare(await fs.readFile(path.join(root, "site-pages", home.file), "utf8"), true);
        }
        return html;
      },
    },
    configureServer(server) { attach(server, true); },
    configurePreviewServer(server) { attach(server, false); },
    async closeBundle() {
      const output = path.join(root, "dist/public");
      const home = await fs.readFile(path.join(output, "index.html"), "utf8");
      const scripts = home.match(/<script\b[^>]*type="module"[^>]*>[\s\S]*?<\/script>/g) || [];
      const styles = (home.match(/<link\b[^>]*rel="stylesheet"[^>]*>/g) || []).filter(tag => /\/assets\//.test(tag));
      for (const page of pages) {
        if (page.path === "/") continue;
        const source = prepare(await fs.readFile(path.join(root, "site-pages", page.file), "utf8"));
        const html = source
          .replace(/<script type="module" src="[^"]*\/src\/main\.tsx"><\/script>/, scripts.join(""))
          .replace("</head>", `${styles.join("")}</head>`);
        const relative = page.path.replace(/^\/+|\/+$/g, "");
        const destination = path.join(output, relative, "index.html");
        if (!destination.startsWith(`${output}/`)) throw new Error("Invalid output path");
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.writeFile(destination, html);
      }
      await fs.writeFile(path.join(output, "404.html"), notFound());
      await fs.writeFile(path.join(output, "robots.txt"), `User-agent: *\nDisallow: ${base}\n`);
    },
  };
}
