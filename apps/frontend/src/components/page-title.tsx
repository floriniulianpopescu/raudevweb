import { useEffect } from "react";

/**
 * Sets the browser tab title to "<title> · RAUDEV" (or just "RAUDEV").
 * Sets document.title instead of rendering <title>, so the fallback <title> in index.html
 * isn't duplicated (React 19 would add a second <title> element).
 */
export function PageTitle({ title }: { title?: string }) {
	const full = title ? `${title} · RAUDEV` : "RAUDEV";
	useEffect(() => {
		document.title = full;
	}, [full]);
	return null;
}
