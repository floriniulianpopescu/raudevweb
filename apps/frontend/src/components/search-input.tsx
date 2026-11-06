import { SearchIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Text input with a search icon and a clear button. */
export function SearchInput({
	value,
	onChange,
	placeholder = "Search…",
	className,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}) {
	return (
		<div className={cn("relative", className)}>
			<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="search"
				role="searchbox"
				aria-label={placeholder}
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={(e) => e.key === "Escape" && onChange("")}
				className="pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
			/>
			{value && (
				<button
					type="button"
					aria-label="Clear search"
					onClick={() => onChange("")}
					className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
				>
					<XIcon className="size-4" />
				</button>
			)}
		</div>
	);
}
