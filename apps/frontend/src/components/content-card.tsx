import { ArrowRightIcon, ExternalLinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type Target =
	/** In-site page → react-router <Link>, no full page reload */
	| { to: string; href?: never }
	/** Another website → plain <a>, opens in a new tab */
	| { href: string; to?: never };

/** A clickable card (button-like) with a title + description. */
export function ContentCard({
	title,
	description,
	className,
	...target
}: {
	title: string;
	description?: string;
	className?: string;
} & Target) {
	const external = target.href !== undefined;
	const Icon = external ? ExternalLinkIcon : ArrowRightIcon;

	const classes = cn(
		"group flex items-start justify-between gap-4 rounded-2xl border bg-card p-4 text-left text-card-foreground shadow-sm transition-all",
		"hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md",
		"focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
		className,
	);

	const body = (
		<>
			<span className="min-w-0">
				<span className="block font-semibold">{title}</span>
				{description && (
					<span className="mt-1 line-clamp-3 block text-sm text-muted-foreground">
						{description}
					</span>
				)}
			</span>
			<Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
		</>
	);

	return external ? (
		<a href={target.href} target="_blank" rel="noopener noreferrer" className={classes}>
			{body}
		</a>
	) : (
		<Link to={target.to!} className={classes}>
			{body}
		</Link>
	);
}
