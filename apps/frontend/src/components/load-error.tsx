import { RotateCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Friendly replacement for raw API errors, with a Retry button. */
export function LoadError({ onRetry, className }: { onRetry: () => void; className?: string }) {
	return (
		<div role="alert" className={cn("flex flex-col items-start gap-3", className)}>
			<p className="text-sm text-muted-foreground">
				Couldn&apos;t load this. Check your connection and try again.
			</p>
			<Button size="sm" variant="outline" onClick={onRetry}>
				<RotateCwIcon data-icon="inline-start" />
				Retry
			</Button>
		</div>
	);
}
