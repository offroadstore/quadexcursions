import refinement from "./_refinement.css?raw";
import { ExtractedDocument } from "./_Document";

export function Contact() {
  return (
    <ExtractedDocument
      page="contact"
      title="Contatti · Quad Excursions"
      stylesheet={refinement}
    />
  );
}
