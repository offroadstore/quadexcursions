// Progressive enhancement for the statically imported Framework360 DOM.
// Never replaces page content; only attaches behavior to existing nodes.

const EMAIL = 'info@quadexcursions.com';
const WHATSAPP = '390921766518';
const CONSENT_KEY = 'qe_cookie_consent_v1';

type Lang = 'it' | 'en' | 'fr' | 'de' | 'es';
const lang = ((document.documentElement.lang || 'it').slice(0, 2) as Lang);

const T: Record<Lang, Record<string, string>> = {
  it: {
    formTitle: 'Invio email non ancora configurato',
    formBody: 'Il modulo non invia ancora messaggi dal nuovo sito. Puoi inviarci i dati inseriti via email o WhatsApp.',
    authTitle: 'Area clienti in fase di migrazione',
    authBody: 'Login, registrazione e recupero password non sono ancora attivi sul nuovo sito. Per prenotazioni e informazioni contattaci direttamente.',
    cartTitle: 'Acquisto online non ancora attivo',
    cartBody: 'Il carrello e i pagamenti richiedono la configurazione post-migrazione. Puoi richiedere questo prodotto o tour via WhatsApp o email.',
    email: 'Invia via email', wa: 'Scrivi su WhatsApp', close: 'Chiudi',
    cookieTitle: 'Impostazioni cookie', necessary: 'Cookie necessari (sempre attivi)', external: 'Contenuti esterni (YouTube, Google Maps, widget di prenotazione)', save: 'Salva preferenze',
    blocked: 'Contenuto esterno bloccato fino al consenso ai cookie. Clicca per accettare e caricare.',
    noResults: 'Nessun risultato trovato.', interest: 'Salve, sono interessato a',
  },
  en: {
    formTitle: 'Email sending not configured yet',
    formBody: 'This form does not send messages from the new site yet. You can send us the details you entered by email or WhatsApp.',
    authTitle: 'Customer area being migrated',
    authBody: 'Login, registration and password recovery are not active on the new site yet. For bookings and information, contact us directly.',
    cartTitle: 'Online purchase not active yet',
    cartBody: 'Cart and payments require post-migration setup. You can request this product or tour via WhatsApp or email.',
    email: 'Send by email', wa: 'Message on WhatsApp', close: 'Close',
    cookieTitle: 'Cookie settings', necessary: 'Necessary cookies (always on)', external: 'External content (YouTube, Google Maps, booking widget)', save: 'Save preferences',
    blocked: 'External content blocked until cookie consent. Click to accept and load.',
    noResults: 'No results found.', interest: 'Hello, I am interested in',
  },
  fr: {
    formTitle: "Envoi d'e-mail pas encore configuré",
    formBody: "Ce formulaire n'envoie pas encore de messages depuis le nouveau site. Vous pouvez nous envoyer vos données par e-mail ou WhatsApp.",
    authTitle: 'Espace client en cours de migration',
    authBody: "La connexion, l'inscription et la récupération du mot de passe ne sont pas encore actives. Contactez-nous directement.",
    cartTitle: 'Achat en ligne pas encore actif',
    cartBody: 'Le panier et les paiements nécessitent une configuration après migration. Demandez ce produit ou tour par WhatsApp ou e-mail.',
    email: 'Envoyer par e-mail', wa: 'Écrire sur WhatsApp', close: 'Fermer',
    cookieTitle: 'Paramètres des cookies', necessary: 'Cookies nécessaires (toujours actifs)', external: 'Contenus externes (YouTube, Google Maps, widget de réservation)', save: 'Enregistrer',
    blocked: 'Contenu externe bloqué sans consentement. Cliquez pour accepter et charger.',
    noResults: 'Aucun résultat.', interest: 'Bonjour, je suis intéressé par',
  },
  de: {
    formTitle: 'E-Mail-Versand noch nicht eingerichtet',
    formBody: 'Dieses Formular sendet auf der neuen Website noch keine Nachrichten. Sie können uns Ihre Angaben per E-Mail oder WhatsApp senden.',
    authTitle: 'Kundenbereich wird migriert',
    authBody: 'Anmeldung, Registrierung und Passwort-Wiederherstellung sind noch nicht aktiv. Bitte kontaktieren Sie uns direkt.',
    cartTitle: 'Online-Kauf noch nicht aktiv',
    cartBody: 'Warenkorb und Zahlungen erfordern eine Einrichtung nach der Migration. Fragen Sie per WhatsApp oder E-Mail an.',
    email: 'Per E-Mail senden', wa: 'WhatsApp schreiben', close: 'Schließen',
    cookieTitle: 'Cookie-Einstellungen', necessary: 'Notwendige Cookies (immer aktiv)', external: 'Externe Inhalte (YouTube, Google Maps, Buchungs-Widget)', save: 'Speichern',
    blocked: 'Externer Inhalt bis zur Cookie-Zustimmung blockiert. Klicken zum Akzeptieren.',
    noResults: 'Keine Ergebnisse.', interest: 'Hallo, ich interessiere mich für',
  },
  es: {
    formTitle: 'Envío de email aún no configurado',
    formBody: 'Este formulario aún no envía mensajes desde el nuevo sitio. Puedes enviarnos tus datos por email o WhatsApp.',
    authTitle: 'Área de clientes en migración',
    authBody: 'Inicio de sesión, registro y recuperación de contraseña aún no están activos. Contáctanos directamente.',
    cartTitle: 'Compra online aún no activa',
    cartBody: 'El carrito y los pagos requieren configuración tras la migración. Solicita este producto o tour por WhatsApp o email.',
    email: 'Enviar por email', wa: 'Escribir por WhatsApp', close: 'Cerrar',
    cookieTitle: 'Configuración de cookies', necessary: 'Cookies necesarias (siempre activas)', external: 'Contenido externo (YouTube, Google Maps, widget de reservas)', save: 'Guardar',
    blocked: 'Contenido externo bloqueado hasta el consentimiento. Haz clic para aceptar y cargar.',
    noResults: 'Sin resultados.', interest: 'Hola, estoy interesado en',
  },
};
const t = (k: string) => (T[lang] || T.it)[k] || T.it[k];

