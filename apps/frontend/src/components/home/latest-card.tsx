import { Link } from "react-router-dom";
import { ArrowRightIcon, ExternalLinkIcon, type LucideIcon } from "lucide-react";
import type { ContentSummary, ContentType } from "@raudevweb/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { useContent } from "@/components/content-list";
import { CONTENT } from "@/lib/content";

const LINK_CLASS = "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted";

/** /home: "Latest <type>" card with the newest few items and a "View all" link. */
export function LatestCard({ type, icon: Icon, limit = 3 }: { type: ContentType; icon: LucideIcon; limit?: number }) {
	const cfg = CONTENT[type];
	const { data, error } = useContent<ContentSummary[]>(`${type}?limit=${limit}`);

	return (
		<section className="flex flex-col rounded-2xl border bg-card p-4 text-card-foreground shadow-sm">
			<h3 className="mb-2 flex items-center gap-2 font-semibold">
				<Icon className="size-4 text-primary" />
				Latest {cfg.label.toLowerCase()}
			</h3>

			<div className="flex-1">
				{error ? (
					<p className="text-sm text-destructive">{error}</p>
				) : !data ? (
					<div className="space-y-2">
						{Array.from({ length: limit }, (_, i) => (
							<Skeleton key={i} className="h-7" />
						))}
					</div>
				) : data.length === 0 ? (
					<p className="px-2 text-sm text-muted-foreground">Nothing yet.</p>
				) : (
					<ul>
						{data.map((item) => (
							<li key={item.id}>
								{cfg.external && item.href ? (
									<a href={item.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
										<span className="truncate">{item.title}</span>
										<ExternalLinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
									</a>
								) : (
									<Link to={`/home/${cfg.route}/${item.id}`} className={LINK_CLASS}>
										<span className="truncate">{item.title}</span>
										<ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
									</Link>
								)}
							</li>
						))}
					</ul>
				)}
			</div>

			<Link to={`/home/${cfg.route}`} className="mt-3 px-2 text-sm font-medium text-primary hover:underline">
				View all {cfg.label.toLowerCase()} →
			</Link>
		</section>
	);
}
