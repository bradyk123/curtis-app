/**
 * Rasterize the Beach Track Club mark (public/favicon.svg) to PNGs and upload a
 * copy to public storage for use in emails. Also writes a local PNG you can use
 * as the Google Workspace / sender profile photo (the Gmail avatar).
 *
 * Run:  node scripts/gen_logo.mjs
 * Outputs:
 *   - public/btc-logo.png                          (512px, for the sender avatar)
 *   - Supabase exercise-media/brand/btc-logo.png   (public URL for email headers)
 */
import { Resvg } from "@resvg/resvg-js";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
function readEnv(f) {
  const o = {};
  if (!existsSync(f)) return o;
  for (const l of readFileSync(f, "utf8").split("\n")) {
    const m = l.match(/^([A-Z_]+)=(.*)$/);
    if (m) o[m[1]] = m[2].trim();
  }
  return o;
}
const env = { ...readEnv(join(REPO, ".env.production")), ...readEnv(join(REPO, ".env")) };
const URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SVC = env.SUPABASE_SERVICE_ROLE_KEY;

const svg = readFileSync(join(REPO, "public", "favicon.svg"), "utf8");
const png = new Resvg(svg, { fitTo: { mode: "width", value: 512 } }).render().asPng();

const localPath = join(REPO, "public", "btc-logo.png");
writeFileSync(localPath, png);
console.log(`wrote ${localPath} (${(png.length / 1024).toFixed(1)} KB)`);

const sb = createClient(URL, SVC, { auth: { persistSession: false } });
const path = "brand/btc-logo.png";
const up = await sb.storage
  .from("exercise-media")
  .upload(path, png, { contentType: "image/png", upsert: true });
if (up.error) {
  console.log("upload error:", up.error.message);
  process.exit(1);
}
console.log(`uploaded to exercise-media/${path}`);
console.log(`public URL: ${URL}/storage/v1/object/public/exercise-media/${path}`);
