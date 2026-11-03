import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchInput } from "@/components/search-input";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSelection } from "@/hooks/use-selection";
import { adminApi } from "@/lib/admin-api";
import { matchesSearch } from "@/lib/search";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./confirm-dialog";
import type { Editor } from "./editors";
import { Checkbox, SelectionBar } from "./selection-bar";

type Item = { id: string; title: string; description?: string };

/** Structural subset of a zod schema, so this file doesn't need zod directly. */
export type Schema = {
	safeParse(value: unknown):
		| { success: true; data: unknown }
		| { success: false; error: { issues: { path: (string | number)[]; message: string }[] } };
};

export function CrudManager<Draft>({
	endpoint,
	label,
	schema,
	editor,
	onChanged,
}: {
	endpoint: string; // e.g. "challenges"
	label: string; // e.g. "Challenges"
	schema: Schema;
	editor: Editor<Draft>;
	/** Called after a successful create/update/delete (e.g. to refresh a public list). */
	onChanged?: () => void;
}) {
	const [items, setItems] = useState<Item[]>([]);
	const [editing, setEditing] = useState<Item | "new" | null>(null);
	const [draft, setDraft] = useState<Draft>(editor.empty);
	const [error, setError] = useState<string | null>(null);
	const [query, setQuery] = useState("");

	const visible = useMemo(
		() => items.filter((i) => matchesSearch(query, i.title, i.description, editor.summary(i))),
		[items, query, editor],
	);

	const allIds = useMemo(() => items.map((i) => i.id), [items]);
	const visibleIds = useMemo(() => visible.map((i) => i.id), [visible]);
	const selection = useSelection(visibleIds, allIds);
	/** What the confirm dialog is about to delete */
	const [pendingDelete, setPendingDelete] = useState<Item | "selected" | null>(null);
	const [deleting, setDeleting] = useState(false);

	const load = useCallback(async () => {
		try {
			setItems(await adminApi<Item[]>(endpoint));
			setError(null);
		} catch (e) {
			setError((e as Error).message);
		}
	}, [endpoint]);

	useEffect(() => {
		setEditing(null);
		load();
	}, [load]);

	function startEdit(item: Item | "new") {
		setEditing(item);
		setDraft(item === "new" ? editor.empty() : editor.fromItem(item));
		setError(null);
	}

	async function save() {
		const parsed = schema.safeParse(editor.toBody ? editor.toBody(draft) : draft);
		if (!parsed.success) {
			setError(
				parsed.error.issues
					.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
					.join("; "),
			);
			return;
		}
		try {
			const body = JSON.stringify(parsed.data);
			if (editing === "new") {
				await adminApi(endpoint, { method: "POST", body });
			} else if (editing) {
				await adminApi(`${endpoint}/${editing.id}`, { method: "PATCH", body });
			}
			setEditing(null);
			await load();
			onChanged?.();
		} catch (e) {
			setError((e as Error).message);
		}
	}

	async function confirmDelete() {
		const target = pendingDelete;
		setPendingDelete(null);
		if (!target) return;
		const ids = target === "selected" ? [...selection.selected] : [target.id];
		setDeleting(true);
		try {
			if (ids.length === 1) {
				await adminApi(`${endpoint}/${ids[0]}`, { method: "DELETE" });
			} else {
				await adminApi(`${endpoint}/bulk-delete`, { method: "POST", body: JSON.stringify({ ids }) });
			}
			if (target === "selected") selection.clear();
			// Close the editor if the item being edited was deleted
			if (editing && editing !== "new" && ids.includes(editing.id)) setEditing(null);
			await load();
			onChanged?.();
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setDeleting(false);
		}
	}

	const Form = editor.Form;

	return (
		<div className="mt-4 rounded-lg border p-4">
			<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
				<h3 className="font-semibold">
					{label} <span className="font-normal text-muted-foreground">({items.length})</span>
				</h3>
				<div className="flex items-center gap-2">
					<SearchInput
						className="w-56"
						placeholder={`Search ${label.toLowerCase()}`}
						value={query}
						onChange={setQuery}
					/>
					<Button size="sm" onClick={() => startEdit("new")}>
						Add
					</Button>
				</div>
			</div>

			{error && <p className="mb-3 text-sm text-destructive">{error}</p>}

			{editing && (
				<div className="mb-4 space-y-3 rounded-md border bg-muted/40 p-3">
					<Form value={draft} onChange={setDraft} />
					<div className="flex gap-2">
						<Button size="sm" onClick={save}>
							{editing === "new" ? "Create" : "Save"}
						</Button>
						<Button size="sm" variant="outline" onClick={() => setEditing(null)}>
							Cancel
						</Button>
					</div>
				</div>
			)}

			{items.length === 0 ? (
				<p className="text-sm text-muted-foreground">Nothing here yet.</p>
			) : visible.length === 0 ? (
				<p className="text-sm text-muted-foreground">No {label.toLowerCase()} match "{query}".</p>
			) : (
				<>
					<SelectionBar selection={selection} visibleCount={visible.length}>
						<Button
							size="sm"
							variant="destructive"
							disabled={deleting}
							onClick={() => setPendingDelete("selected")}
						>
							<Trash2Icon /> Delete selected ({selection.count})
						</Button>
					</SelectionBar>
					<ul className="divide-y">
						{visible.map((item) => (
							<li
								key={item.id}
								className={cn(
									"flex items-center gap-3 rounded-md px-2 py-2",
									selection.isSelected(item.id) && "bg-primary/5",
								)}
							>
								<Checkbox
									label={`Select ${item.title}`}
									checked={selection.isSelected(item.id)}
									onChange={() => selection.toggle(item.id)}
								/>
								<span className="min-w-0 flex-1">
									<span className="block truncate">{item.title}</span>
									<span className="block truncate text-xs text-muted-foreground">
										{editor.summary(item)}
									</span>
								</span>
								<span className="flex shrink-0 gap-2">
									<Button size="sm" variant="outline" onClick={() => startEdit(item)}>
										Edit
									</Button>
									<Button
										size="sm"
										variant="destructive"
										disabled={deleting}
										onClick={() => setPendingDelete(item)}
									>
										Delete
									</Button>
								</span>
							</li>
						))}
					</ul>
				</>
			)}

			<ConfirmDialog
				open={pendingDelete !== null}
				onOpenChange={(open) => !open && setPendingDelete(null)}
				title={
					pendingDelete === "selected"
						? `Delete ${selection.count} ${label.toLowerCase()}?`
						: `Delete "${pendingDelete?.title ?? ""}"?`
				}
				description={
					<>
						This can't be undone.
						{pendingDelete === "selected" && selection.hiddenCount > 0 && (
							<> {selection.hiddenCount} of the selected items are currently hidden by your search.</>
						)}
						{endpoint === "problems" || endpoint === "exercises"
							? " They will also be removed from any challenge that uses them."
							: ""}
					</>
				}
				confirmLabel={pendingDelete === "selected" ? `Delete ${selection.count}` : "Delete"}
				onConfirm={confirmDelete}
			/>
		</div>
	);
}
