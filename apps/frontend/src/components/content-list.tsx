import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { ContentSummary, ContentType } from "@raudevweb/shared";
import { contentApi } from "@/lib/admin-api";
import { CONTENT } from "@/lib/content";
import { matchesSearch } from "@/lib/search";
import { AdminContentPanel } from "./admin/admin-content-panel";
import { ContentCard } from "./content-card";
import { SearchInput } from "./search-input";
import { Skeleton } from "./ui/skeleton";

/** Fetch something from /api/content/<path>. `reload()` refetches without a loading flash. */
export function useContent<T>(path: string) {
	const [data, setData] = useState<T | null>(null);
	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(
		() =>
			contentApi<T>(path)
				.then((d) => {
					setData(d);
					setError(null);
				})
				.catch((e: Error) => setError(e.message)),
		[path],
	);

	useEffect(() => {
		setData(null);
		setError(null);
		fetchData();
	}, [fetchData]);

	return { data, error, reload: fetchData };
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
	const { data: items, error, reload } = useContent<ContentSummary[]>(type);
	const [query, setQuery] = useState("");
	const label = CONTENT[type].label;

	const visible = useMemo(
		() => items?.filter((i) => matchesSearch(query, i.title, i.description)) ?? null,
		[items, query],
	);

	return (
		<div>
			<h1 className="text-2xl font-bold">{label}</h1>
			{intro && <p className="text-muted-foreground mt-2">{intro}</p>}

			<AdminContentPanel type={type} onChanged={reload} />

			<SearchInput
				className="mt-6 max-w-md"
				placeholder={`Search ${label.toLowerCase()}`}
				value={query}
				onChange={setQuery}
			/>

			{notice}

			<div className="mt-6">
				{error ? (
					<p className="text-sm text-destructive">{error}</p>
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

/** Shared frame for in-site detail pages: back link, loading/error, title + description. */
export function DetailLayout<T extends { title: string; description: string }>({
	type,
	data,
	error,
	children,
}: {
	type: ContentType;
	data: T | null;
	error: string | null;
	children: (data: T) => ReactNode;
}) {
	const cfg = CONTENT[type];
	return (
		<div>
			<Link to={`/home/${cfg.route}`} className="text-sm text-muted-foreground hover:underline">
				← Back to {cfg.label}
			</Link>
			{error ? (
				<p className="mt-4 text-sm text-destructive">{error}</p>
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
