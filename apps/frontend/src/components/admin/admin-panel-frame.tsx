import { useState, type ReactNode } from "react";
import { ChevronDownIcon, ShieldIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

/** Shared look for every admin dashboard: dashed panel, shield title, Hide/Manage toggle. Admins only. */
export function AdminPanelFrame({
	title,
	children,
	className,
}: {
	title: string;
	children: ReactNode;
	className?: string;
}) {
	const { data: session } = authClient.useSession();
	const [open, setOpen] = useState(false); // collapsed until the admin clicks "Manage"

	if (session?.user.role !== "admin") return null;

	return (
		<section className={cn("mt-6 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4", className)}>
			<div className="flex items-center justify-between gap-2">
				<h2 className="flex items-center gap-2 text-sm font-semibold">
					<ShieldIcon className="size-4 text-primary" />
					{title}
				</h2>
				<Button size="sm" variant="ghost" aria-expanded={open} onClick={() => setOpen(!open)}>
					{open ? "Hide" : "Manage"}
					<ChevronDownIcon className={cn("transition-transform", open && "rotate-180")} />
				</Button>
			</div>
			{open && children}
		</section>
	);
}
