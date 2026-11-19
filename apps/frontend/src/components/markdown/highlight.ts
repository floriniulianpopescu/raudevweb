import type { Highlighter } from "shiki";

const LABELS: Record<string, string> = {
	c: "C",
	cpp: "C++",
	"c++": "C++",
	cs: "C#",
	csharp: "C#",
	java: "Java",
	py: "Python",
	python: "Python",
	js: "JavaScript",
	javascript: "JavaScript",
	ts: "TypeScript",
	typescript: "TypeScript",
	tsx: "TSX",
	jsx: "JSX",
	html: "HTML",
	css: "CSS",
	json: "JSON",
	sql: "SQL",
	sh: "Shell",
	bash: "Shell",
	shell: "Shell",
	console: "Terminal",
	rust: "Rust",
	go: "Go",
	text: "Text",
	txt: "Text",
};

/** Human name shown above a code block ("cpp" → "C++"). */
export function languageLabel(lang: string): string {
	if (!lang) return "Code";
	return LABELS[lang.toLowerCase()] ?? lang;
}

const THEMES = { light: "github-light", dark: "github-dark" } as const;

let highlighter: Promise<Highlighter> | null = null;

/** Shiki is big, so it is only downloaded the first time a code block is shown. */
function getHighlighter() {
	highlighter ??= import("shiki").then(({ createHighlighter, createJavaScriptRegexEngine }) =>
		createHighlighter({
			themes: [THEMES.light, THEMES.dark],
			langs: [],
			// The JS engine avoids downloading Shiki's WebAssembly regex engine
			engine: createJavaScriptRegexEngine(),
		}),
	);
	return highlighter;
}

/**
 * Highlight `code` as HTML with both themes baked in as CSS variables
 * (`--shiki-light` / `--shiki-dark`); index.css picks one based on the theme.
 * Unknown languages are shown as plain text.
 */
export async function highlight(code: string, lang: string): Promise<string> {
	const [hl, { bundledLanguages, bundledLanguagesAlias }] = await Promise.all([getHighlighter(), import("shiki")]);
	const id = lang.toLowerCase();
	const known = id in bundledLanguages || id in bundledLanguagesAlias;
	if (known && !hl.getLoadedLanguages().includes(id)) await hl.loadLanguage(id as never);
	return hl.codeToHtml(code, { lang: known ? id : "text", themes: THEMES, defaultColor: false });
}
