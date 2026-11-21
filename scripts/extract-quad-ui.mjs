import fs from "node:fs/promises";
import path from "node:path";

// An isolated, reproducible snapshot of the actual rendered migration.
// No production document or production style is changed by this extraction.
const source = path.resolve("artifacts/quad-excursions/dist/public");
const target = path.resolve("artifacts/mockup-sandbox/public/quad-ui-source");
await fs.mkdir(target, { recursive: true });
const rewrite = (value) => value
  .replaceAll("/migrated-assets/", "/__mockup/quad-ui-source/migrated-assets/")
  .replaceAll('"/assets/', '"/__mockup/quad-ui-source/assets/')
  .replaceAll('"/search-index.json"', '"/__mockup/quad-ui-source/search-index.json"');
for (const folder of ["migrated-assets", "assets"]) {
  await fs.cp(path.join(source, folder), path.join(target, folder), { recursive: true });
  for (const file of await fs.readdir(path.join(target, folder))) {
    if (/\.(css|js)$/.test(file)) {
      const destination = path.join(target, folder, file);
      await fs.writeFile(destination, rewrite(await fs.readFile(destination, "utf8")));
    }
  }
}
await fs.copyFile(path.join(source, "search-index.json"), path.join(target, "search-index.json"));
for (const [name, page] of Object.entries({
  home: "index.html",
  tour: "escursione-in-quad-da-4h-cefalu-castelbuono/index.html",
  contact: "contattaci/index.html",
})) {
  const html = rewrite(await fs.readFile(path.join(source, page), "utf8"));
  await fs.writeFile(path.join(target, `${name}.html`), html);
}
console.log("Extracted three original pages and their self-hosted dependencies.");
