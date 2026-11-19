import type { ReactNode } from "react";
import { ArrowRightIcon, ExternalLinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type Target =
	/** In-site page → react-router <Link>, no full page reload */
	| { to: string; href?: never }
	/** Another website → plain <a>, opens in a new tab */
	| { href: string; to?: never };

const CARD = cn(
	"rounded-2xl border bg-card text-card-foreground shadow-sm transition-all",
	"hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md",
);
const LINK = cn(
	"group flex items-start justify-between gap-4 p-4 text-left",
	"focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

/**
 * A clickable card (button-like) with a title + description.
 * `badge` sits next to the title; `footer` is a row under the link (e.g. a "done" check),
 * kept outside the link so clicking it doesn't open the page.
 */
export function ContentCard({
	title,
	description,
	badge,
	footer,
	className,
	...target
}: {
	title: string;
	description?: string;
	badge?: ReactNode;
	footer?: ReactNode;
	className?: string;
} & Target) {
	const external = target.href !== undefined;
	const Icon = external ? ExternalLinkIcon : ArrowRightIcon;

	const body = (
		<>
			<span className="min-w-0">
				<span className="flex flex-wrap items-center gap-x-2 gap-y-1">
					<span className="font-semibold">{title}</span>
					{badge}
				</span>
				{description && (
					<span className="mt-1 line-clamp-3 block text-sm text-muted-foreground">
						{description}
					</span>
				)}
			</span>
			<Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
		</>
	);

	const link = (linkClass: string) =>
		external ? (
			<a href={target.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
				{body}
			</a>
		) : (
			<Link to={target.to!} className={linkClass}>
				{body}
			</Link>
		);

	if (!footer) return link(cn(CARD, LINK, className));

	return (
		<div className={cn(CARD, "flex flex-col", className)}>
			{link(cn(LINK, "flex-1 rounded-t-2xl"))}
			<div className="border-t px-4 py-2">{footer}</div>
		</div>
	);
}
