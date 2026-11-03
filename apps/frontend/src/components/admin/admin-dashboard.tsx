import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";
import { ContentSchemas, type ContentType } from "@raudevweb/shared";
import { Button } from "@/components/ui/button";
import { CONTENT } from "@/lib/content";
import { AdminPanelFrame } from "./admin-panel-frame";
import { CrudManager } from "./crud-manager";
import { EDITORS } from "./editors";
import { ScheduleManager } from "./schedule-manager";
import { XpManager } from "./xp-manager";

type Tab = ContentType | "xp" | "schedule";

const GROUPS: { title: string; tabs: Tab[] }[] = [
	{ title: "Practice", tabs: ["challenges", "problems", "exercises", "quizzes"] },
	{ title: "Resources", tabs: ["lessons", "extras"] },
	{ title: "Users", tabs: ["xp"] },
	{ title: "Site", tabs: ["schedule"] },
];

const tabLabel = (tab: Tab) => (tab === "xp" ? "XP" : tab === "schedule" ? "Session schedule" : CONTENT[tab].label);

/** /home: one admin panel with every content type + XP, same look as the per-page panels. */
export function AdminDashboard({ onScheduleChanged }: { onScheduleChanged?: () => void }) {
	const [active, setActive] = useState<Tab>("challenges");

	return (
		<AdminPanelFrame title={`Admin dashboard · ${tabLabel(active)}`}>
			<nav className="mt-3 flex flex-wrap gap-x-6 gap-y-2" aria-label="Admin sections">
				{GROUPS.map((group) => (
					<div key={group.title} className="flex flex-wrap items-center gap-1.5">
						<span className="mr-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
							{group.title}
						</span>
						{group.tabs.map((tab) => (
							<Button
								key={tab}
								size="sm"
								variant={active === tab ? "default" : "outline"}
								aria-pressed={active === tab}
								onClick={() => setActive(tab)}
							>
								{tabLabel(tab)}
							</Button>
						))}
					</div>
				))}
			</nav>

			{active === "schedule" ? (
				<ScheduleManager onChanged={onScheduleChanged} />
			) : active === "xp" ? (
				<XpManager />
			) : (
				<>
					<CrudManager
						key={active}
						endpoint={active}
						label={CONTENT[active].label}
						schema={ContentSchemas[active]}
						editor={EDITORS[active]}
					/>
					<Link
						to={`/home/${CONTENT[active].route}`}
						className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
					>
						Open {CONTENT[active].label} page <ArrowRightIcon className="size-3.5" />
					</Link>
				</>
			)}
		</AdminPanelFrame>
	);
}
