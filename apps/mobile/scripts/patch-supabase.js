#!/usr/bin/env node
/**
 * Patch @supabase/supabase-js pour supprimer le dynamic import OTEL
 * incompatible avec Hermes (moteur JS Android/iOS de React Native).
 */
const fs = require("fs");
const path = require("path");

const filePath = path.resolve(
  __dirname,
  "../node_modules/@supabase/supabase-js/dist/index.mjs"
);

if (!fs.existsSync(filePath)) {
  console.log("patch-supabase: file not found, skipping.");
  process.exit(0);
}

let content = fs.readFileSync(filePath, "utf8");

const before = `import(/* webpackIgnore: true */ /* turbopackIgnore: true */ /* @vite-ignore */ OTEL_PKG).catch(() => null)`;
const after = `Promise.resolve(null) /* patched for Hermes */`;

if (content.includes(before)) {
  content = content.replace(before, after);
  fs.writeFileSync(filePath, content, "utf8");
  console.log("patch-supabase: OTEL dynamic import patched successfully.");
} else if (content.includes(after)) {
  console.log("patch-supabase: already patched.");
} else {
  console.log("patch-supabase: pattern not found, may have changed.");
}
