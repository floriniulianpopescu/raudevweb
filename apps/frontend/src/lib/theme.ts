import { useSyncExternalStore } from "react";

/** "system" = follow the OS until the user picks one. Stored in localStorage["theme"]. */
export type ThemePreference = "light" | "dark" | "system";
export type Theme = "light" | "dark";

const KEY = "theme";
const media = () => window.matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
	try {
		const v = localStorage.getItem(KEY);
		return v === "light" || v === "dark" ? v : "system";
	} catch {
		return "system";
	}
}

const resolve = (p: ThemePreference): Theme => (p === "system" ? (media().matches ? "dark" : "light") : p);

function apply() {
	const theme = resolve(readPreference());
	document.documentElement.classList.toggle("dark", theme === "dark");
	document.documentElement.style.colorScheme = theme;
	listeners.forEach((l) => l());
}

export function setTheme(preference: ThemePreference) {
	try {
		if (preference === "system") localStorage.removeItem(KEY);
		else localStorage.setItem(KEY, preference);
	} catch {
		/* private mode: still apply for this page */
	}
	apply();
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	const onSystem = () => readPreference() === "system" && apply();
	// Other tabs changing the theme
	const onStorage = (e: StorageEvent) => e.key === KEY && apply();
	media().addEventListener("change", onSystem);
	window.addEventListener("storage", onStorage);
	return () => {
		listeners.delete(listener);
		media().removeEventListener("change", onSystem);
		window.removeEventListener("storage", onStorage);
	};
}

/** Current resolved theme + setter. */
export function useTheme() {
	const theme = useSyncExternalStore(subscribe, () => resolve(readPreference()));
	return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}
