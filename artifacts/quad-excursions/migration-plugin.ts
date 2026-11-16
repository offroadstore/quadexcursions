import fs from 'node:fs/promises';
import path from 'node:path';
import type { Plugin } from 'vite';

interface MigratedPage {
  path: string;
  file: string;
  title: string;
  canonical: string;
  sourceFinalUrl: string;
}

/**
 * Original documents are served before Vite's SPA fallback. This retains both
 * the public URL and the crawlable HTML/metadata of every migrated page.
 */
export function migrationPlugin(): Plugin {
  const root = import.meta.dirname;
  let pages: MigratedPage[] = [];
  let manifestMtime = 0;
  const byPath = new Map<string, MigratedPage>();
  const notFound = `<!doctype html><html lang="it"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex"><title>Pagina non trovata | Quad Excursions</title>
    <style>body{font-family:Arial,sans-serif;margin:0;background:#181818;color:#fff;display:grid;place-items:center;min-height:100vh}main{padding:40px;max-width:600px}h1{font-size:42px}a{color:#fff;background:#e10a0a;padding:14px 24px;text-decoration:none;display:inline-block}</style>
    </head><body><main><p>QUAD EXCURSIONS CEFALÙ</p><h1>Pagina non trovata</h1>
    <p>La pagina richiesta non è disponibile.</p><a href="/">Torna alla homepage</a></main></body></html>`;
  const isPageRequest = (requestPath: string) =>
    !path.extname(requestPath) || requestPath.endsWith('.html');
  const loadManifest = async () => {
    const manifestPath = path.join(root, 'site-pages/manifest.json');
    const stat = await fs.stat(manifestPath);
    if (stat.mtimeMs === manifestMtime) return;
    pages = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    manifestMtime = stat.mtimeMs;
    byPath.clear();
    for (const page of pages) byPath.set(page.path, page);
  };
  const lookup = (pathname: string) => {
    if (byPath.has(pathname)) {
      const page = byPath.get(pathname)!;
      const finalPath = decodeURI(new URL(page.sourceFinalUrl).pathname);
      if (finalPath !== pathname && byPath.has(finalPath)) {
        return { page: byPath.get(finalPath)!, redirect: true };
      }
      return { page, redirect: false };
    }
    if (!pathname.endsWith('/') && byPath.has(`${pathname}/`)) {
      return { page: byPath.get(`${pathname}/`)!, redirect: true };
    }
    return undefined;
  };
  return {
    name: 'quad-original-documents',
    enforce: 'pre',
    async configResolved() {
      await loadManifest();
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        let url: URL;
        let pathname: string;
        try {
          url = new URL(req.url || '/', 'http://localhost');
          pathname = decodeURI(url.pathname);
        } catch { next(); return; }
        if (/^\/(@|src\/|node_modules\/|migrated-assets\/|__)/.test(pathname) || !isPageRequest(pathname)) {
          next(); return;
        }
        await loadManifest();
        const found = lookup(pathname);
        if (!found) {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' });
          res.end(notFound);
          return;
        }
        if (found.redirect) {
          res.writeHead(301, { Location: found.page.path + url.search });
          res.end();
          return;
        }
        try {
          const source = await fs.readFile(path.join(root, 'site-pages', found.page.file), 'utf8');
          const html = await server.transformIndexHtml(pathname, source);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
          res.end(html);
        } catch (error) { next(error as Error); }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        let url: URL;
        let pathname: string;
        try {
          url = new URL(req.url || '/', 'http://localhost');
          pathname = decodeURI(url.pathname);
        } catch { next(); return; }
        if (!isPageRequest(pathname)) { next(); return; }
        const found = lookup(pathname);
        if (!found) {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(notFound);
          return;
        }
        if (found.redirect) {
          res.writeHead(301, { Location: found.page.path + url.search });
          res.end();
          return;
        }
        next();
      });
    },
    async closeBundle() {
      const output = path.join(root, 'dist/public');
      const index = await fs.readFile(path.join(output, 'index.html'), 'utf8').catch(() => '');
      if (!index) return;
      // Vite compiles the shared React entry once; all original documents use
      // that same fingerprinted runtime, while keeping their individual heads.
      const runtimeTags = index.match(/<script\b[^>]*type="module"[^>]*>[\s\S]*?<\/script>/g) || [];
      const runtimeStyles = (index.match(/<link\b[^>]*rel="stylesheet"[^>]*>/g) || [])
        .filter(tag => /\/assets\//.test(tag));
      for (const page of pages) {
        if (page.path === '/') continue;
        const original = await fs.readFile(path.join(root, 'site-pages', page.file), 'utf8');
        const html = original
          .replace(/<script type="module" src="\/src\/main\.tsx"><\/script>/, runtimeTags.join(''))
          .replace('</head>', `${runtimeStyles.join('')}</head>`);
        const relative = page.path.replace(/^\/+/, '').replace(/\/+$/, '');
        const destination = path.join(output, relative, 'index.html');
        if (!destination.startsWith(`${output}/`)) throw new Error('Invalid migrated output path');
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.writeFile(destination, html);
      }
      await fs.writeFile(path.join(output, '404.html'), notFound);
    },
  };
}
