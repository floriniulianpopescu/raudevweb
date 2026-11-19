import { lazy, type ComponentType } from "react";

const RELOADED_AT_KEY = "chunk-reload-at";
/** At most one automatic reload in this window, so a file that is really gone can't cause a reload loop. */
const RELOAD_WINDOW_MS = 10_000;

/**
 * React.lazy for a named export: `lazyPage(() => import("./x"), "X")`.
 *
 * After a deploy, an open tab may ask for a code file that no longer exists. When that
 * happens (and we're online), reload once so the browser fetches the new version. If it
 * fails again right after that reload, or we're offline, the route's error page is shown.
 */
export function lazyPage<M extends Record<string, unknown>, K extends keyof M>(load: () => Promise<M>, name: K) {
	return lazy(async () => {
		try {
			return { default: (await load())[name] as ComponentType<any> };
		} catch (err) {
			if (navigator.onLine && !reloadedRecently()) {
				rememberReload();
				window.location.reload();
				return new Promise<never>(() => {}); // keep showing the fallback until the reload
			}
			throw err;
		}
	}) as unknown as M[K];
}

function reloadedRecently() {
	try {
		return Date.now() - Number(sessionStorage.getItem(RELOADED_AT_KEY) ?? 0) < RELOAD_WINDOW_MS;
	} catch {
		return true; // storage blocked: can't remember the reload, so don't risk a loop
	}
}

function rememberReload() {
	try {
		sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
	} catch {
		/* ignore */
	}
}