const $$ = <E extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<E & Element>(sel)) as E[];

let cleanups: Array<() => void> = [];
function on<K extends keyof DocumentEventMap>(target: EventTarget, type: K | string, fn: (e: any) => void, opts?: AddEventListenerOptions) {
  target.addEventListener(type, fn, opts);
  cleanups.push(() => target.removeEventListener(type, fn, opts));
}

/* ---------------- Consent & external embeds ---------------- */
type Consent = { necessary: true; external: boolean; ts: number };
function getConsent(): Consent | null {
  try { const v = localStorage.getItem(CONSENT_KEY); return v ? JSON.parse(v) : null; } catch { return null; }
}
function setConsent(external: boolean) {
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ necessary: true, external, ts: Date.now() })); } catch { /* ignore */ }
  applyConsent();
}
const externalAllowed = () => !!getConsent()?.external;

function isExternalEmbed(src: string) {
  return /youtube|youtu\.be|google\.com\/maps|maps\.google|regiondo|vimeo|tripadvisor/i.test(src);
}

function blockEmbeds() {
  $$<HTMLIFrameElement>('iframe').forEach((f) => {
    const src = f.getAttribute('src') || f.getAttribute('data-src') || f.getAttribute('data-url') || '';
    if (!src || !isExternalEmbed(src) || f.dataset.qeSrc) return;
    f.dataset.qeSrc = src;
    if (f.getAttribute('src')) f.removeAttribute('src');
    f.setAttribute('src', 'about:blank');
    if (!f.closest('.ms-background-video-foreground')) {
      const ph = document.createElement('div');
      ph.className = 'qe-embed-blocked';
      ph.textContent = t('blocked');
      ph.addEventListener('click', () => setConsent(true));
      f.style.display = 'none';
      f.insertAdjacentElement('afterend', ph);
    }
  });
}
function applyConsent() {
  const allowed = externalAllowed();
  if (allowed) {
    $$<HTMLIFrameElement>('iframe[data-qe-src]').forEach((f) => {
      if (f.getAttribute('src') !== f.dataset.qeSrc) f.setAttribute('src', f.dataset.qeSrc!);
      f.style.display = '';
      if (f.id === 'regiondo-booking-widget' && !f.style.height) f.style.minHeight = '640px';
      const ph = f.nextElementSibling;
      if (ph?.classList.contains('qe-embed-blocked')) ph.remove();
    });
  }
  const bar = document.getElementById('gdpr_cookie_bar');
  const reopen = document.getElementById('gdpr_open_modal');
  if (getConsent()) {
    if (bar) { bar.classList.remove('qe-show'); bar.style.display = 'none'; bar.hidden = true; }
    if (reopen) { reopen.style.display = ''; reopen.classList.remove('ms-hidden'); }
  } else {
    if (bar) { bar.hidden = false; bar.style.display = 'block'; bar.classList.add('qe-show'); }
  }
}
function openCookieSettings() {
  const c = getConsent();
  const box = dialog(t('cookieTitle'), '', []);
  const wrap = document.createElement('div');
  wrap.className = 'qe-cookie-settings';
  wrap.innerHTML = `<label><input type="checkbox" checked disabled> ${t('necessary')}</label><label><input type="checkbox" class="qe-ext"> ${t('external')}</label>`;
  (wrap.querySelector('.qe-ext') as HTMLInputElement).checked = !!c?.external;
  const actions = box.querySelector('.qe-dialog-actions')!;
  box.querySelector('.qe-dialog-box')!.insertBefore(wrap, actions);
  const save = document.createElement('button');
  save.className = 'qe-primary'; save.textContent = t('save');
  save.onclick = () => {
    const ext = (wrap.querySelector('.qe-ext') as HTMLInputElement).checked;
    const had = externalAllowed();
    setConsent(ext);
    box.remove();
    if (had && !ext) location.reload();
  };
  actions.prepend(save);
}
function initCookies() {
  on(document, 'click', (e: MouseEvent) => {
    const el = (e.target as HTMLElement).closest('.cookie_bar_accept, .open_gdpr_cookie, #gdpr_open_modal');
    if (!el) return;
    e.preventDefault();
    if (el.classList.contains('cookie_bar_accept')) setConsent(true);
    else openCookieSettings();
  });
  applyConsent();
}

