import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// Commit SHA of the deployed build. Cloudflare Pages exposes CF_PAGES_COMMIT_SHA;
// locally fall back to the current git HEAD.
const sha =
  process.env.CF_PAGES_COMMIT_SHA?.slice(0, 7) ||
  (() => {
    try {
      return execSync("git rev-parse --short HEAD").toString().trim();
    } catch {
      return "dev";
    }
  })();

// Cloudflare Pages serves at the domain root (base "/"); it sets CF_PAGES=1 in
// its build env. GitHub Pages serves under /curtis-app/. This picks the right
// base automatically for each.
export default defineConfig({
  base: process.env.CF_PAGES ? "/" : "/curtis-app/",
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_SHA__: JSON.stringify(sha),
  },
});
