import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";

const FFMPEG = "/Users/bradykirtland/Desktop/Curtis APP/node_modules/ffmpeg-static/ffmpeg";
const DIR = "/private/tmp/claude-501/-Users-bradykirtland-Desktop-Curtis-APP/bc4c2f26-fbcd-4897-81e0-76a902cebf40/scratchpad/all_vids";
mkdirSync(join(DIR, "mov"), { recursive: true });
mkdirSync(join(DIR, "mp4"), { recursive: true });
const DONE_PATH = join(DIR, "done.json");
const MANIFEST_PATH = join(DIR, "manifest.json");

const BUCKET = "exercise-video";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// folder -> raw id arrays (verbatim from Drive scrape; folder's own id included and skipped)
const FOLDERS = {
  "Ancillary Bike": ["1i1dh_9ZYhSuQyQA-tDMg4pcs7B1A7_YX","1jeMpItnTh1Qtym_vrK1tcx72ZHaoHmrv","1f3bkvArbEx0a_UzFlFUWX_g2bXl00NIf","1JbGEK8sQZ2Vw_0BhGAfdfKAmVUWLPBTi"],
  "Ancillary Strength": ["1WCKX5amr5byc8ylFHzmoee-z0e-nmgIV","1D0kujwp0yXC3DQFy42zD-JH19Dx9V4p1","1PiQXU3UQIUdzxaFQjWDvNYM8CkIV1gIu","10G4ukLF-ChLbH73QrlwvryDCkN3TZadv","1RDyt4lJ2seEzvH-DhTStWEwnUY9cGBr_","1dBjN7euEWcoRJks3cXNXT01kOSk5Kx5q","1-s3812zeb8uqz_RbVotUW_vXnFAZXmKl","1vCFk95pvDCpOnOGvMBe5kvaEDJXuhlzC","1zNLEwbl33ROtNeXZqTMmqxQcVMVbDzrE","1HSMAAC5wG42IE2wMgqu4JUbrI_mI6xlV","1RMD5F_eUsvyCWC_jTh8ambcsIOPOOfbR","1U1ZZib9EZE4rpHE2iuBb8Xd-26ayhbPL","1hkdGmr4EFcTyNvcgMne3GO1Jfcjhj7ho","1IlSXJSzgJZSp9Kne-L4b37qIWY7bpWT2","1BEZ49DRwwIPCLRerM-IVjDO6B6PJDdZM","1z071CIYyYvEFLJWkI26j22Fxe-aNMAcG","1gUHfAgpfDFVuE-vN027YXO115dSyFUQP","1ByXtpXteogTbI63BpFTqooXgJaOp10nW","1vNk9IE19MaljN5VSUAiz3nZX-chAAllP","14lQv5JC6wAqAlPYPFKv-PoIagjwndYEi","1lW9Be3GOpE92C6ibxT_1thL1oq2rHPKV","1_CMmy6VV-mHTPFyLjTsCw6P5lRwR-IEi","1wuaBZbd8ZpYicB9PPuy_JIgVcbmuo-rN"],
  "Mobility": ["15EcUFphFM_4Nm8pt0AvJV-dk6AVFKyOR","1fZYUZn08xVZr0eNNbI8v54fcmk6ouFMD","1_8YYrghMjz2Sf5gVJ_E4KymagIhTpMpE","1TyMPSfZjTOZkE5I9rtFcZDcjyV-CAxJu"],
  "Multiple Jump": ["1WTelfMyUGQpoZ8_riRVyE5pzfJMyjVBd","1tfZs1KCBhjoXmcX5ch7YoldObzHjHsbT","1jD_oi12xA-xOJAz2QmiJ-TzjnNl0UsCm","19HQpXH0qGIaB1LGGyc9SXSy2D7AIkSuU","1wCYUYj0h8KEM94u97haJ3IONK5D79qJl","1OVmOjFu5XSpTJtvLJbDLV-kznBeLBRpy","11jJx2c4facoqIR0tXTszuKa3-aWd-LHq","1B_jC6Uryt4NZ-FUA8AGjiwBYWdOhJZY2","1Ypp9lGsBs2lGs_b9RGOqF9HqfeFKGo1a","1lYu0DBJGDm8zrwX6UiGi5RPRqh4e2Q3S","1R-wnlX4XSyDs5-COZ_UM3jGC7tpxBlC7","1KmcAeJqIjPok1Md9e0KHAq8xCOmKvlTM","13zdgrW10CE5qZFRy0dVIUfDES5uo3ROL","10QHXEtJU1Dwy65M0Xy4Jd0Dw_4h1TCUm","13-4LIKMurR0NNUJZ8M2n6hu_I2xwPhPv","1jbvvQynZDlDvPHK3TF69vl7S3Y5oGLy_","1eIBnhvK2YyPEwnJ26Vl-ymW_CoWiSFTa","1CC96dbRvc8v7iz_qwJ_0JMnL9Ljo9v5P","1dj51tZxxCi0pn9BDIKggmiwqvEVYcVic","1ARtBd4CXkno4RxL_-c-JoGG4uXGZPiia","1jqktd54KNh44zt-5E6MQgGu44mFZpAeW","1bUYJejcUQ1eYXLe5QpaWL2e2I4T4V6T0","19Y8NX0URdcC6XseJzWlrhmm0V8WRD5-2","12AnBmzxb34rvMYJFX_PsV19lacywnXbP","1aZ24zU8CZzpc03oeeejkFN_dAldlI6UC","1d16eziQDDnozhY6cD0hcSL7GKSK3fVTW","1hT0XbIdtWQpYboGXDHPyZGWu3AqJCokz","1-wDWE6jFE8-78fM6dufB2QOtzGBYagH9","1z5uNHE-kIgmr42nB_luAjMmbAVHy4Mv9","1T3m8y3xXklUG-rmVlLjo_Or1O7BGQd7p","1E-Inq-bn0_yTy7-OFfBx7GFQPNJHDuGE","13ZmGh3QipmJoz8qgLk-CbYqaV8UQbAln"],
  "Multiple Throw": ["1CBhtOndNCMiLTGJtwrm8SYSnwRiT4LQo","1q-Dox0qfFYmMApWa2Ys92I7He6W0AgL_","1rMTGko-AZ1w7j1OA4-M0Mc9DVxXAs85x","1uafff27QYipYIyEr89yrairyV1W0_yUX","164sOl8PmgJy5ZYpIA_gBCaR2Z7wPC4wB","1Wkd64cfN1plYHP1V87rNajSBzn1DYw-0","1_MfcTyKGRmdD0C-00iXwZSJPn1WPmFbZ","1soSI-bAF1XHOXYQMPA2c7XoigEELY1pb","1Dhbn_CRNES7ogxR1SZxILtpJ_7CoCy-e","1hSREe8abt7RVBMK6DkYBjvZVBt5P41tp","1IzEQJA4c3Lsundkv0YCcyYqDS1GUhML9","1wJ5G8hgL6yhXTA9Zr4HdJ2p74KStCEPi","1Fb1kYAHI57MTw2kKeVHKJHOrBeYV3PEL","1YXUMUT00kMC-oEz9a6eEVAIXgROEP5uc","1boWrKAC_aOW6TBMbGzAL0E18x0EYpm-G","150O-mypBU7559pXK_UJW3rWANJmW9qbo","1DIAiaY9Nvzbeh--0BrgndqQGmHlF1skF","1WQ0JLRa564BKZMue8l18GjkVCFgqIqm1","1bp0PMsvg-Bc-YmVxCywT64AdEHFxC2vW","1fygv9XMFpDZV9PTNrwv79xHhVdO_Q7v0","1ls5_SRbDsSRVt04W8P_NogKsUgYdxSvY","1S3CZdC-hAYUsa-T4ZrcvCC0oECfMjNTJ","1WzpwO8oHp3EpsuPEL65eBtUKcG9AcXYL","1MAhgJJUXt-M5o2fpNLVgNBROxwjBzzY1","1Y0wjztZPS54Gx6aZ6Mh6yFRrweGzdfhI","1ozm3dzM2LGbpgQxvtKLyRiqUINP7mef-","1dNrvMkPmlSj4n_m6tqXRLpizvIAbn5MY","13tp0PqM8kH7DYG0xTwCdV6-xI99SRcfS","1-kFH2LQ7PdJ1-QwZlh_FIxwd1qnOpOVc","1L5fQRKypx-2jMc7YgcaDKiDOZ7W2zx3b","1_1-wiDu5x36QQ2jr0SUKRGzCJS6ZAUcb","1pKccFQcDDMVVsRrL-1Jl1hdyJpNRPK5N","1_-LeYOlnoWxY1xP9SOqUq9yWathBTgvL","1d7pwRMofShPGNhcyuHV6YoMpigZdFoa4","1wzVMY9ID8UEZTbDKbk8zbIW0JjINi2Tk","1wBnyqCSv5lkcLahy3DBFAUdoO0x4WUK0","16fIg3KkVmJq04NfTsAh2ft2pYBxyEEhI","1kLrC16vkTbYZecnUS9VNbyEk_DgplJYg","1vfNbegAMnznL-Vsj8Xbvm-JLi_yDIgPr","11fG0zok0nsmjQ4Lh-h1aesDXs9-oGds4","1fp0lmMUFd9u77WD5qgS-3H4X-bWvAnZ0","1EGQIbpwPNwXYhqjnKhk362rfqLly4k9F","1uU1bpxj2W8FqYytSbTYwgT95250l-Hcc"],
  "Mobility Extra / Linked": ["1cWg4mQ7OoFy-YuVxwrE3LUr4zeJuUEvh","1G_mk5elWNbWmTzXBDGTETAqAz_-fMkvZ","1314sgcLBkGRdOJ8AEOO_nmL2VsDFvicx","1fOvDUT4wtuGK5qA6OYNO1iDyexrPxlcM"],
  "z-misc": ["1LXf8B0cQLkghy7kgJVlqhPwQ3Eke1rWo","1c0XWDR4TyGK6FhxmVZZR5GCcNHp5dggv","1sqvr0qh5OBBYKlG1PF3vJ1MstZTfBrws"],
};
// folder ids (the first entry of each array) to skip
const FOLDER_IDS = new Set(Object.values(FOLDERS).map(a => a[0]));

