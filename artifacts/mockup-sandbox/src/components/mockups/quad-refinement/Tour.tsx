import refinement from "./_refinement.css?raw";
import { ExtractedDocument } from "./_Document";

export function Tour() {
  return (
    <ExtractedDocument
      page="tour"
      title="Escursione di 4 ore · Quad Excursions"
      stylesheet={refinement}
    />
  );
}
