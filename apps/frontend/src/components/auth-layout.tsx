import { ArrowLeft, Code2 } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthLayoutProps {
	title: string;
	description: string;
	children: ReactNode;
	footer: ReactNode;
}

export default function AuthLayout({
	title,
	description,
	children,
	footer,
}: AuthLayoutProps) {
	return (
		<div className="relative isolate min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-10 overflow-x-hidden">
			{/* BACKGROUND GRADIENT */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_15%,transparent),transparent_70%)]"
			/>

			<div className="w-full max-w-sm space-y-6">
				<Link
					to="/"
					className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					Back to home
				</Link>

				<Card className="border-primary/20 bg-card/60 shadow-sm backdrop-blur-sm p-1">
					<CardHeader className="p-5 pb-2 text-center">
						<CardTitle className="text-2xl">{title}</CardTitle>
						<p className="text-xs sm:text-sm text-muted-foreground mt-1">
							{description}
						</p>
					</CardHeader>
					<CardContent className="p-5 pt-3">{children}</CardContent>
				</Card>

				<p className="text-center text-xs sm:text-sm text-muted-foreground">
					{footer}
				</p>
			</div>
		</div>
	);
}
