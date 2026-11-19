import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

/** "Page not found" inside the /home layout (unknown /home/* path, or a missing item). */
export function NotFoundView({ backTo, backLabel }: { backTo: string; backLabel: string }) {
	return (
		<div className="py-10">
			<PageTitle title="Page not found" />
			<p className="text-sm font-semibold text-primary">404</p>
			<h1 className="mt-1 text-2xl font-bold">Page not found</h1>
			<p className="mt-2 text-muted-foreground">
				This page doesn&apos;t exist or was removed. Check the link, or go back and pick something else.
			</p>
			<Button className="mt-6" variant="outline" render={<Link to={backTo} />} nativeButton={false}>
				<ArrowLeftIcon data-icon="inline-start" />
				{backLabel}
			</Button>
		</div>
	);
}

/** Standalone 404 for unknown paths outside /home, styled like the guest pages. */
export function NotFoundPage() {
	const { data: session } = authClient.useSession();
	const [to, label] = session ? ["/home", "Go to Home"] : ["/", "Go to homepage"];

	return (
		<div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-background px-4 py-10 text-center text-foreground">
			<PageTitle title="Page not found" />
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_15%,transparent),transparent_70%)]"
			/>
			<p className="text-7xl font-extrabold tracking-tight text-primary sm:text-8xl">404</p>
			<h1 className="mt-4 text-2xl font-bold">Page not found</h1>
			<p className="mt-2 max-w-sm text-sm text-muted-foreground sm:text-base">
				The page you&apos;re looking for doesn&apos;t exist or was moved.
			</p>
			<Button className="mt-8" render={<Link to={to} />} nativeButton={false}>
				{label}
			</Button>
		</div>
	);
}
