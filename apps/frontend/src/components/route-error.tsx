import { RotateCwIcon } from "lucide-react";
import { useLayoutEffect } from "react";
import { useRouteError } from "react-router-dom";
import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { removePrerender } from "@/lib/prerender";

/**
 * Shown instead of a blank screen when a page crashes while rendering, or when
 * its code couldn't be downloaded (lost connection, or a new deploy removed the old file).
 */
export function RouteError() {
	const error = useRouteError();
	useLayoutEffect(removePrerender, []);
	if (import.meta.env.DEV) console.error(error);

	return (
		<div
			role="alert"
			className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-background px-4 py-10 text-center text-foreground"
		>
			<PageTitle title="Something went wrong" />
			<h1 className="text-2xl font-bold">Something went wrong</h1>
			<p className="mt-2 max-w-sm text-sm text-muted-foreground sm:text-base">
				This page couldn&apos;t be shown. Check your connection and reload the page.
			</p>
			<Button className="mt-8" onClick={() => window.location.reload()}>
				<RotateCwIcon data-icon="inline-start" />
				Reload page
			</Button>
		</div>
	);
}
