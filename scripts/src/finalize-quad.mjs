import { load } from 'cheerio';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const app = path.join(root, 'artifacts/quad-excursions');
const research = path.join(root, 'generated-artifacts/quad-source');
const manifest = JSON.parse(await fs.readFile(path.join(app, 'site-pages/manifest.json'), 'utf8'));
const assets = JSON.parse(await fs.readFile(path.join(research, 'asset-map.json'), 'utf8'));
const report = JSON.parse(await fs.readFile(path.join(app, 'migration-report.json'), 'utf8'));
const successfulPaths = new Set(manifest.map(p => p.path));
const origin = 'https://www.quadexcursions.com';
let blockedEmbeds = 0;
let localReferences = 0;
let removedAlternates = 0;
const posters = new Map();
for (const page of manifest) {
  const $ = load(await fs.readFile(path.join(app, 'site-pages', page.file), 'utf8'));
  $('.ms-background-video-foreground iframe').each((_, e) => {
    const value = $(e).attr('src') || $(e).attr('data-src') || '';
    const id = value.match(/youtube\.com\/embed\/([\w-]+)/)?.[1];
    if (id) posters.set(id, `/migrated-assets/youtube-${id}.jpg`);
  });
}
for (const [id, local] of posters) {
  const output = path.join(app, 'public', local);
  try {
    await fs.access(output);
  } catch {
    try {
      const response = await fetch(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await fs.writeFile(output, Buffer.from(await response.arrayBuffer()));
      report.assets++;
      report.assetBytes += (await fs.stat(output)).size;
    } catch (error) {
      posters.delete(id);
      report.failures.push({ kind: 'poster', url: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`, error: String(error) });
    }
  }
}
const localize = (value) => {
  if (!value) return value;
  if (assets[value]?.local) { localReferences++; return assets[value].local; }
  const bare = value.replace(/&amp;/g, '&');
  if (assets[bare]?.local) { localReferences++; return assets[bare].local; }
  return value;
};
for (const page of manifest) {
  const file = path.join(app, 'site-pages', page.file);
  const $ = load(await fs.readFile(file, 'utf8'));
  $('iframe').each((_, e) => {
    const iframe = $(e);
    const src = iframe.attr('src') || iframe.attr('data-src') || iframe.attr('data-url');
    if (src && /youtube|google\.com\/maps|maps\.google|regiondo|vimeo|tripadvisor/i.test(src)) {
      iframe.attr('data-src', src).removeAttr('src');
      blockedEmbeds++;
    }
    const video = src?.match(/youtube\.com\/embed\/([\w-]+)/)?.[1];
    if (video && posters.has(video) && iframe.closest('.ms-background-video-foreground').length) {
      const overlay = iframe.closest('.ms-embed-video');
      overlay.attr('style', `${overlay.attr('style') || ''};background-image:url('${posters.get(video)}');background-size:cover;background-position:center;`);
    }
    if (iframe.attr('id') === 'regiondo-booking-widget') {
      const url = iframe.attr('data-url');
      if (url && !iframe.next('.migration-booking-link').length) {
        iframe.after($('<p class="migration-booking-link">').append(
          $('<a>').attr({ href: url, target: '_blank', rel: 'noopener noreferrer' }).text(
            page.lang === 'it' ? 'Apri il calendario di prenotazione' :
            page.lang === 'fr' ? 'Ouvrir le calendrier des réservations' :
            page.lang === 'de' ? 'Buchungskalender öffnen' :
            page.lang === 'es' ? 'Abrir calendario de reservas' : 'Open booking calendar'
          )
        ));
      }
    }
  });
  $('link[rel=preload][as=image]').each((_, e) => {
    // The source has a separate WebP preload. The normal local full-resolution
    // image is already present, so omit the redundant old-CDN preload.
    const href = $(e).attr('href');
    const localized = localize(href);
    if (localized === href && /fw360/.test(href || '')) $(e).remove();
    else $(e).attr('href', localized);
  });
  $('meta[property="og:image"],meta[name="twitter:image"]').each((_, e) => {
    const localized = localize($(e).attr('content'));
    if (localized?.startsWith('/')) $(e).attr('content', `${origin}${localized}`);
  });
  $('script[type="application/ld+json"]').each((_, e) => {
    try {
      const transform = (value) => {
        if (typeof value === 'string') {
          const localized = localize(value);
          return localized.startsWith('/migrated-assets/') ? `${origin}${localized}` : localized;
        }
        if (Array.isArray(value)) return value.map(transform);
        if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, transform(val)]));
        return value;
      };
      $(e).text(JSON.stringify(transform(JSON.parse($(e).text()))));
    } catch {}
  });
  $('link[rel=alternate][hreflang]').each((_, e) => {
    try {
      const alternate = decodeURI(new URL($(e).attr('href')).pathname);
      if (!successfulPaths.has(alternate)) { $(e).remove(); removedAlternates++; }
    } catch {}
  });
  $('input[type=password]').attr({ disabled: 'disabled', autocomplete: 'off' });
  if (/\/(login|registrazione|recupero-password|checkout|kasse|caja|registration|register|connexion)\//.test(page.path)) {
    $('head').append('<meta name="robots" content="noindex,follow">');
    // A migrated login shell must not collect old credentials, even before JS.
    $('input[type=password]').attr({ disabled: 'disabled', autocomplete: 'off' });
  }
  const html = $.html();
  await fs.writeFile(file, html);
  if (page.path === '/') await fs.writeFile(path.join(app, 'index.html'), html);
}
const csv = [['URL originale', 'Lingua', 'Esito', 'Titolo', 'Destinazione originale']];
for (const page of manifest) csv.push([page.sourceUrl, page.lang, 'Importata', page.title, page.sourceFinalUrl]);
for (const failure of report.failures.filter(f => f.kind === 'page')) csv.push([failure.url, '', failure.error, '', '']);
await fs.mkdir(path.join(root, 'generated-artifacts'), { recursive: true });
await fs.writeFile(path.join(root, 'generated-artifacts/inventario-migrazione-quad.csv'), '\ufeff' + csv.map(row => row.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(';')).join('\r\n'));
const sitemap = load(await fs.readFile(path.join(research, 'sitemap.xml'), 'utf8'), { xmlMode: true });
sitemap('[hreflang]').each((_, e) => {
  try {
    if (!successfulPaths.has(decodeURI(new URL(sitemap(e).attr('href')).pathname))) sitemap(e).remove();
  } catch {}
});
sitemap('url').each((_, e) => {
  const loc = sitemap(e).find('loc').text();
  if (/\/(login|registrazione|recupero-password|ricerca)\//.test(loc)) sitemap(e).remove();
});
await fs.writeFile(path.join(app, 'public/sitemap.xml'), sitemap.xml());
report.serverRenderedPages = manifest.length;
report.externalEmbedsConsentGated = blockedEmbeds;
report.unavailableHreflangReferencesRemoved = (report.unavailableHreflangReferencesRemoved || 0) + removedAlternates;
report.remainingDependencies = ['YouTube videos (external embeds)', 'Google Maps (external embeds)', 'Regiondo booking calendars (external embeds, availability not verified)'];
const bookingNote = 'Original Regiondo calendars preserved. A server request was denied by its anti-bot service; live booking acceptance is not verified.';
report.notes = [...new Set([...report.notes, bookingNote])];
await fs.writeFile(path.join(app, 'migration-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ pages: manifest.length, assets: report.assets, assetBytes: report.assetBytes, blockedEmbeds, removedAlternates, failures: report.failures.reduce((a,f)=>(a[f.error]=(a[f.error]||0)+1,a),{}) }, null, 2));
