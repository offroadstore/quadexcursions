import { siteUrl } from "./base";

export const whatsapp = (text: string) =>
  `https://wa.me/390921766518?text=${encodeURIComponent(text)}`;
const language = document.documentElement.lang.slice(0, 2);
const copy = ({
  it: { contact: "Contatti", inquiry: "Richiedi informazioni su WhatsApp", send: "Continua su WhatsApp", note: "Si apre WhatsApp con i dati compilati. Il messaggio viene inviato solo quando lo confermi su WhatsApp.", help: "Per informazioni, assistenza e disponibilità contatta direttamente il nostro team.", updates: "Richiedi novità e offerte su WhatsApp" },
  en: { contact: "Contact", inquiry: "Request information on WhatsApp", send: "Continue on WhatsApp", note: "WhatsApp opens with your details. The message is sent only when you confirm it in WhatsApp.", help: "Contact our team directly for information, assistance and availability.", updates: "Ask for news and offers on WhatsApp" },
  fr: { contact: "Contact", inquiry: "Demander des informations sur WhatsApp", send: "Continuer sur WhatsApp", note: "WhatsApp s'ouvre avec vos informations. Le message est envoyé uniquement après votre confirmation dans WhatsApp.", help: "Contactez notre équipe pour les informations, l'assistance et les disponibilités.", updates: "Demander les actualités et offres sur WhatsApp" },
  de: { contact: "Kontakt", inquiry: "Informationen über WhatsApp anfordern", send: "Weiter zu WhatsApp", note: "WhatsApp öffnet sich mit Ihren Angaben. Die Nachricht wird erst nach Ihrer Bestätigung in WhatsApp gesendet.", help: "Kontaktieren Sie unser Team für Informationen, Hilfe und Verfügbarkeit.", updates: "Neuigkeiten und Angebote über WhatsApp anfragen" },
  es: { contact: "Contacto", inquiry: "Solicita información por WhatsApp", send: "Continuar en WhatsApp", note: "WhatsApp se abre con tus datos. El mensaje solo se envía cuando lo confirmas en WhatsApp.", help: "Contacta con nuestro equipo para información, asistencia y disponibilidad.", updates: "Solicitar novedades y ofertas por WhatsApp" },
} as const)[language as "it" | "en" | "fr" | "de" | "es"] || {
  contact: "Contact", inquiry: "Request information on WhatsApp", send: "Continue on WhatsApp",
  note: "WhatsApp opens with your details. Confirm there to send.", help: "Contact our team directly.", updates: "News and offers on WhatsApp",
};
const inquiryLink = () => {
  const link = document.createElement("a");
  link.className = "qe-inquiry-button";
  link.href = whatsapp(document.title);
  link.textContent = copy.inquiry;
  return link;
};

export function wireInquiries() {
  // The business takes requests through WhatsApp, not checkout or an invented account system.
  document.querySelectorAll<HTMLAnchorElement>('a[href*="/login"], a[href*="/registr"], a[href*="/password-recovery"]').forEach(link => {
    link.href = siteUrl("/contattaci/");
    link.textContent = copy.contact;
  });
  document.querySelectorAll<HTMLAnchorElement>('.cart-toggler, a[href*="/checkout"], a[href*="/carrello"], a[href*="/cart"]').forEach(link => {
    link.href = whatsapp(`${document.title}\n${location.href}`);
    link.removeAttribute("data-original-action");
    link.setAttribute("aria-label", copy.inquiry);
    link.querySelector("i")?.setAttribute("class", "fab fa-whatsapp");
  });
  document.querySelectorAll<HTMLElement>('[data-original-action*="MS_Cart_AddToCart"]').forEach(link => {
    link.removeAttribute("data-original-action");
    if (link instanceof HTMLAnchorElement) link.href = whatsapp(document.title);
    link.setAttribute("aria-label", copy.inquiry);
    link.textContent = copy.inquiry;
  });
  document.querySelectorAll<HTMLElement>(".ms-user-login-form, .ms-user-registration-form, .ms-user-password-recovery, .ms-checkout").forEach(form => {
    const section = document.createElement("section");
    section.className = "qe-assistance";
    const heading = document.createElement("h2");
    heading.textContent = copy.contact;
    const text = document.createElement("p"); text.textContent = copy.help;
    section.append(heading, text, inquiryLink()); form.replaceWith(section);
  });
  document.querySelectorAll<HTMLFormElement>("form.MSForm").forEach(form => {
    form.removeAttribute("novalidate");
    form.querySelectorAll<HTMLInputElement>('input[name="email"]').forEach(input => { input.type = "email"; });
    form.querySelectorAll<HTMLInputElement>('input[name="telefono"], input[type="phone"]').forEach(input => { input.type = "tel"; });
    const note = document.createElement("p");
    note.className = "qe-inquiry-note";
    const newsletter = !form.querySelector("textarea") &&
      /newsletter/i.test(form.closest(".ms-row")?.textContent || form.textContent || "");
    note.textContent = copy.note;
    form.append(note);
    form.querySelectorAll<HTMLElement>(".ms-btn, button[type=submit], input[type=submit]").forEach(button => {
      if (button instanceof HTMLInputElement) button.value = newsletter ? copy.updates : copy.send;
      else button.textContent = newsletter ? copy.updates : copy.send;
    });
  });
  const submit = (event: Event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches("form.MSForm")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!form.reportValidity()) return;
    const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select"));
    const lines = [document.title, location.href];
    for (const field of fields) {
      if (["hidden", "password", "file", "submit", "button"].includes(field.type) || field.disabled) continue;
      if (field instanceof HTMLInputElement && ["checkbox", "radio"].includes(field.type) && !field.checked) continue;
      if (!field.value.trim()) continue;
      const rawLabel = field.getAttribute("data-label");
      const labelNode = document.createElement("span");
      labelNode.innerHTML = rawLabel || "";
      const label = labelNode.textContent?.trim() || field.labels?.[0]?.textContent?.trim() || field.getAttribute("placeholder") || field.name;
      lines.push(`${label}: ${field.value.trim()}`);
    }
    // No network request or fake confirmation: only the user sends the message.
    window.location.assign(whatsapp(lines.join("\n")));
  };
  document.addEventListener("submit", submit, true);
  return () => document.removeEventListener("submit", submit, true);
}
