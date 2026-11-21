import "./_group.css";

export function ExtractedDocument({
  page,
  title,
  stylesheet,
}: {
  page: "home" | "tour" | "contact";
  title: string;
  stylesheet?: string;
}) {
  return (
    <iframe
      className="qe-extracted-frame"
      title={title}
      src={`/__mockup/quad-ui-source/${page}.html`}
      onLoad={(event) => {
        const document = event.currentTarget.contentDocument;
        if (!document) return;
        if (stylesheet && !document.getElementById("qe-refinement-sheet")) {
          const desktopHeader = document.querySelector<HTMLElement>(
            ".ms-deviceonly-general .ms-position-fixed.ms-position-attachment-top",
          );
          const mobileHeader = document.querySelector<HTMLElement>(
            ".ms-deviceonly-mobile .ms-position-fixed.ms-position-attachment-top",
          );
          desktopHeader?.classList.add("qe-ui-desktop-header");
          mobileHeader?.classList.add("qe-ui-mobile-header");
          const desktopLogo = desktopHeader?.querySelector<HTMLImageElement>(".ms-block-logo img");
          const desktopLogoBlock = desktopHeader?.querySelector<HTMLElement>(".ms-block-logo");
          if (desktopLogoBlock) {
            desktopLogoBlock.style.setProperty("display", "block", "important");
            desktopLogoBlock.style.setProperty("width", "138px", "important");
            desktopLogoBlock.style.setProperty("max-width", "none", "important");
            desktopLogoBlock.querySelectorAll<HTMLElement>("div, picture").forEach((node) => {
              node.style.setProperty("width", "138px", "important");
              node.style.setProperty("max-width", "none", "important");
            });
          }
          desktopLogo?.style.setProperty("width", "138px", "important");
          desktopLogo?.style.setProperty("max-width", "100%", "important");
          desktopLogo?.style.setProperty("height", "auto", "important");
          const originalMobileLogos = mobileHeader
            ?.closest(".ms-visualbuilder-block-header")
            ?.querySelectorAll<HTMLElement>(".ms-deviceonly-mobile .ms-block-logo");
          originalMobileLogos?.forEach((logo) => {
            if (mobileHeader?.contains(logo)) return;
            logo.classList.add("qe-ui-duplicate-mobile-logo");
            logo.closest<HTMLElement>(".ms-row.ms-full-width")?.classList.add("qe-ui-mobile-original-logo-row");
          });

          // The extracted mobile header contains only language, search and menu.
          // Reuse the original brand mark and phone link without duplicating IDs.
          if (desktopHeader && mobileHeader && !mobileHeader.querySelector(".qe-ui-mobile-brandline")) {
            const originalLogo = desktopHeader.querySelector<HTMLElement>(".ms-block-logo");
            const originalPhone = desktopHeader.querySelector<HTMLAnchorElement>(
              '.ms-block-text-editor a[href*="wa.me/390921766518"]',
            );
            const brandline = document.createElement("div");
            brandline.className = "qe-ui-mobile-brandline";
            if (originalLogo) {
              const sourceImage = originalLogo.querySelector("img");
              const sourceLink = originalLogo.querySelector("a");
              if (sourceImage) {
                const link = document.createElement("a");
                link.className = "qe-ui-mobile-logo";
                link.href = sourceLink?.getAttribute("href") || "/";
                link.setAttribute("aria-label", "Quad Excursions · Homepage");
                const image = document.createElement("img");
                image.src = sourceImage.src;
                image.alt = sourceImage.alt || "Quad Excursions";
                link.append(image);
                brandline.append(link);
              }
            }
            if (originalPhone) {
              const phone = document.createElement("div");
              phone.className = "qe-ui-mobile-phone";
              const link = document.createElement("a");
              link.href = originalPhone.href;
              link.target = originalPhone.target;
              link.rel = originalPhone.rel;
              link.textContent = originalPhone.textContent?.trim() || "+39 0921 766518";
              phone.append(link);
              brandline.append(phone);
            }
            mobileHeader.querySelector(".ms-container")?.prepend(brandline);
          }
          const mobileLanguage = mobileHeader?.querySelector<HTMLSelectElement>("select.ms-language-selector");
          mobileLanguage?.style.setProperty("width", "100%", "important");
          mobileLanguage?.style.setProperty("min-width", "0", "important");
          mobileLanguage?.style.setProperty("color", "#203537", "important");
          mobileLanguage?.style.setProperty("text-indent", "0", "important");
          mobileLanguage?.style.setProperty("appearance", "none", "important");

          const style = document.createElement("style");
          style.id = "qe-refinement-sheet";
          style.textContent = stylesheet;
          document.head.append(style);
          document.documentElement.classList.add("qe-refined", `qe-refined-${page}`);
        }
      }}
    />
  );
}
