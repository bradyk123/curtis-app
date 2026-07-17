// Proposes cleaned display names for video clips and emits SQL for the
// high-confidence renames only. Opaque names, junk clips, and person-name
// suffixes are printed for human review (not auto-changed).
//
// Usage: node scripts/clean_video_names.mjs   (writes supabase/videos_rename.sql)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Current clips (slug → name), pulled live from the videos table.
const clips = [
  ["img-3195", "Img 3195"], ["db-alt-toe-touch", "Db Alt Toe Touch"], ["db-curl", "Db Curl"],
  ["db-curl-attmpt", "Db Curl Attmpt"], ["l-ups", "L Ups"], ["l-ups-2", "L Ups 2"],
  ["pull-ups", "Pull Ups"], ["russian-twists-oh", "Russian Twists Oh"],
  ["russian-twists-seated-slr", "Russian Twists Seated Slr"], ["seated-bnp", "Seated Bnp"],
  ["ss-hamstring-curl", "Ss Hamstring Curl"], ["standing-lateral-flys", "Standing Lateral Flys"],
  ["supine-flys", "Supine Flys"], ["maddy", "Maddy"], ["mike-jacky", "Mike Jacky"],
  ["clam-shells-maddy", "Clam Shells Maddy"], ["bike-maddy", "Bike Maddy"],
  ["alt-box-stepups", "Alt Box Stepups"], ["box-step-ups", "Box Step Ups"],
  ["boxbox-jump", "Boxbox Jump"], ["boxboxhurdle", "Boxboxhurdle"], ["boxboxjump", "Boxboxjump"],
  ["bx-hurdle-5", "Bx Hurdle 5"], ["bxbxjmp", "Bxbxjmp"], ["bxbxjump", "Bxbxjump"],
  ["bxhrdle", "Bxhrdle"], ["dlb-lateral-hops", "Dlb Lateral Hops"], ["sl-butt-kicks", "Sl Butt Kicks"],
  ["spd-skaters-dbl-hops-pogo", "Spd Skaters Dbl Hops Pogo"], ["muscle-ups", "Muscle Ups"],
  ["mbvups", "Mbvups"], ["blf-mb", "Blf Mb"], ["chstp-mbgm", "Chstp Mbgm"],
  ["hammer-hip-c-t", "Hammer Hip C T"], ["hammer-hip-evan", "Hammer Hip Evan"],
  ["hammer-hip-l", "Hammer Hip L"], ["hammer-hip-r", "Hammer Hip R"], ["hip-catch-toss", "Hip Catch Toss"],
  ["hurdle-reach-jacky", "Hurdle Reach Jacky"], ["hurdle-reach-jacky-2", "Hurdle Reach Jacky 2"],
  ["lateral-hip-c-t", "Lateral Hip C T"], ["lateral-hip-c-t2", "Lateral Hip C T2"],
  ["lateral-shoulder-c-t", "Lateral Shoulder C T"], ["mb-between-leg-fwd", "Mb Between Leg Fwd"],
  ["mb-btwn-leg-fwd", "Mb Btwn Leg Fwd"], ["mb-good-morning", "Mb Good Morning"],
  ["mb-good-mornings", "Mb Good Mornings"], ["mb-rotations-solo-jacky", "Mb Rotations Solo Jacky"],
  ["ohf-hammerhip", "Ohf Hammerhip"], ["ohf-maddy-mark", "Ohf Maddy Mark"],
  ["overhead-back-evan", "Overhead Back Evan"], ["overhead-back-flat", "Overhead Back Flat"],
  ["overhead-back-shot", "Overhead Back Shot"],
  ["overheadfwd-hiptoss-reachandhike", "Overheadfwd Hiptoss Reachandhike"],
  ["prone-ct-prone-ohb", "Prone Ct Prone Ohb"], ["soccersweeps-mb-leg-toss", "Soccersweeps Mb Leg Toss"],
  ["standing-chest-c-t", "Standing Chest C T"], ["standing-hip-c-t", "Standing Hip C T"],
  ["standing-oh-forward", "Standing Oh Forward"], ["standing-oh-fwd", "Standing Oh Fwd"],
  ["tank", "Tank"], ["torsocircles2", "Torsocircles2"], ["v-ups-jacky", "V Ups Jacky"],
  ["erinphotobomb", "Erinphotobomb"], ["maddy-gym-entrance", "Maddy Gym Entrance"],
];

