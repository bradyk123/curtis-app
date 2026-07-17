/**
 * Re-encode every exercise GIF to a higher-quality MP4 (2x lanczos upscale +
 * light sharpen, full color, no dithering) and upload it to the same
 * `exercise-media` storage bucket under the same basename with a `.mp4`
 * extension. The app then plays the MP4 and falls back to the GIF if one is
 * ever missing — so no DB schema change is needed.
 *
 * Run:  node scripts/gifs_to_mp4.mjs           (convert + upload all)
 *       node scripts/gifs_to_mp4.mjs --dry     (list what it would do)
 *
 * Idempotent: re-running overwrites the MP4s (upsert). Reads SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY from .env.
 */
import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const FFMPEG = join(REPO, "node_modules", "ffmpeg-static", "ffmpeg");
const MEDIA_DIR = join(REPO, "public", "media");
const BUCKET = "exercise-media";
const DRY = process.argv.includes("--dry");

// ---- env ----
function readEnv(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}
const env = { ...readEnv(join(REPO, ".env.production")), ...readEnv(join(REPO, ".env")) };
const URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}
const sb = createClient(URL, KEY, { auth: { persistSession: false } });
const publicBase = `${URL}/storage/v1/object/public/${BUCKET}/`;

const tmp = join(os.tmpdir(), "gif2mp4");
mkdirSync(tmp, { recursive: true });

const IMG_EXT = /\.(gif|webp|png|jpe?g)$/i;

async function getSource(mediaPath) {
  const local = join(MEDIA_DIR, mediaPath);
  if (existsSync(local)) return local;
  // admin-replaced media may not be bundled locally — pull it from the bucket
  const res = await fetch(publicBase + encodeURIComponent(mediaPath));
  if (!res.ok) throw new Error(`fetch ${mediaPath} -> ${res.status}`);
  const dest = join(tmp, mediaPath.replace(/[^\w.-]/g, "_"));
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
}

function convert(src, outMp4) {
  // Denoise FIRST (the source has real grain/compression noise — sharpening it
  // just amplifies the grain), THEN 2x lanczos upscale + a very light sharpen.
  // hqdn3d spatial+temporal smooths the grainy track texture across frames.
  execFileSync(
    FFMPEG,
    [
      "-y", "-i", src,
      "-vf",
      "hqdn3d=8:6:6:6,scale=iw*2:ih*2:flags=lanczos,unsharp=3:3:0.3:3:3:0.0,format=yuv420p",
      "-an", "-movflags", "+faststart", "-pix_fmt", "yuv420p",
      "-c:v", "libx264", "-profile:v", "high", "-crf", "20", "-preset", "slow",
      outMp4,
    ],
    { stdio: "ignore" }
  );
}

const { data: rows, error } = await sb
  .from("exercises")
  .select("id, name, media_path")
  .not("media_path", "is", null);
if (error) {
  console.error("DB error:", error.message);
  process.exit(1);
}

const targets = rows.filter((r) => IMG_EXT.test(r.media_path));
console.log(`${rows.length} exercises with media; ${targets.length} image files to convert.${DRY ? " (dry run)" : ""}`);

let ok = 0, fail = 0, bytesIn = 0, bytesOut = 0;
for (const [i, r] of targets.entries()) {
  const mp4Name = r.media_path.replace(IMG_EXT, ".mp4");
  const label = `[${i + 1}/${targets.length}] ${r.media_path} -> ${mp4Name}`;
  try {
    if (DRY) { console.log("would convert " + label); continue; }
    const src = await getSource(r.media_path);
    const out = join(tmp, mp4Name.replace(/[^\w.-]/g, "_"));
    convert(src, out);
    const buf = readFileSync(out);
    const up = await sb.storage
      .from(BUCKET)
      .upload(mp4Name, buf, { contentType: "video/mp4", upsert: true });
    if (up.error) throw new Error(up.error.message);
    bytesOut += buf.length;
    ok++;
    console.log(`✓ ${label} (${(buf.length / 1024).toFixed(0)} KB)`);
  } catch (e) {
    fail++;
    console.log(`✗ ${label} — ${e.message}`);
  }
}
console.log(`\nDone. ok=${ok} fail=${fail}  uploaded=${(bytesOut / 1024 / 1024).toFixed(1)} MB`);
