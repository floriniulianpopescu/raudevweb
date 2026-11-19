/**
 * Sets the browser tab title to "<title> · RAUDEV" (or just "RAUDEV").
 * React 19 hoists <title> into <head> from anywhere in the tree.
 */
export function PageTitle({ title }: { title?: string }) {
	return <title>{title ? `${title} · RAUDEV` : "RAUDEV"}</title>;
}
