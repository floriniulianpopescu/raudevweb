// Runs after `vite build`: renders the landing page (src/entry-prerender.tsx) and puts the
// HTML into dist/index.html as <div id="prerender">. The app removes it once React has drawn
// the real page (src/lib/prerender.ts); index.html hides it on every URL other than "/".
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "vite";

const root = path.resolve(import.meta.dirname, "..");
const ssrDir = path.join(root, "dist-ssr");
const indexFile = path.join(root, "dist", "index.html");

await build({
	root,
	logLevel: "warn",
	build: { ssr: "src/entry-prerender.tsx", outDir: ssrDir, emptyOutDir: true },
});

const { render } = await import(pathToFileURL(path.join(ssrDir, "entry-prerender.js")).href);
const html = render();
const index = fs.readFileSync(indexFile, "utf8");
if (!index.includes("<!--prerender-->")) throw new Error("dist/index.html has no <!--prerender--> marker");
fs.writeFileSync(indexFile, index.replace("<!--prerender-->", `<div id="prerender">${html}</div>`));
fs.rmSync(ssrDir, { recursive: true, force: true });
console.log(`prerendered / into dist/index.html (${(html.length / 1024).toFixed(1)} kB of HTML)`);
