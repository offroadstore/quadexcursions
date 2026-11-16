import { load } from 'cheerio';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

const ROOT = path.resolve(import.meta.dirname, '../..');
const DEST = path.join(ROOT, 'artifacts/quad-excursions');
const RESEARCH = path.join(ROOT, 'generated-artifacts/quad-source');
const ORIGIN = 'https://www.quadexcursions.com';
const assetMap = new Map();
const failures = [];
const pages = new Map();
const seen = new Set();
const cache = new Map();
let priorManifest = [];
let priorAssets = {};
try { priorManifest = JSON.parse(await fs.readFile(path.join(DEST, 'site-pages/manifest.json'), 'utf8')); } catch {}
try { priorAssets = JSON.parse(await fs.readFile(path.join(RESEARCH, 'asset-map.json'), 'utf8')); } catch {}
let nextPageRequest = Date.now();
const mediaDir = path.join(DEST, 'public/migrated-assets');
await fs.mkdir(RESEARCH, { recursive: true });
await fs.mkdir(mediaDir, { recursive: true });
await fs.mkdir(path.join(DEST, 'site-pages'), { recursive: true });

async function fetchBytes(url) {
  const isPage = isSite(url) && !path.extname(new URL(url).pathname);
  if (isPage) {
    const route = routeOf(url);
    const cachedFile = path.join(RESEARCH, crypto.createHash('sha1').update(route).digest('hex') + '.html');
    try {
      const bytes = await fs.readFile(cachedFile);
      return { bytes, type: 'text/html', finalUrl: priorManifest.find(p => p.path === route)?.sourceFinalUrl || url, status: 200 };
    } catch {}
    const wait = Math.max(0, nextPageRequest - Date.now());
    nextPageRequest = Math.max(Date.now(), nextPageRequest) + 900;
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    // Separate curl connections avoid the origin's per-connection throttling.
    const { stdout } = await run('curl', [
      '--silent', '--show-error', '--location', '--max-time', '45',
      '--user-agent', 'Mozilla/5.0 (compatible; QuadExcursionsOwnerMigration/1.0)',
      '--write-out', '\n%{http_code}\n%{content_type}\n%{url_effective}',
      url,
    ], { maxBuffer: 8 * 1024 * 1024 });
    const parts = stdout.split('\n');
    const finalUrl = parts.pop();
    const type = parts.pop();
    const status = Number(parts.pop());
    if (status >= 400) throw new Error(`HTTP ${status}`);
    return { bytes: Buffer.from(parts.join('\n')), type, finalUrl, status };
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; QuadExcursionsOwnerMigration/1.0)' },
        signal: AbortSignal.timeout(45000),
      });
      if (response.status === 429 && attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 12000));
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { bytes: Buffer.from(await response.arrayBuffer()), type: response.headers.get('content-type') || '', finalUrl: response.url, status: response.status };
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 700 * (attempt + 1)));
    }
  }
}
function absolute(value, base = ORIGIN) {
  try { return new URL(value, base).href; } catch { return ''; }
}
function isSite(url) {
  try { return /^(www\.)?quadexcursions\.com$/.test(new URL(url).hostname); } catch { return false; }
}
function routeOf(url) {
  const u = new URL(url, ORIGIN);
  return decodeURI(u.pathname);
}
function enqueue(url) {
  if (!isSite(url)) return;
  const u = new URL(url);
  if (u.search || /\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|js|css|xml|txt|php|woff2?|ico)$/i.test(u.pathname)) return;
  if (/^\/(m|fw360-security|sms|assets|uploads)\//.test(u.pathname)) return;
  const route = routeOf(u.href);
  if (!seen.has(route)) { seen.add(route); queue.push(new URL(route, ORIGIN).href); }
}
async function pool(list, concurrency, worker) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, list.length) }, async () => {
    while (cursor < list.length) await worker(list[cursor++]);
  }));
}
const sitemap = (await fetchBytes(`${ORIGIN}/sitemap.xml`)).bytes.toString();
await fs.writeFile(path.join(RESEARCH, 'sitemap.xml'), sitemap);
const sx = load(sitemap, { xmlMode: true });
const queue = [];
sx('loc').each((_, e) => enqueue(sx(e).text()));
sx('[hreflang]').each((_, e) => enqueue(sx(e).attr('href')));
for (const p of ['/privacy-policy/', '/cookie-policy/', '/checkout/']) enqueue(`${ORIGIN}${p}`);
let batchIndex = 0;
while (queue.length && pages.size < 500) {
  const batch = queue.splice(0, 6);
  await pool(batch, 6, async url => {
    try {
      const res = await fetchBytes(url);
      const html = res.bytes.toString();
      if (!res.type.includes('html')) return;
      const route = routeOf(url);
      const $ = load(html);
      const record = { path: route, sourceUrl: url, finalUrl: res.finalUrl, title: $('title').text(), lang: $('html').attr('lang') || 'it', html, $ };
      pages.set(route, record);
      $('a[href],link[hreflang]').each((_, e) => enqueue(absolute($(e).attr('href'), url)));
      $('select.ms-language-selector option[value]').each((_, e) => enqueue(absolute($(e).attr('value'), url)));
      const name = crypto.createHash('sha1').update(route).digest('hex');
      await fs.writeFile(path.join(RESEARCH, `${name}.html`), html);
      if (route === '/') await fs.writeFile(path.join(RESEARCH, 'raw.html'), html);
    } catch (error) { failures.push({ kind: 'page', url, error: String(error) }); }
  });
  console.log(`Pages ${pages.size}, remaining ${queue.length}, batch ${++batchIndex}`);
}
console.log(`Collected ${pages.size} pages. Discovering assets.`);

