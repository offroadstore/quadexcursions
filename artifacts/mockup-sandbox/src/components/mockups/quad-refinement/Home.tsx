import refinement from "./_refinement.css?raw";
import { ExtractedDocument } from "./_Document";

export function Home() {
  return (
    <ExtractedDocument
      page="home"
      title="Homepage · Quad Excursions"
      stylesheet={refinement}
    />
  );
}
