import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Cloudflare Pages serves at the domain root (base "/"); it sets CF_PAGES=1 in
// its build env. GitHub Pages serves under /curtis-app/. This picks the right
// base automatically for each.
export default defineConfig({
  base: process.env.CF_PAGES ? "/" : "/curtis-app/",
  plugins: [react()],
});