function normalizeAsset(url) {
  const u = new URL(url);
  u.hash = '';
  if (/fw360\.it|framework360\.com/.test(u.hostname) && u.pathname !== '/plugins/private/frontendParser/bundle.php') {
    for (const key of [...u.searchParams.keys()]) {
      if (['v', 'fw', 'width', 'height', 'format', 'quality'].includes(key) || /^\d+$/.test(key)) u.searchParams.delete(key);
    }
  }
  return u.href;
}
function wantsAsset(url) {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return false;
    return /uploads3\.fw360\.it|assets\.framework360\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|img\.youtube\.com/.test(u.hostname) ||
      /\.(png|jpe?g|svg|gif|webp|ico|woff2?|ttf|pdf)(\?|$)/i.test(u.href);
  } catch { return false; }
}
function remember(value, base) {
  const url = absolute(value, base);
  if (wantsAsset(url)) assetMap.set(url, null);
}
function cssUrls(css, base) {
  for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    if (!match[1].startsWith('data:')) remember(match[1], base);
  }
}
for (const record of pages.values()) {
  const { $ } = record;
  $('script:not([src])').each((_, e) => {
    const code = $(e).text();
    for (const match of code.matchAll(/animateValue\(\$\(['"]#([^'"]+)['"]\),\s*0,\s*([\d.]+)/g)) {
      $(`[id="${match[1]}"]`).attr('data-counter-target', match[2]).text(match[2]);
    }
  });
  $('.ms-expired-banner,#fw360-pagebar').remove();
  $('style').each((_, e) => {
    if ($(e).text().includes('.ms-expired-banner')) $(e).remove();
  });
  // Platform runtime and public frontend tokens are not carried into the new site.
  $('script:not([type="application/ld+json"])').remove();
  $('[onclick]').each((_, e) => {
    const code = $(e).attr('onclick');
    $(e).attr('data-original-action', code.replace(/https?:\/\/[^"'\s]+/g, '')).removeAttr('onclick');
  });
  $('*').each((_, e) => {
    for (const key of Object.keys(e.attribs || {})) {
      if (/^on/i.test(key)) $(e).removeAttr(key);
    }
  });
  $('a[href*="myframework360.com"],link[rel=preconnect],link[rel=dns-prefetch],link[type="application/rss+xml"]').remove();
  $('img').each((_, e) => {
    const img = $(e);
    const src = img.attr('data-src') || img.attr('data-waitsrc') || img.attr('src');
    if (src) img.attr('src', src);
  });
  // One original full-resolution image per picture, not duplicate resized CDN copies.
  $('picture source').remove();
  $('source[data-src]').each((_, e) => $(e).attr('src', $(e).attr('data-src')));
  $('[data-bg],[data-background],[data-waitbackground]').each((_, e) => {
    const src = $(e).attr('data-bg') || $(e).attr('data-background') || $(e).attr('data-waitbackground');
    if (src) $(e).attr('style', `${$(e).attr('style') || ''};background-image:url("${src}")`);
  });
  $('img,link[rel=stylesheet],link[rel*=icon],a[href]').each((_, e) => {
    const el = $(e);
    const value = el.attr(e.tagName === 'img' ? 'src' : 'href');
    if (value) remember(value, record.sourceUrl);
  });
  $('style,[style]').each((_, e) => cssUrls($(e).attr('style') || $(e).text(), record.sourceUrl));
}
let downloaded = 0;
let downloadRound = 0;
while ([...assetMap.values()].some(v => v === null) && downloadRound++ < 5) {
  const pending = [...assetMap].filter(([, v]) => v === null).map(([u]) => u);
  await pool(pending, 8, async url => {
    try {
      const normalized = normalizeAsset(url);
      if (!cache.has(normalized)) {
        cache.set(normalized, (async () => {
          const prior = priorAssets[url] || Object.values(priorAssets).find(a => a.source === normalized && a.local);
          if (prior?.local && !prior.local.endsWith('.css')) {
            try {
              await fs.access(path.join(DEST, 'public', prior.local));
              downloaded++;
              return prior;
            } catch {}
          }
          const res = await fetchBytes(normalized);
          const mimeExt = { 'text/css': '.css', 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/svg+xml': '.svg', 'font/woff2': '.woff2', 'font/woff': '.woff', 'application/pdf': '.pdf' };
          const ext = mimeExt[res.type.split(';')[0]] || path.extname(new URL(normalized).pathname) || '.bin';
          const filename = crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 20) + ext;
          if (res.type.includes('text/html')) throw new Error('Asset returned HTML');
          if (res.bytes.length > 10 * 1024 * 1024) throw new Error('Large asset requires App Storage; not stored in Git');
          const local = `/migrated-assets/${filename}`;
          await fs.writeFile(path.join(mediaDir, filename), res.bytes);
          if (ext === '.css') cssUrls(res.bytes.toString(), normalized);
          downloaded++;
          return { local, bytes: res.bytes.length, type: res.type, source: normalized };
        })());
      }
      assetMap.set(url, await cache.get(normalized));
    } catch (error) {
      assetMap.set(url, { error: String(error) });
      failures.push({ kind: 'asset', url, error: String(error) });
    }
  });
  console.log(`Assets: ${downloaded} downloaded, round ${downloadRound}`);
}
function replaceAsset(value, base) {
  const url = absolute(value, base);
  const rec = assetMap.get(url);
  return rec?.local || value;
}
function rewriteCSS(css, base) {
  return css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/g, (all, quote, url) => {
    if (url.startsWith('data:')) return all;
    return `url("${replaceAsset(url.trim(), base)}")`;
  });
}
for (const [source, promise] of cache) {
  try {
    const entry = await promise;
    if (entry.local.endsWith('.css')) {
      const file = path.join(DEST, 'public', entry.local);
      await fs.writeFile(file, rewriteCSS(await fs.readFile(file, 'utf8'), source));
    }
  } catch {}
}
const manifest = [];
const search = [];
const inventory = [];
for (const record of pages.values()) {
  const { $, path: route } = record;
  $('a[href]').each((_, e) => {
    const href = $(e).attr('href');
    const url = absolute(href, record.sourceUrl);
    if (isSite(url)) {
      const u = new URL(url);
      $(e).attr('href', `${u.pathname}${u.search}${u.hash}`);
    } else if (wantsAsset(url)) $(e).attr('href', replaceAsset(url, record.sourceUrl));
  });
  $('option[value]').each((_, e) => {
    const url = absolute($(e).attr('value'), record.sourceUrl);
    if (isSite(url)) $(e).attr('value', new URL(url).pathname);
  });
  $('img,source,link[rel=stylesheet],link[rel*=icon]').each((_, e) => {
    const key = ['img', 'source'].includes(e.tagName) ? 'src' : 'href';
    const value = $(e).attr(key);
    if (value) $(e).attr(key, replaceAsset(value, record.sourceUrl));
    for (const attr of ['srcset','data-src','data-srcset','data-waitsrc','data-waitsrcset']) $(e).removeAttr(attr);
  });
  $('style').each((_, e) => $(e).text(rewriteCSS($(e).text(), record.sourceUrl)));
  $('[style]').each((_, e) => $(e).attr('style', rewriteCSS($(e).attr('style'), record.sourceUrl)));
  $('[data-background],[data-bg],[data-waitbackground],[data-src]').each((_, e) => {
    for (const attr of ['data-background', 'data-bg', 'data-waitbackground', 'data-src']) {
      const value = $(e).attr(attr);
      if (value && wantsAsset(absolute(value, record.sourceUrl))) $(e).attr(attr, replaceAsset(value, record.sourceUrl));
    }
  });
  $('form').each((_, e) => {
    const form = $(e);
    form.attr('data-migrated-form', 'true').removeAttr('action').removeAttr('method');
    form.find('input[type=hidden]').remove();
  });
  $('meta[name^=Fw360],meta[http-equiv]').remove();
  const bodyContent = $('.ms-page-content').first();
  const description = $('meta[name=description]').attr('content') || bodyContent.find('p').map((_, e) => $(e).text().trim()).get().find(t => t.length >= 50)?.slice(0, 160) || `${record.title} — Quad Excursions Cefalù.`;
  if (!$('meta[name=description]').length) $('head').append($('<meta>').attr({ name: 'description', content: description }));
  for (const key of ['og:description', 'twitter:description']) {
    if (!$(`meta[property="${key}"],meta[name="${key}"]`).length) $('head').append($('<meta>').attr({ property: key, content: description }));
  }
  if (!$('meta[property="og:image"]').length) {
    const image = $('img[src*="migrated-assets"]').first().attr('src');
    if (image) $('head').append($('<meta>').attr({ property: 'og:image', content: `${ORIGIN}${image}` }));
  }
  const title = record.title || 'Quad Excursions';
  const file = crypto.createHash('sha1').update(route).digest('hex') + '.html';
  const text = bodyContent.text().replace(/\s+/g, ' ').trim();
  $('body').append('<div id="migration-root"></div><script type="module" src="/src/main.tsx"></script>');
  const html = $.html();
  await fs.writeFile(path.join(DEST, 'site-pages', file), html);
  if (route === '/') {
    await fs.writeFile(path.join(DEST, 'index.html'), html);
    $('body > .ms-page-content').children().each((i, e) => inventory.push({ index: i, tag: e.tagName, class: $(e).attr('class'), headings: $(e).find('h1,h2,h3').map((_, h) => $(h).text()).get(), images: $(e).find('img').length }));
    await fs.writeFile(path.join(RESEARCH, 'clean-home.html'), html);
  }
  manifest.push({ path: route, file, title, lang: record.lang, canonical: $('link[rel=canonical]').attr('href') || new URL(route, ORIGIN).href, sourceUrl: record.sourceUrl, sourceFinalUrl: record.finalUrl });
  if (!/\/(login|registrazione|recupero-password|checkout|ricerca)\/$/.test(route)) search.push({ path: route, title, lang: record.lang, excerpt: text.slice(0, 350) });
}
await fs.writeFile(path.join(DEST, 'site-pages/manifest.json'), JSON.stringify(manifest, null, 2));
await fs.writeFile(path.join(DEST, 'public/search-index.json'), JSON.stringify(search));
await fs.writeFile(path.join(RESEARCH, 'inventory.json'), JSON.stringify(inventory, null, 2));
await fs.writeFile(path.join(DEST, 'public/sitemap.xml'), sitemap);
await fs.writeFile(path.join(DEST, 'public/robots.txt'), `User-agent: *\nAllow: /\nDisallow: /checkout/\nDisallow: /login/\nDisallow: /registrazione/\nDisallow: /recupero-password/\nSitemap: ${ORIGIN}/sitemap.xml\n`);
const uniqueAssets = [...new Map([...assetMap.values()].filter(v => v?.local).map(v => [v.local, v])).values()];
const report = {
  created: new Date().toISOString(), source: ORIGIN,
  pages: manifest.length, languages: [...new Set(manifest.map(p => p.lang))],
  assets: uniqueAssets.length, assetBytes: uniqueAssets.reduce((n, a) => n + a.bytes, 0),
  failures, remainingQueue: queue, privateDataImported: false,
  notes: ['Public HTML, original CSS and images imported. Framework360 runtime and expiry message excluded.',
    'Private customers, accounts, orders, bookings and marketing lists require owner export.',
    'Checkout, authentication, availability and form delivery must be connected before production.'],
};
await fs.writeFile(path.join(RESEARCH, 'asset-map.json'), JSON.stringify(Object.fromEntries(assetMap), null, 2));
await fs.writeFile(path.join(DEST, 'migration-report.json'), JSON.stringify(report, null, 2));
await fs.writeFile(path.join(RESEARCH, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
