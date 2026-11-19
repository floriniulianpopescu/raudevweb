import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
	InfoIcon,
	LightbulbIcon,
	MessageSquareWarningIcon,
	OctagonAlertIcon,
	PencilLineIcon,
	TriangleAlertIcon,
	type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";

// --- GitHub-style callouts: "> [!TIP]", plus our own "> [!TRY]" for exercises in lessons ---

type HastNode = {
	type: string;
	tagName?: string;
	value?: string;
	properties?: Record<string, unknown>;
	children?: HastNode[];
};

const CALLOUT = /^\[!(note|tip|important|warning|caution|try)\][ \t]*\n?/i;

/** Turns a blockquote starting with [!TIP] (etc.) into <blockquote data-callout="tip">. */
function rehypeCallouts() {
	const visit = (node: HastNode) => {
		node.children?.forEach(visit);
		if (node.tagName !== "blockquote") return;
		const first = node.children?.find((c) => c.type === "element");
		const text = first?.tagName === "p" ? first.children?.[0] : undefined;
		const match = text?.type === "text" ? CALLOUT.exec(text.value ?? "") : null;
		if (!first || !text || !match) return;
		text.value = text.value!.slice(match[0].length);
		// Drop the paragraph if the marker was all it had ("> [!TIP]" on its own line)
		if (!text.value && first.children!.length === 1) node.children = node.children!.filter((c) => c !== first);
		else if (!text.value) first.children!.shift();
		// A soft line break after the marker leaves a leading <br>
		if (first.children?.[0]?.tagName === "br") first.children.shift();
		node.properties = { ...node.properties, dataCallout: match[1].toLowerCase() };
	};
	return (tree: HastNode) => visit(tree);
}

const CALLOUTS: Record<string, { label: string; icon: LucideIcon; className: string }> = {
	note: { label: "Note", icon: InfoIcon, className: "border-blue-500/50 bg-blue-500/5 [&_.callout-title]:text-blue-600 dark:[&_.callout-title]:text-blue-400" },
	tip: { label: "Tip", icon: LightbulbIcon, className: "border-green-600/50 bg-green-600/5 [&_.callout-title]:text-green-700 dark:[&_.callout-title]:text-green-400" },
	important: { label: "Important", icon: MessageSquareWarningIcon, className: "border-violet-500/50 bg-violet-500/5 [&_.callout-title]:text-violet-600 dark:[&_.callout-title]:text-violet-400" },
	warning: { label: "Warning", icon: TriangleAlertIcon, className: "border-amber-500/60 bg-amber-500/5 [&_.callout-title]:text-amber-700 dark:[&_.callout-title]:text-amber-400" },
	try: { label: "Try it", icon: PencilLineIcon, className: "border-primary/50 bg-primary/5 [&_.callout-title]:text-primary dark:[&_.callout-title]:text-sidebar-primary" },
	caution: { label: "Caution", icon: OctagonAlertIcon, className: "border-destructive/50 bg-destructive/5 [&_.callout-title]:text-destructive" },
};

// --- element styles -------------------------------------------------------------

/** Plain text of a hast subtree (the source of a code block). */
const textOf = (node: HastNode | undefined): string =>
	node?.type === "text" ? (node.value ?? "") : (node?.children ?? []).map(textOf).join("");

const block = "mt-4 first:mt-0";

/** react-markdown passes its syntax-tree `node` to every component; keep it off the DOM. */
function withoutNode<P extends { node?: unknown }>(props: P): Omit<P, "node"> {
	const { node, ...rest } = props;
	void node;
	return rest;
}