/* ---------------- Dialog ---------------- */
function dialog(title: string, body: string, actions: Array<{ label: string; href?: string; primary?: boolean }>) {
  const d = document.createElement('div');
  d.className = 'qe-dialog';
  d.setAttribute('role', 'dialog');
  d.setAttribute('aria-modal', 'true');
  const box = document.createElement('div');
  box.className = 'qe-dialog-box';
  const h = document.createElement('h3'); h.textContent = title; box.appendChild(h);
  if (body) { const p = document.createElement('p'); p.textContent = body; box.appendChild(p); }
  const a = document.createElement('div'); a.className = 'qe-dialog-actions';
  actions.forEach((x) => {
    const link = document.createElement('a');
    link.textContent = x.label; link.href = x.href || '#';
    if (x.href?.startsWith('http')) { link.target = '_blank'; link.rel = 'noopener'; }
    if (x.primary) link.className = 'qe-primary';
    a.appendChild(link);
  });
  const close = document.createElement('button'); close.textContent = t('close');
  close.onclick = () => d.remove();
  a.appendChild(close);
  box.appendChild(a); d.appendChild(box);
  d.addEventListener('click', (e) => { if (e.target === d) d.remove(); });
  document.body.appendChild(d);
  close.focus();
  return d;
}
const waLink = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
const mailLink = (subject: string, text: string) => `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

/* ---------------- Menu & language ---------------- */
function initMenus() {
  $$('.ms-navbar-btn').forEach((btn) => {
    const a = btn.querySelector('a');
    const handler = (e: Event) => {
      e.preventDefault();
      const parent = btn.parentElement!;
      const open = parent.classList.toggle('qe-nav-open');
      a?.setAttribute('aria-expanded', String(open));
    };
    if (a) { a.setAttribute('role', 'button'); a.setAttribute('aria-expanded', 'false'); on(a, 'click', handler); }
  });
  $$<HTMLSelectElement>('select.ms-language-selector').forEach((s) => {
    on(s, 'change', () => { if (s.value) location.href = s.value; });
  });
  $$<HTMLFormElement>('form.ms-language-selector').forEach((f) => on(f, 'submit', (e) => e.preventDefault()));
}

/* ---------------- Popups (initMSPopup) ---------------- */
function openPopup(id: string) {
  const p = document.getElementById(`ms-popup-${id}`);
  if (!p) return;
  p.classList.add('qe-open');
  p.style.display = 'block';
}
function closePopup(p: HTMLElement) {
  p.classList.remove('qe-open');
  p.style.display = 'none';
}
function initActions() {
  on(document, 'click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const close = target.closest('.ms-popup-close');
    const popup = target.closest<HTMLElement>('.ms-popup');
    if (close && popup) { e.preventDefault(); closePopup(popup); return; }
    if (popup && target.classList.contains('ms-popup-overlay')) { closePopup(popup); return; }

    const el = target.closest<HTMLElement>('[data-original-action]');
    if (!el) return;
    const act = el.getAttribute('data-original-action') || '';
    const pm = act.match(/initMSPopup\(\s*"(\d+)"/);
    if (pm) { e.preventDefault(); openPopup(pm[1]); return; }
    if (/MS_Cart_AddToCart/.test(act)) {
      e.preventDefault();
      const title = document.querySelector('h1')?.textContent?.trim() || document.title;
      const card = el.closest('.ms-product, .ms-ecommerce-product, [class*="product"]');
      const name = card?.querySelector('h2, h3, h4, .ms-product-title')?.textContent?.trim() || title;
      const msg = `${t('interest')}: ${name}\n${location.href}`;
      dialog(t('cartTitle'), t('cartBody'), [
        { label: t('wa'), href: waLink(msg), primary: true },
        { label: t('email'), href: mailLink(name, msg) },
      ]);
      return;
    }
    if (/ms-video-onclick/.test(act)) {
      e.preventDefault();
      const input = el.parentElement?.querySelector<HTMLInputElement>('.ms-video-onclick');
      if (!input) return;
      const run = () => {
        const tmp = document.createElement('div');
        tmp.innerHTML = input.value;
        const node = tmp.firstElementChild;
        if (node) el.replaceWith(node);
      };
      if (externalAllowed()) run(); else { setConsent(true); run(); }
    }
  });
  on(document, 'keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    $$('.ms-popup.qe-open').forEach(closePopup);
    $$('.qe-dialog').forEach((d) => d.remove());
    closeLightbox();
  });
}

/* ---------------- FAQ ---------------- */
function initFaq() {
  $$('.ms-faq-question').forEach((q) => {
    const ans = q.nextElementSibling?.classList.contains('ms-faq-answer')
      ? (q.nextElementSibling as HTMLElement)
      : q.parentElement?.querySelector<HTMLElement>('.ms-faq-answer');
    if (!ans) return;
    ans.classList.add('qe-collapsed');
    q.setAttribute('role', 'button'); q.setAttribute('tabindex', '0'); q.setAttribute('aria-expanded', 'false');
    const toggle = () => {
      const open = ans.classList.toggle('qe-collapsed') === false;
      q.setAttribute('aria-expanded', String(open));
      q.classList.toggle('active', open);
    };
    on(q, 'click', toggle);
    on(q, 'keydown', (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });
}

/* ---------------- Tabs ---------------- */
function initTabs() {
  $$('.ms-tabs').forEach((tabs) => {
    const els = Array.from(tabs.children).filter((c) => c.classList.contains('ms-tab-element')) as HTMLElement[];
    if (els.length < 2) return;
    tabs.classList.add('qe-tabs');
    const activate = (i: number) => els.forEach((el, j) => el.classList.toggle('qe-active', i === j));
    activate(0);
    els.forEach((el, i) => {
      const title = el.querySelector<HTMLElement>(':scope > .ms-tab-title');
      if (!title) return;
      title.setAttribute('role', 'tab'); title.setAttribute('tabindex', '0');
      on(title, 'click', () => activate(i));
      on(title, 'keydown', (e: KeyboardEvent) => { if (e.key === 'Enter') activate(i); });
    });
  });
}

/* ---------------- Counters (values from original animateValue init) ---------------- */
function initCounters() {
  const counters = $$('.ms-counter');
  if (!counters.length) return;
  const run = (el: HTMLElement, end: number, dur: number) => {
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = String(Math.round(end * p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  // Counters appear in groups of 4 per language/device variant, same order as original init.
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target as HTMLElement;
      const attr = el.getAttribute('data-counter-target');
      const finalText = el.textContent?.trim() || '';
      const end = attr != null && attr !== '' ? Number(attr) : Number(finalText.replace(/[^\d.-]/g, ''));
      const dur = Number(el.getAttribute('data-counter-duration')) || 2000;
      if (!finalText && !attr || !Number.isFinite(end)) { io.unobserve(el); return; }
      run(el, end, Math.min(dur, 3000));
      io.unobserve(el);
    });
  }, { threshold: 0.3 });
  // Final numbers stay in static HTML (SEO/no-JS); animation only runs when the counter scrolls into view.
  counters.forEach((c) => io.observe(c));
  cleanups.push(() => io.disconnect());
}

/* ---------------- Carousels / sliders ---------------- */
function parseSettings(el: Element): Record<string, any> {
  try { return JSON.parse(el.getAttribute('data-carousel-settings') || '{}'); } catch { return {}; }
}
function initCarousels() {
  $$('.ms-carousel[data-carousel-settings], .owl-carousel').forEach((car) => {
    if (car.classList.contains('qe-carousel')) return;
    const s = parseSettings(car);
    const items = Array.from(car.children).filter((c) => !c.classList.contains('owl-nav') && !c.classList.contains('owl-dots')) as HTMLElement[];
    if (!items.length) return;
    car.classList.add('qe-carousel', 'owl-loaded');
    const track = document.createElement('div');
    track.className = 'qe-track';
    items.forEach((it) => track.appendChild(it));
    car.appendChild(track);
    const gap = Number(s.spacing ?? 0) || 0;
    track.style.gap = `${gap}px`;
    const cols = () => {
      const w = window.innerWidth;
      const c = w < 768 ? (s['sm-cols'] ?? s.cols) : w < 1024 ? (s['md-cols'] ?? s.cols) : s.cols;
      return Math.max(1, Number(c) || 1);
    };
    const size = () => {
      const c = cols();
      items.forEach((it) => { it.style.width = `calc((100% - ${gap * (c - 1)}px) / ${c})`; });
    };
    size();
    on(window, 'resize', size);
    const go = (dir: number) => {
      const max = track.scrollWidth - track.clientWidth;
      let next = track.scrollLeft + dir * track.clientWidth;
      if (next > max + 2) next = 0; else if (next < -2) next = max;
      track.scrollTo({ left: next });
    };
    const arrowsOn = String(s.arrows?.enable ?? '1') === '1';
    const dotsOn = String(s.dots?.enable ?? '0') === '1';
    if (dotsOn && items.length > 1) {
      const dots = document.createElement('div');
      dots.className = `owl-dots ms-theme-dots-${s.dots?.theme || 'default'}`;
      const pages = () => Math.max(1, Math.ceil(items.length / cols()));
      const build = () => {
        dots.innerHTML = '';
        for (let i = 0; i < pages(); i++) {
          const d = document.createElement('button');
          d.className = 'owl-dot'; d.setAttribute('aria-label', `Slide ${i + 1}`);
          d.innerHTML = '<span></span>';
          d.onclick = () => track.scrollTo({ left: i * track.clientWidth });
          dots.appendChild(d);
        }
      };
      build(); on(window, 'resize', build);
      on(track, 'scroll', () => {
        const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        Array.from(dots.children).forEach((d, j) => d.classList.toggle('active', i === j));
      }, { passive: true });
      car.classList.add(`ms-theme-dots-${s.dots?.theme || 'default'}`);
      car.appendChild(dots);
    }
    if (arrowsOn && items.length > cols()) {
      const prev = document.createElement('button'); prev.className = 'qe-car-btn qe-car-prev'; prev.innerHTML = '&#8249;'; prev.setAttribute('aria-label', 'Previous');
      const next = document.createElement('button'); next.className = 'qe-car-btn qe-car-next'; next.innerHTML = '&#8250;'; next.setAttribute('aria-label', 'Next');
      prev.onclick = () => go(-1); next.onclick = () => go(1);
      car.append(prev, next);
    }
    if (String(s.autoplay) === '1') {
      let paused = false;
      on(car, 'mouseenter', () => { paused = String(s['hover-pause']) === '1'; });
      on(car, 'mouseleave', () => { paused = false; });
      const id = window.setInterval(() => { if (!paused) go(1); }, Number(s.speed) || Number(s['autoplay-timeout']) || 5000);
      cleanups.push(() => clearInterval(id));
    }
  });
  // Gallery thumbnails switch main image
  $$('.ms-gallery').forEach((g) => {
    const main = g.querySelector<HTMLElement>('.ms-gallery-main-images');
    const thumbs = $$('.ms-gallery-thumbnails img', g);
    if (!main || !thumbs.length) return;
    const mainImg = main.querySelector<HTMLImageElement>('img');
    const mainA = main.querySelector<HTMLAnchorElement>('a');
    thumbs.forEach((th) => {
      on(th, 'click', (e: Event) => {
        e.preventDefault();
        const a = th.closest('a');
        const src = a?.getAttribute('href') || th.getAttribute('src');
        if (mainImg && src) { mainImg.src = src; mainImg.removeAttribute('srcset'); }
        if (mainA && src) mainA.href = src;
      });
    });
  });
  // Multi-slide ms-slider: simple fade rotation
  $$('.ms-slider').forEach((sl) => {
    const slides = Array.from(sl.children).filter((c) => c.classList.contains('ms-slider-slide')) as HTMLElement[];
    slides.forEach((s, i) => { s.style.display = i === 0 ? '' : 'none'; });
    if (slides.length < 2) return;
    let i = 0;
    const id = window.setInterval(() => {
      slides[i].style.display = 'none';
      i = (i + 1) % slides.length;
      slides[i].style.display = '';
    }, 6000);
    cleanups.push(() => clearInterval(id));
  });
}

/* ---------------- Lightbox ---------------- */
let lbEl: HTMLElement | null = null;
function closeLightbox() { lbEl?.remove(); lbEl = null; }
function initLightbox() {
  on(document, 'click', (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a.ms-gallery-image, a.ms-gallery-single, .ms-gallery-main-images a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (!/\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(href)) return;
    if (a.closest('.ms-gallery-thumbnails')) return;
    e.preventDefault();
    const group = a.closest('.ms-gallery, .ms-visual-block') || document;
    const list = Array.from(new Set($$<HTMLAnchorElement>('a.ms-gallery-image, a.ms-gallery-single', group)
      .map((x) => x.getAttribute('href') || '').filter((h) => /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(h))));
    let idx = Math.max(0, list.indexOf(href));
    closeLightbox();
    lbEl = document.createElement('div');
    lbEl.className = 'qe-lightbox';
    const img = document.createElement('img'); img.alt = '';
    const show = () => { img.src = list[idx] || href; };
    const btn = (cls: string, html: string, fn: () => void) => { const b = document.createElement('button'); b.className = cls; b.innerHTML = html; b.onclick = (ev) => { ev.stopPropagation(); fn(); }; return b; };
    lbEl.append(img, btn('qe-lb-close', '&times;', closeLightbox));
    if (list.length > 1) {
      lbEl.append(btn('qe-lb-prev', '&#8249;', () => { idx = (idx - 1 + list.length) % list.length; show(); }),
        btn('qe-lb-next', '&#8250;', () => { idx = (idx + 1) % list.length; show(); }));
    }
    lbEl.addEventListener('click', (ev) => { if (ev.target === lbEl) closeLightbox(); });
    show();
    document.body.appendChild(lbEl);
  });
}

/* ---------------- Forms ---------------- */
function collectFields(form: HTMLFormElement) {
  const lines: string[] = [];
  $$<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select', form).forEach((f) => {
    const type = (f as HTMLInputElement).type;
    if (['hidden', 'submit', 'button', 'password', 'file'].includes(type)) return;
    if ((type === 'checkbox' || type === 'radio') && !(f as HTMLInputElement).checked) return;
    if (f.name === 'gdpr_form_checkbox') return;
    const v = f.value?.trim();
    if (!v) return;
    const label = f.getAttribute('placeholder') || f.closest('label')?.textContent?.trim() || form.querySelector(`label[for="${f.id}"]`)?.textContent?.trim() || f.name;
    lines.push(`${label}: ${v}`);
  });
  return lines.join('\n');
}
function initForms() {
  on(document, 'submit', (e: SubmitEvent) => {
    const form = e.target as HTMLFormElement;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.classList.contains('ms-search-form')) {
      e.preventDefault();
      const q = form.querySelector<HTMLInputElement>('input[type="search"], input[type="text"], input:not([type])')?.value.trim() || '';
      const u = new URL(form.getAttribute('data-search-page') || '/ricerca/', location.origin);
      const url = new URL(u.pathname, location.origin);
      url.searchParams.set('query', q);
      location.href = url.pathname + url.search;
      return;
    }
    if (form.classList.contains('ms-language-selector')) { e.preventDefault(); return; }
    if (form.matches('.ms-user-login-form, .ms-user-password-recovery, .ms-user-registration-form, .ms-checkout-coupon-block')) {
      e.preventDefault();
      $$<HTMLInputElement>('input[type="password"]', form).forEach((p) => { p.value = ''; });
      const auth = !form.classList.contains('ms-checkout-coupon-block');
      dialog(auth ? t('authTitle') : t('cartTitle'), auth ? t('authBody') : t('cartBody'), [
        { label: t('wa'), href: waLink(document.title), primary: true },
        { label: t('email'), href: `mailto:${EMAIL}` },
      ]);
      return;
    }
    if (form.classList.contains('MSForm') || form.dataset.migratedForm === 'true') {
      e.preventDefault();
      const body = collectFields(form);
      const subject = `${document.title.split('|')[0].trim()} - quadexcursions.com`;
      dialog(t('formTitle'), t('formBody'), [
        { label: t('wa'), href: waLink(body || document.title), primary: true },
        { label: t('email'), href: mailLink(subject, body) },
      ]);
    }
  }, { capture: true });
  // Buttons in FW forms are often <a> or type=button that triggered JS submit
  on(document, 'click', (e: MouseEvent) => {
    const b = (e.target as HTMLElement).closest('form.MSForm a.ms-btn, form.MSForm button:not([type="submit"]), .ms-user-login-form a.ms-btn, .ms-user-registration-form a.ms-btn, .ms-user-password-recovery a.ms-btn');
    if (!b) return;
    const form = b.closest('form');
    if (!form) return;
    const href = (b as HTMLAnchorElement).getAttribute?.('href');
    if (href && href !== '#' && !href.startsWith('javascript') && !/[?&]/.test(href) && href !== '/' ) return;
    e.preventDefault();
    form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });
  // Checkout / cart links
  on(document, 'click', (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href*="/checkout"], a[href*="/carrello"], a[href*="/cart"], .ms-cart a, .cart-toggler');
    if (!a) return;
    e.preventDefault();
    dialog(t('cartTitle'), t('cartBody'), [
      { label: t('wa'), href: waLink(`${t('interest')}: ${document.title}`), primary: true },
      { label: t('email'), href: `mailto:${EMAIL}` },
    ]);
  });
}

/* ---------------- Search page ---------------- */
type Entry = { path: string; title: string; lang: string; excerpt: string };
async function initSearch() {
  const q = new URLSearchParams(location.search).get('query');
  $$<HTMLInputElement>('.ms-search-form input[type="search"], .ms-search-form input[type="text"]').forEach((i) => { if (q && !i.value) i.value = q; });
  if (!q) return;
  const isSearchPage = /\/(ricerca|cerca|search-title|suchtitel|titulo-de-busqueda|titre-de-recherche)\//.test(location.pathname);
  if (!isSearchPage) return;
  try {
    const res = await fetch('/search-index.json');
    const idx: Entry[] = await res.json();
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const hits = idx
      .filter((x) => x.lang === lang)
      .map((x) => {
        const hay = `${x.title} ${x.excerpt}`.toLowerCase();
        const score = terms.reduce((s, tm) => s + (x.title.toLowerCase().includes(tm) ? 3 : 0) + (hay.includes(tm) ? 1 : 0), 0);
        return { x, score, all: terms.every((tm) => hay.includes(tm)) };
      })
      .filter((h) => h.all)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
    const ul = document.createElement('ul');
    ul.className = 'qe-search-results';
    if (!hits.length) { const li = document.createElement('li'); li.textContent = t('noResults'); ul.appendChild(li); }
    hits.forEach(({ x }) => {
      const li = document.createElement('li');
      const a = document.createElement('a'); a.href = x.path; a.textContent = x.title.replace(/\s*\|\s*Quad Excursions$/, '');
      const p = document.createElement('p'); p.textContent = x.excerpt.slice(0, 200) + (x.excerpt.length > 200 ? '...' : '');
      li.append(a, p); ul.appendChild(li);
    });
    const content = document.querySelector('.ms-page-content') || document.querySelector('main') || document.body;
    const formBlock = content.querySelector('.ms-search-form')?.closest('.ms-visual-block');
    const box = document.createElement('div');
    box.className = 'ms-container qe-search-container';
    box.setAttribute('data-search-results', '');
    box.appendChild(ul);
    if (formBlock) formBlock.insertAdjacentElement('afterend', box);
    else content.appendChild(box);
  } catch (err) {
    console.error('search index failed', err);
  }
}

/* ---------------- Fixed rows (sticky header) ---------------- */
function initFixedRows() {
  // Original "handle-down" bottom bars hide on scroll down, show on scroll up.
  const bars = $$('.ms-position-scroll-attachment-handle-down');
  if (!bars.length) return;
  let last = window.scrollY;
  on(window, 'scroll', () => {
    const y = window.scrollY;
    const down = y > last && y > 80;
    bars.forEach((b) => { b.style.transition = 'transform .3s ease'; b.style.transform = down ? 'translateY(100%)' : ''; });
    last = y;
  }, { passive: true });
}

/* ---------------- AOS (replaces FW AOS runtime) ---------------- */
function initAos() {
  const els = $$('[data-aos]');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('aos-animate');
      io.unobserve(en.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el) => { el.classList.add('aos-init'); io.observe(el); });
  cleanups.push(() => io.disconnect());
}

/* ---------------- Lazy images ---------------- */
function initLazy() {
  $$<HTMLImageElement>('img[data-src]:not([src]), img.lazyload[data-src]').forEach((img) => {
    const s = img.getAttribute('data-src');
    if (s && !isExternalEmbed(s)) img.src = s;
  });
  $$('[data-bg]').forEach((el) => { const bg = el.getAttribute('data-bg'); if (bg && !el.style.backgroundImage) el.style.backgroundImage = `url(${bg})`; });
}

export function enhance() {
  cleanups = [];
  const steps = [blockEmbeds, initLazy, initCookies, initMenus, initActions, initFaq, initTabs, initCounters, initCarousels, initLightbox, initForms, initFixedRows, initAos];
  steps.forEach((fn) => { try { fn(); } catch (err) { console.error('[enhance]', fn.name, err); } });
  void initSearch();
  return () => { cleanups.forEach((c) => c()); cleanups = []; };
}
