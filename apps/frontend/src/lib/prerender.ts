/**
 * The production index.html contains a static copy of the landing page (#prerender, made by
 * scripts/prerender.mjs) so it shows before the JavaScript runs. Remove it once React draws a
 * real page: when the landing page mounts, or when the app is on any other URL.
 */
export function removePrerender() {
	document.getElementById("prerender")?.remove();
}
