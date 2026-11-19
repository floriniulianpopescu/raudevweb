import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { ContentSummary, ContentType } from "@raudevweb/shared";
import { contentApi, isNotFound } from "@/lib/admin-api";
import { CONTENT } from "@/lib/content";
import { queryKeys, useCachedQuery } from "@/lib/query-client";
import { matchesSearch } from "@/lib/search";
import { AdminContentPanel } from "./admin/lazy";
import { ContentCard } from "./content-card";
import { LoadError } from "./load-error";
import { NotFoundView } from "./not-found";
import { PageTitle } from "./page-title";
import { SearchInput } from "./search-input";
import { Skeleton } from "./ui/skeleton";

/**
 * Fetch something from /api/content/<path>, through the shared cache: a page seen before
 * shows instantly and refreshes in the background.
 * `error` is only set when there's nothing to show (a failed background refresh keeps the cached data).
 * `retry()` shows the loading state again and refetches. `notFound` is true when the API answered 404.
 */
export function useContent<T>(path: string) {
	const query = useCachedQuery(queryKeys.content(path), () => contentApi<T>(path));
	return { ...query, notFound: isNotFound(query.error) };
}

/** Problems/exercises → external href; everything else → in-site page via <Link>. */
function cardTarget(type: ContentType, item: ContentSummary) {
	const cfg = CONTENT[type];
	return cfg.external && item.href ? { href: item.href } : { to: `/home/${cfg.route}/${item.id}` };
}

/** Grid of cards; children render once data is loaded. */
export function CardGrid({ children }: { children: ReactNode }) {
	return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

export function CardGridSkeleton() {
	return (
		<CardGrid>
			{Array.from({ length: 3 }, (_, i) => (
				<Skeleton key={i} className="h-24 rounded-2xl" />
			))}
		</CardGrid>
	);
}

/** Page: heading + grid of ContentCards for one content type. */
export function ContentList({
	type,
	intro,
	notice,
}: {
	type: ContentType;
	intro?: string;
	/** Optional element shown right below the search bar */
	notice?: ReactNode;
}) {
	const { data: items, error, retry } = useContent<ContentSummary[]>(type);
	const [query, setQuery] = useState("");
	const label = CONTENT[type].label;

	const visible = useMemo(
		() => items?.filter((i) => matchesSearch(query, i.title, i.description)) ?? null,
		[items, query],
	);

	return (
		<div>
			<PageTitle title={label} />
			<h1 className="text-2xl font-bold">{label}</h1>
			{intro && <p className="text-muted-foreground mt-2">{intro}</p>}

			<AdminContentPanel type={type} />

			<SearchInput
				className="mt-6 max-w-md"
				placeholder={`Search ${label.toLowerCase()}`}
				value={query}
				onChange={setQuery}
			/>

			{notice}

			<div className="mt-6">
				{error ? (
					<LoadError onRetry={retry} />
				) : items === null || visible === null ? (
					<CardGridSkeleton />
				) : items.length === 0 ? (
					<p className="text-sm text-muted-foreground">Nothing here yet.</p>
				) : visible.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No {label.toLowerCase()} match "{query}".
					</p>
				) : (
					<CardGrid>
						{visible.map((item) => (
							<ContentCard
								key={item.id}
								title={item.title}
								description={item.description}
								{...cardTarget(type, item)}
							/>
						))}
					</CardGrid>
				)}
			</div>
		</div>
	);
}

/**
 * Shared frame for in-site detail pages: back link, loading/error, title + description.
 * Pass the result of useContent(); a 404 shows the "Page not found" view.
 */
export function DetailLayout<T extends { title: string; description: string }>({
	type,
	content: { data, error, notFound, retry },
	children,
}: {
	type: ContentType;
	content: Pick<ReturnType<typeof useContent<T>>, "data" | "error" | "notFound" | "retry">;
	children: (data: T) => ReactNode;
}) {
	const cfg = CONTENT[type];
	if (notFound) {
		return <NotFoundView backTo={`/home/${cfg.route}`} backLabel={`Back to ${cfg.label}`} />;
	}
	return (
		<div>
			{/* Section name while loading or on error, then the item's own title */}
			<PageTitle title={data?.title ?? cfg.label} />
			<Link to={`/home/${cfg.route}`} className="text-sm text-muted-foreground hover:underline">
				← Back to {cfg.label}
			</Link>
			{error ? (
				<LoadError className="mt-4" onRetry={retry} />
			) : !data ? (
				<Skeleton className="mt-4 h-24" />
			) : (
				<>
					<h1 className="mt-4 text-2xl font-bold">{data.title}</h1>
					{data.description && (
						<p className="text-muted-foreground mt-2 whitespace-pre-wrap">{data.description}</p>
					)}
					<div className="mt-8 space-y-8">{children(data)}</div>
				</>
			)}
		</div>
	);
}
