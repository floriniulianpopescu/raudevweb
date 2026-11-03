import { ContentSchemas, type ContentType } from "@raudevweb/shared";
import { CONTENT } from "@/lib/content";
import { AdminPanelFrame } from "./admin-panel-frame";
import { CrudManager } from "./crud-manager";
import { EDITORS } from "./editors";

/** Admin-only CRUD panel for one content type, shown at the top of that type's page. */
export function AdminContentPanel({ type, onChanged }: { type: ContentType; onChanged?: () => void }) {
	const label = CONTENT[type].label;
	return (
		<AdminPanelFrame title={`Admin dashboard · ${label}`}>
			<CrudManager
				key={type}
				endpoint={type}
				label={label}
				schema={ContentSchemas[type]}
				editor={EDITORS[type]}
				onChanged={onChanged}
			/>
		</AdminPanelFrame>
	);
}
