import { BASE, siteUrl } from "./base";

/** Transfer the approved canvas layout onto the actual page document. */
export function applyApprovedLayout() {
  const desktop = document.querySelector<HTMLElement>(
    ".ms-deviceonly-general .ms-position-fixed.ms-position-attachment-top",
  );
  const mobile = document.querySelector<HTMLElement>(
    ".ms-deviceonly-mobile .ms-position-fixed.ms-position-attachment-top",
  );
  desktop?.classList.add("qe-ui-desktop-header");
  mobile?.classList.add("qe-ui-mobile-header");
  const logo = desktop?.querySelector<HTMLElement>(".ms-block-logo");
  if (logo) {
    for (const node of [logo, ...logo.querySelectorAll<HTMLElement>("div, picture")]) {
      node.style.setProperty("width", "138px", "important");
      node.style.setProperty("max-width", "none", "important");
    }
    logo.style.setProperty("display", "block", "important");
    const image = logo.querySelector("img");
    image?.style.setProperty("width", "138px", "important");
    image?.style.setProperty("height", "auto", "important");
  }
  mobile?.closest(".ms-visualbuilder-block-header")
    ?.querySelectorAll<HTMLElement>(".ms-deviceonly-mobile .ms-block-logo")
    .forEach(original => {
      if (mobile.contains(original)) return;
      original.classList.add("qe-ui-duplicate-mobile-logo");
      original.closest(".ms-row.ms-full-width")?.classList.add("qe-ui-mobile-original-logo-row");
    });
  if (mobile && !mobile.querySelector(".qe-ui-mobile-brandline")) {
    const brandline = document.createElement("div");
    brandline.className = "qe-ui-mobile-brandline";
    const original = logo?.querySelector("img");
    if (original) {
      const link = document.createElement("a");
      link.href = siteUrl("/");
      link.className = "qe-ui-mobile-logo";
      link.setAttribute("aria-label", "Quad Excursions · Homepage");
      const image = document.createElement("img");
      image.src = original.src;
      image.alt = original.alt || "Quad Excursions";
      link.append(image); brandline.append(link);
    }
    const phone = document.createElement("div");
    phone.className = "qe-ui-mobile-phone";
    const link = document.createElement("a");
    link.href = "https://wa.me/390921766518";
    link.textContent = "+39 0921 766518";
    link.setAttribute("aria-label", "WhatsApp: +39 0921 766518");
    phone.append(link); brandline.append(phone);
    mobile.querySelector(".ms-container")?.prepend(brandline);
  }
  const language = mobile?.querySelector<HTMLSelectElement>("select.ms-language-selector");
  language?.style.setProperty("min-width", "0", "important");
  language?.style.setProperty("appearance", "none", "important");
  language?.style.setProperty("color", "#203537", "important");
  language?.style.setProperty("text-indent", "0", "important");
  document.querySelectorAll<HTMLSelectElement>("select.ms-language-selector").forEach(select => {
    select.setAttribute("aria-label", "Lingua / Language");
  });
  document.querySelectorAll<HTMLAnchorElement>(".ms-block-icon a:has(.fa-bars), .ms-navbar-btn > a").forEach(link => {
    link.setAttribute("aria-label", "Menu");
  });
  document.querySelectorAll<HTMLAnchorElement>(".ms-block-title-with-icon a:has(.fa-search)").forEach(link => {
    link.setAttribute("aria-label", "Cerca / Search");
  });
  const pathname = location.pathname.slice(BASE.length) || "/";
  const page = /^\/(?:(?:en|fr|de|es)\/)?$/.test(pathname) ? "home"
    : document.querySelector(".migration-booking-link, .ms-product-detail") ? "tour"
    : document.querySelector("form.MSForm textarea") ? "contact" : "content";
  document.documentElement.classList.add("qe-refined", `qe-refined-${page}`);
  document.documentElement.style.setProperty(
    "--qe-whatsapp-icon", `url("${siteUrl("/migrated-assets/9cb2fd7bab023aba3056.png")}")`,
  );
}