const slug = s => String(s).toLowerCase().replace(/\.(mov|mp4|gif)$/i,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || "clip";
function parseName(cd, id) {
  if (!cd) return `${id}.MOV`;
  let m = /filename\*=UTF-8''([^;]+)/i.exec(cd); if (m) return decodeURIComponent(m[1]);
  m = /filename="?([^";]+)"?/i.exec(cd); return m ? m[1] : `${id}.MOV`;
}

let done = existsSync(DONE_PATH) ? JSON.parse(readFileSync(DONE_PATH, "utf8")) : [];
let manifest = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) : [];
const doneSet = new Set(done);
const seenNames = new Set(manifest.map(m => m.base));

// ensure bucket
const { data: buckets } = await sb.storage.listBuckets();
if (!buckets?.some(b => b.name === BUCKET)) {
  await sb.storage.createBucket(BUCKET, { public: true, fileSizeLimit: "50MB" });
  console.log(`created bucket ${BUCKET}`);
}

const allIds = [];
for (const [cat, ids] of Object.entries(FOLDERS)) for (const id of ids) if (!FOLDER_IDS.has(id)) allIds.push({ id, cat });
// dedup by id (first category wins)
const byId = new Map(); for (const x of allIds) if (!byId.has(x.id)) byId.set(x.id, x.cat);
const work = [...byId.entries()];
console.log(`Total unique file ids to process: ${work.length}; already done: ${doneSet.size}`);

