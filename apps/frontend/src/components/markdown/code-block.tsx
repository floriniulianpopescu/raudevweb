import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { highlight, languageLabel } from "./highlight";

/** Fenced code block: language label, copy button and syntax highlighting (light + dark). */
export function CodeBlock({ code, lang }: { code: string; lang: string }) {
	const [html, setHtml] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		let cancelled = false;
		highlight(code, lang)
			.then((h) => !cancelled && setHtml(h))
			.catch(() => {}); // keep the plain version if highlighting fails
		return () => {
			cancelled = true;
		};
	}, [code, lang]);

	useEffect(() => {
		if (!copied) return;
		const t = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(t);
	}, [copied]);

	async function copy() {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
		} catch {
			// clipboard blocked (e.g. insecure context) — nothing useful to show
		}
	}

	return (
		<figure className="not-first:mt-4 overflow-hidden rounded-xl border bg-muted/40">
			<figcaption className="flex items-center justify-between border-b bg-muted/60 py-1 pr-1 pl-3">
				<span className="text-xs font-medium text-muted-foreground">{languageLabel(lang)}</span>
				<Button
					size="sm"
					variant="ghost"
					className="h-7 gap-1 px-2 text-xs"
					onClick={copy}
					aria-label={copied ? "Copied" : "Copy code"}
				>
					{copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
					{copied ? "Copied" : "Copy"}
				</Button>
			</figcaption>
			{html ? (
				// Shiki escapes the code itself, so this HTML only contains its own <pre>/<span> markup
				<div className="md-code" dangerouslySetInnerHTML={{ __html: html }} />
			) : (
				<div className="md-code">
					<pre>
						<code>{code}</code>
					</pre>
				</div>
			)}
		</figure>
	);
}
