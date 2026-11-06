import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Sun/moon button that switches light ↔ dark (remembered in localStorage). */
export function ThemeToggle({ className }: { className?: string }) {
	const { theme, toggle } = useTheme();
	const next = theme === "dark" ? "light" : "dark";
	return (
		<Button
			size="icon"
			variant="ghost"
			onClick={toggle}
			aria-label={`Switch to ${next} mode`}
			title={`Switch to ${next} mode`}
			className={cn("relative", className)}
		>
			<SunIcon className={cn("transition-all", theme === "dark" ? "scale-0 rotate-90" : "scale-100 rotate-0")} />
			<MoonIcon
				className={cn(
					"absolute transition-all",
					theme === "dark" ? "scale-100 rotate-0" : "scale-0 -rotate-90",
				)}
			/>
		</Button>
	);
}