const components: Components = {
	// The page title is the only <h1>, so Markdown headings start at <h2>
	h1: (p) => <h2 className="mt-10 mb-3 scroll-mt-20 text-xl font-bold first:mt-0" {...withoutNode(p)} />,
	h2: (p) => <h2 className="mt-10 mb-3 scroll-mt-20 text-xl font-bold first:mt-0" {...withoutNode(p)} />,
	h3: (p) => <h3 className="mt-8 mb-2 text-lg font-semibold first:mt-0" {...withoutNode(p)} />,
	h4: (p) => <h4 className="mt-6 mb-2 font-semibold first:mt-0" {...withoutNode(p)} />,
	h5: (p) => <h4 className="mt-6 mb-2 font-semibold first:mt-0" {...withoutNode(p)} />,
	h6: (p) => <h4 className="mt-6 mb-2 font-semibold first:mt-0" {...withoutNode(p)} />,
	p: (p) => <p className={cn(block, "leading-7")} {...withoutNode(p)} />,
	ul: ({ className, ...p }) => (
		<ul
			className={cn(block, "list-disc space-y-1 pl-6 leading-7", className === "contains-task-list" && "list-none pl-1")}
			{...withoutNode(p)}
		/>
	),
	ol: (p) => <ol className={cn(block, "list-decimal space-y-1 pl-6 leading-7")} {...withoutNode(p)} />,
	li: (p) => <li className="pl-1 [&>ol]:mt-1 [&>p]:mt-1 [&>ul]:mt-1" {...withoutNode(p)} />,
	hr: () => <hr className="my-8 border-border" />,
	a: ({ href, ...p }) => {
		const external = !!href && /^https?:\/\//.test(href);
		return (
			<a
				href={href}
				// --primary is a dark teal in dark mode; the sidebar's teal stays readable on dark backgrounds
				className="font-medium text-primary underline underline-offset-4 hover:no-underline dark:text-sidebar-primary"
				{...(external && { target: "_blank", rel: "noreferrer" })}
				{...withoutNode(p)}
			/>
		);
	},
	// No image hosting: show images as a link to the picture instead
	img: ({ src, alt }) =>
		typeof src === "string" && src ? (
			<a
				href={src}
				target="_blank"
				rel="noreferrer"
				className="text-primary underline underline-offset-4 dark:text-sidebar-primary"
			>
				{alt || src}
			</a>
		) : null,
	code: ({ className, ...p }) => (
		<code className={cn("rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.875em]", className)} {...withoutNode(p)} />
	),
	pre: ({ node }) => {
		const code = (node as HastNode | undefined)?.children?.find((c) => c.tagName === "code");
		const classes = (code?.properties?.className as string[] | undefined) ?? [];
		const lang = classes.find((c) => c.startsWith("language-"))?.slice("language-".length) ?? "";
		return <CodeBlock code={textOf(code).replace(/\n$/, "")} lang={lang} />;
	},
	blockquote: ({ children, ...p }) => {
		const kind = (p as Record<string, unknown>)["data-callout"] as string | undefined;
		const callout = kind ? CALLOUTS[kind] : undefined;
		if (!callout) {
			return (
				<blockquote className={cn(block, "border-l-4 pl-4 text-muted-foreground italic")}>{children}</blockquote>
			);
		}
		const Icon = callout.icon;
		return (
			<aside className={cn(block, "rounded-xl border-l-4 px-4 py-3", callout.className)}>
				<p className="callout-title flex items-center gap-2 text-sm font-semibold">
					<Icon className="size-4" /> {callout.label}
				</p>
				<div className="mt-1 [&>*:first-child]:mt-0 [&>p]:mt-2">{children}</div>
			</aside>
		);
	},
	table: (p) => (
		<div className={cn(block, "overflow-x-auto rounded-xl border")}>
			<table className="w-full text-sm" {...withoutNode(p)} />
		</div>
	),
	thead: (p) => <thead className="bg-muted/60" {...withoutNode(p)} />,
	tr: (p) => <tr className="border-b last:border-0" {...withoutNode(p)} />,
	th: ({ style, ...p }) => (
		<th className="px-3 py-2 text-left font-semibold" style={style} {...withoutNode(p)} />
	),
	td: ({ style, ...p }) => <td className="px-3 py-2 align-top" style={style} {...withoutNode(p)} />,
};

/**
 * Renders a lesson/extra body written in Markdown (GFM: tables, task lists,
 * footnotes) plus GitHub-style callouts. Raw HTML in the source is ignored.
 */
export default function Markdown({ children, className }: { children: string; className?: string }) {
	return (
		<div className={cn("min-w-0 break-words", className)}>
			<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeCallouts]} components={components} skipHtml>
				{children}
			</ReactMarkdown>
		</div>
	);
}