let ok = 0, skip = 0, fail = 0;
for (let i = 0; i < work.length; i++) {
  const [id, cat] = work[i];
  if (doneSet.has(id)) { skip++; continue; }
  try {
    const res = await fetch(`https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`, { headers: { "User-Agent": "Mozilla/5.0" } });
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("text/html") || buf.length < 10000) { console.log(`[${i+1}/${work.length}] SKIP non-video ${id} (${ct},${buf.length}b)`); fail++; continue; }
    const origName = parseName(res.headers.get("content-disposition"), id);
    const base = slug(origName);
    if (seenNames.has(base)) { console.log(`[${i+1}/${work.length}] dup name ${base}, skip`); doneSet.add(id); done.push(id); continue; }
    const movPath = join(DIR, "mov", `${base}.mov`);
    const mp4Name = `${base}.mp4`;
    const mp4Path = join(DIR, "mp4", mp4Name);
    writeFileSync(movPath, buf);
    execFileSync(FFMPEG, ["-y","-i",movPath,"-vf","scale='min(640,iw)':-2","-c:v","libx264","-crf","28","-preset","veryfast","-an","-movflags","+faststart",mp4Path], { stdio: "ignore" });
    const mp4Size = statSync(mp4Path).size;
    const up = await sb.storage.from(BUCKET).upload(mp4Name, readFileSync(mp4Path), { contentType: "video/mp4", upsert: true });
    if (up.error) throw up.error;
    manifest.push({ id, category: cat, origName, base, mp4Name, mp4Size });
    seenNames.add(base); doneSet.add(id); done.push(id);
    writeFileSync(DONE_PATH, JSON.stringify(done)); writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    ok++;
    console.log(`[${i+1}/${work.length}] ${cat} | ${origName} -> ${mp4Name} (${(mp4Size/1e6).toFixed(2)}MB)`);
  } catch (e) { console.log(`[${i+1}/${work.length}] ERROR ${id}: ${e.message}`); fail++; }
}
console.log(`\nBATCH DONE: uploaded ${ok}, skipped ${skip}, failed/non-video ${fail}. Manifest has ${manifest.length} clips.`);
