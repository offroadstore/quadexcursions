import fs from "node:fs/promises";
import path from "node:path";

// Make the copied, self-hosted styles independent of the artifact URL prefix.
const directory = new URL("../public/migrated-assets/", import.meta.url);
for (const file of await fs.readdir(directory)) {
  if (!file.endsWith(".css")) continue;
  const target = path.join(directory.pathname, file);
  const original = await fs.readFile(target, "utf8");
  await fs.writeFile(target, original.replaceAll("/migrated-assets/", "./"));
}
