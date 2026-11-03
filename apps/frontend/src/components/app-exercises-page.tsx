import { LanguagesIcon } from "lucide-react";
import { ContentList } from "@/components/content-list";

function LanguageNotice() {
	return (
		<p
			role="note"
			className="mt-3 flex max-w-md items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300"
		>
			<LanguagesIcon className="mt-0.5 size-3.5 shrink-0" />
			<span>
				Some exercise sites may be in Romanian or other languages. Use your browser's translate feature (e.g.
				right-click → <em>Translate to English</em>) if needed.
			</span>
		</p>
	);
}

export function AppExercisesPage() {
	return <ContentList type="exercises" intro="Practice with exercises." notice={<LanguageNotice />} />;
}
