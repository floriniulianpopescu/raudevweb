import { Component, lazy, Suspense, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// The Markdown renderer (and Shiki behind it) is only downloaded on pages that show a body
const Markdown = lazy(() => import("./markdown"));

/** Catches a failed download of the renderer chunk (e.g. connection dropped). */
class ChunkErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	render() {
		if (this.state.failed) {
			return (
				<p role="alert" className="text-sm text-destructive">
					Couldn't load this text. Check your connection and refresh the page.
				</p>
			);
		}
		return this.props.children;
	}
}

/** Markdown body of a lesson/extra, loaded on demand. */
export function MarkdownBody({ children, className }: { children: string; className?: string }) {
	return (
		<ChunkErrorBoundary>
			<Suspense fallback={<Skeleton className="h-40" />}>
				<Markdown className={className}>{children}</Markdown>
			</Suspense>
		</ChunkErrorBoundary>
	);
}
