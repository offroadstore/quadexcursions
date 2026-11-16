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
const whatsappNumber = '390921766518';
const whatsappDisplay = '+39 0921 766518';
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
  $('span').each((_, e) => {
    const span = $(e);
    const digits = span.text().replace(/\D/g, '');
    if (digits.includes('390921766476')) {
      span.empty().append(
        $('<a>').attr({
          href: `https://wa.me/${whatsappNumber}`,
          target: '_blank',
          rel: 'noopener noreferrer',
          style: 'color:inherit;text-decoration:none',
        }).text(whatsappDisplay)
      );
    }
  });
  const desktopHeader = $('.ms-visualbuilder-block-header .ms-deviceonly-general').first();
  if (desktopHeader.length && !desktopHeader.find('a[href="https://wa.me/' + whatsappNumber + '"]').length) {
    const searchBlock = desktopHeader.find('.ms-block-title-with-icon').filter((_, e) =>
      /Trova escursioni|Find excursions|busca excursiones/i.test($(e).text())
    ).first();
    let headerColumn = searchBlock.closest('.ms-col-4, .ms-col-6').first();
    if (!headerColumn.length) headerColumn = desktopHeader.find('.ms-col-4').first();
    if (headerColumn.length) {
      headerColumn.append(
        $('<p class="qe-header-whatsapp">').attr('style', 'margin:2px 0 0;font-size:14px;line-height:1.3').append(
          $('<a>').attr({
            href: `https://wa.me/${whatsappNumber}`,
            target: '_blank',
            rel: 'noopener noreferrer',
            style: 'color:#ecf0f1;text-decoration:none',
          }).text(`WhatsApp: ${whatsappDisplay}`)
        )
      );
    }
  }
  $('p').each((_, e) => {
    const paragraph = $(e);
    if (paragraph.hasClass('migration-booking-link')) return;
    if (!/whatsapp/i.test(paragraph.text())) return;
    paragraph.empty().append(
      $('<span>').attr('style', 'color:#2fcc71').text('WhatsApp'),
      ': ',
      $('<a>').attr({
        href: `https://wa.me/${whatsappNumber}`,
        target: '_blank',
        rel: 'noopener noreferrer',
      }).text(whatsappDisplay)
    );
  });
  $('a[href*="wa.me/"]').each((_, e) => {
    const anchor = $(e);
    const href = anchor.attr('href');
    if (!href) return;
    try {
      const url = new URL(href);
      url.pathname = `/${whatsappNumber}`;
      anchor.attr('href', url.toString());
    } catch {}
  });
  $('iframe').each((_, e) => {
    const iframe = $(e);
    if (iframe.attr('id') === 'regiondo-booking-widget') {
      const labels = {
        it: 'Richiedi informazioni su WhatsApp',
        en: 'Ask for information on WhatsApp',
        fr: 'Demander des informations sur WhatsApp',
        de: 'Informationen per WhatsApp anfragen',
        es: 'Solicitar información por WhatsApp',
      };
      const messages = {
        it: 'Ciao, vorrei informazioni su:',
        en: 'Hello, I would like information about:',
        fr: 'Bonjour, je souhaiterais des informations sur :',
        de: 'Hallo, ich hätte gerne Informationen zu:',
        es: 'Hola, quisiera información sobre:',
      };
      const url = new URL(`https://wa.me/${whatsappNumber}`);
      url.searchParams.set('text', `${messages[page.lang] || messages.it} ${page.title}`);
      iframe.next('.migration-booking-link').remove();
      iframe.replaceWith($('<p class="migration-booking-link">').append(
        $('<a>').attr({ href: url.toString(), target: '_blank', rel: 'noopener noreferrer' })
          .text(labels[page.lang] || labels.it)
      ));
      return;
    }
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
report.remainingDependencies = ['YouTube videos (external embeds)', 'Google Maps (external embeds)'];
const bookingNote = 'Booking calendar embeds were replaced with WhatsApp information links at the site owner’s request.';
report.notes = [...new Set([...report.notes.filter(note => !note.startsWith('Original Regiondo calendars preserved.')), bookingNote])];
await fs.writeFile(path.join(app, 'migration-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ pages: manifest.length, assets: report.assets, assetBytes: report.assetBytes, blockedEmbeds, removedAlternates, failures: report.failures.reduce((a,f)=>(a[f.error]=(a[f.error]||0)+1,a),{}) }, null, 2));
