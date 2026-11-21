import homeLayout from "./Home.css?raw";
import refinement from "./_refinement.css?raw";
import { ExtractedDocument } from "./_Document";

const verticalCards = `
/* A single, editorial excursion list: keep the real source cards and links,
   but give each itinerary its own full-width reading lane. */
.qe-refined-home .ms-visual-block.ms-block-ecommerce-products > .ms-row {
  grid-template-columns: minmax(0, 1fr) !important;
  gap: 18px !important;
}
.qe-refined-home .ms-visual-block.ms-block-ecommerce-products > .ms-row > .structure
  > .ms-row.ms-full-content {
  min-height: 250px;
  border: 1px solid rgba(32, 53, 55, .11);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(32, 53, 55, .055);
}
.qe-refined-home .ms-visual-block.ms-block-ecommerce-products > .ms-row > .structure
  > .ms-row.ms-full-content > .ms-inside-row {
  display: grid;
  grid-template-columns: minmax(230px, .8fr) minmax(0, 1.2fr);
  align-items: stretch;
}
.qe-refined-home .ms-visual-block.ms-block-ecommerce-products > .ms-row > .structure
  > .ms-row.ms-full-content .ms-block-image {
  height: 100%;
  min-height: 250px;
}
.qe-refined-home .ms-visual-block.ms-block-ecommerce-products > .ms-row > .structure
  > .ms-row.ms-full-content .ms-block-image img {
  width: 100%;
  height: 100%;
  min-height: 250px;
  aspect-ratio: auto;
  object-fit: cover;
}
.qe-refined-home .ms-visual-block.ms-block-ecommerce-products > .ms-row > .structure
  > .ms-row.ms-full-content > .ms-inside-row > .ms-col-12 {
  padding: 8px 0;
}
.qe-refined-home .ms-visual-block.ms-block-ecommerce-products > .ms-row > .structure
  > .ms-row.ms-full-content .ms-block-title { margin-top: 22px; }
.qe-refined-home .ms-visual-block.ms-block-ecommerce-products > .ms-row > .structure
  > .ms-row.ms-full-content .ms-block-description { max-width: 58ch; }
.qe-refined-home .ms-visual-block.ms-block-ecommerce-products > .ms-row > .structure
  > .ms-row.ms-full-content .ms-block-price { margin-top: 13px; }
.qe-refined-home .ms-visual-block.ms-block-ecommerce-products > .ms-row > .structure
  > .ms-row.ms-full-content .ms-block-button { margin-top: 14px; }
@media (max-width: 767px) {
  .qe-refined-home .ms-visual-block.ms-block-ecommerce-products > .ms-row {
    gap: 15px !important;
  }
  .qe-refined-home .ms-visual-block.ms-block-ecommerce-products > .ms-row > .structure
    > .ms-row.ms-full-content { min-height: 0; }
  .qe-refined-home .ms-visual-block.ms-block-ecommerce-products > .ms-row > .structure
    > .ms-row.ms-full-content > .ms-inside-row {
    display: flex;
    flex-direction: column;
  }
  .qe-refined-home .ms-visual-block.ms-block-ecommerce-products > .ms-row > .structure
    > .ms-row.ms-full-content .ms-block-image,
  .qe-refined-home .ms-visual-block.ms-block-ecommerce-products > .ms-row > .structure
    > .ms-row.ms-full-content .ms-block-image img {
    min-height: 0;
    height: auto;
  }
  .qe-refined-home .ms-visual-block.ms-block-ecommerce-products > .ms-row > .structure
    > .ms-row.ms-full-content .ms-block-image img {
    aspect-ratio: 16 / 9;
  }
  .qe-refined-home .ms-visual-block.ms-block-ecommerce-products > .ms-row > .structure
    > .ms-row.ms-full-content > .ms-inside-row > .ms-col-12 {
    padding: 0;
  }
  .qe-refined-home .ms-visual-block.ms-block-ecommerce-products > .ms-row > .structure
    > .ms-row.ms-full-content .ms-block-title { margin-top: 18px; }
}
`;

export function HomeVertical() {
  return (
    <ExtractedDocument
      page="home"
      title="Homepage · Quad Excursions — itinerari in elenco"
      stylesheet={`${refinement}\n${homeLayout}\n${verticalCards}`}
    />
  );
}