// Clips that aren't real exercises → recommend hiding, not renaming.
const JUNK = new Set(["img-3195", "erinphotobomb", "maddy-gym-entrance", "db-curl-attmpt"]);
// Genuinely opaque → need Curtis to name.
const OPAQUE = new Set(["seated-bnp", "ss-hamstring-curl", "blf-mb", "chstp-mbgm", "maddy", "mike-jacky", "tank", "ohf-maddy-mark"]);

// High-confidence explicit renames (slug → new name).
const RENAME = {
  "db-alt-toe-touch": "Dumbbell Alternating Toe Touch",
  "db-curl": "Dumbbell Curl",
  "l-ups": "L-Ups", "l-ups-2": "L-Ups 2",
  "pull-ups": "Pull-Ups", "muscle-ups": "Muscle-Ups",
  "russian-twists-oh": "Russian Twists (Overhead)",
  "russian-twists-seated-slr": "Russian Twists — Seated (SLR)",
  "standing-lateral-flys": "Standing Lateral Flies", "supine-flys": "Supine Flies",
  "clam-shells-maddy": "Clam Shells",
  "alt-box-stepups": "Alternating Box Step-Ups", "box-step-ups": "Box Step-Ups",
  "boxbox-jump": "Box-Box Jump", "boxboxjump": "Box-Box Jump", "bxbxjmp": "Box-Box Jump", "bxbxjump": "Box-Box Jump",
  "boxboxhurdle": "Box-Box Hurdle", "bxhrdle": "Box Hurdle", "bx-hurdle-5": "Box Hurdle 5",
  "dlb-lateral-hops": "Double-Leg Lateral Hops", "sl-butt-kicks": "Single-Leg Butt Kicks",
  "spd-skaters-dbl-hops-pogo": "Speed Skaters, Double Hops, Pogo",
  "mbvups": "Medicine Ball V-Ups",
  "hammer-hip-c-t": "Hammer Hip Catch-Toss", "hammer-hip-l": "Hammer Hip (Left)", "hammer-hip-r": "Hammer Hip (Right)",
  "hip-catch-toss": "Hip Catch-Toss",
  "hurdle-reach-jacky": "Hurdle Reach", "hurdle-reach-jacky-2": "Hurdle Reach 2",
  "lateral-hip-c-t": "Lateral Hip Catch-Toss", "lateral-hip-c-t2": "Lateral Hip Catch-Toss 2",
  "lateral-shoulder-c-t": "Lateral Shoulder Catch-Toss",
  "mb-between-leg-fwd": "Medicine Ball Between-Leg Forward", "mb-btwn-leg-fwd": "Medicine Ball Between-Leg Forward",
  "mb-good-morning": "Medicine Ball Good Morning", "mb-good-mornings": "Medicine Ball Good Mornings",
  "mb-rotations-solo-jacky": "Medicine Ball Rotations (Solo)",
  "ohf-hammerhip": "Overhead Forward Hammer Hip",
  "overhead-back-evan": "Overhead Back", "overhead-back-flat": "Overhead Back (Flat)", "overhead-back-shot": "Overhead Back Shot",
  "overheadfwd-hiptoss-reachandhike": "Overhead Forward Hip Toss, Reach & Hike",
  "prone-ct-prone-ohb": "Prone Catch-Toss / Prone Overhead Back",
  "soccersweeps-mb-leg-toss": "Soccer Sweeps, Medicine Ball Leg Toss",
  "standing-chest-c-t": "Standing Chest Catch-Toss", "standing-hip-c-t": "Standing Hip Catch-Toss",
  "standing-oh-forward": "Standing Overhead Forward", "standing-oh-fwd": "Standing Overhead Forward",
  "torsocircles2": "Torso Circles 2", "v-ups-jacky": "V-Ups",
};

const sqlStr = (v) => "'" + String(v).replace(/'/g, "''") + "'";
const lines = [];
for (const [slug, newName] of Object.entries(RENAME)) {
  lines.push(`update videos set name = ${sqlStr(newName)} where slug = ${sqlStr(slug)};`);
}
const sql =
  "-- AUTO-GENERATED by scripts/clean_video_names.mjs — high-confidence clip renames.\n" +
  lines.join("\n") + "\n";
writeFileSync(join(root, "supabase/videos_rename.sql"), sql);

console.log(`Confident renames: ${Object.keys(RENAME).length}`);
console.log(`\nJUNK (recommend hiding, not renaming):`);
clips.filter(([s]) => JUNK.has(s)).forEach(([s, n]) => console.log(`  ${n}  (${s})`));
console.log(`\nOPAQUE (need Curtis to name):`);
clips.filter(([s]) => OPAQUE.has(s)).forEach(([s, n]) => console.log(`  ${n}  (${s})`));
