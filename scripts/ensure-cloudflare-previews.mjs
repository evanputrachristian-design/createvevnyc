import { readFileSync, writeFileSync } from "node:fs";

const configPath = ".output/server/wrangler.json";

let config;
try {
  config = JSON.parse(readFileSync(configPath, "utf8"));
} catch (error) {
  console.error(
    `Unable to read Nitro's generated Cloudflare config at ${configPath}.`,
  );
  throw error;
}

// Cloudflare's `wrangler preview` requires a previews block.
// Nitro generates this file during `vite build`, so patch it after the build.
if (!config.previews || typeof config.previews !== "object") {
  config.previews = {};
}

writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
console.log("Added the required Cloudflare previews configuration.");
