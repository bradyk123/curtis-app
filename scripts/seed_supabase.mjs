// Seed the Supabase database + upload exercise GIFs.
//
// Prereqs: run supabase/schema.sql once in the SQL Editor, and create a .env
// file (copy .env.example) containing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
//
// Run:  node --env-file=.env scripts/seed_supabase.mjs
//
// Idempotent: clears the three tables and re-inserts, and upserts media files.
// Uses the SERVICE ROLE key (server-side only) which bypasses RLS — never ship
// this key to the client or commit it.

import { createClient } from "@supabase/supabase-js";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..");
const BUCKET = "exercise-media";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing env. Create a .env file with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY,\n" +
      "then run: node --env-file=.env scripts/seed_supabase.mjs"
  );
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function ensureBucket() {
  const { data: buckets } = await sb.storage.listBuckets();
  if (buckets?.some((b) => b.name === BUCKET)) {
    console.log(`bucket "${BUCKET}" already exists`);
    return;
  }
  const { error } = await sb.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: "10MB",
  });
  if (error) throw error;
  console.log(`created public bucket "${BUCKET}"`);
}

async function uploadMedia() {
  const dir = join(REPO, "public", "media");
  const files = (await readdir(dir)).filter((f) => f.toLowerCase().endsWith(".gif"));
  let ok = 0;
  for (const f of files) {
    const buf = await readFile(join(dir, f));
    const { error } = await sb.storage
      .from(BUCKET)
      .upload(f, buf, { contentType: "image/gif", upsert: true });
    if (error) {
      console.error(`  upload FAILED ${f}: ${error.message}`);
    } else {
      ok++;
    }
  }
  console.log(`uploaded/updated ${ok}/${files.length} media files`);
}

async function clearTables() {
  // delete in FK-safe order (children first)
  for (const t of ["exercises", "circuits", "categories"]) {
    const { error } = await sb.from(t).delete().gt("id", 0);
    if (error) throw error;
  }
  console.log("cleared existing rows");
}

async function seed() {
  const inventory = JSON.parse(
    await readFile(join(REPO, "scripts", "inventory.json"), "utf8")
  );

  // categories
  const catPayload = inventory.map((c, i) => ({
    slug: c.id,
    name: c.name,
    sort_order: i,
  }));
  const { data: cats, error: catErr } = await sb
    .from("categories")
    .insert(catPayload)
    .select();
  if (catErr) throw catErr;
  const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
  console.log(`inserted ${cats.length} categories`);

  // circuits
  const circuitPayload = [];
  for (const c of inventory) {
    c.circuits.forEach((ci, i) => {
      circuitPayload.push({
        slug: ci.id,
        category_id: catId[c.id],
        name: ci.name,
        subtitle: ci.subtitle ?? null,
        sort_order: i,
      });
    });
  }
  const { data: circuits, error: circErr } = await sb
    .from("circuits")
    .insert(circuitPayload)
    .select();
  if (circErr) throw circErr;
  const circId = Object.fromEntries(circuits.map((c) => [c.slug, c.id]));
  console.log(`inserted ${circuits.length} circuits`);

  // exercises
  const exPayload = [];
  for (const c of inventory) {
    for (const ci of c.circuits) {
      ci.exercises.forEach((e, i) => {
        exPayload.push({
          circuit_id: circId[ci.id],
          slug: e.id,
          name: e.name,
          media_path: e.media ?? null,
          cues: e.cues ?? null,
          sort_order: i,
        });
      });
    }
  }
  // insert in chunks to stay well under any payload limits
  let inserted = 0;
  for (let i = 0; i < exPayload.length; i += 200) {
    const chunk = exPayload.slice(i, i + 200);
    const { error } = await sb.from("exercises").insert(chunk);
    if (error) throw error;
    inserted += chunk.length;
  }
  console.log(`inserted ${inserted} exercises`);
}

async function main() {
  console.log(`Seeding ${url} …`);
  await ensureBucket();
  await uploadMedia();
  await clearTables();
  await seed();
  console.log("\n✅ done — database seeded and media uploaded.");
}

main().catch((e) => {
  console.error("\n❌ seed failed:", e.message ?? e);
  process.exit(1);
});
