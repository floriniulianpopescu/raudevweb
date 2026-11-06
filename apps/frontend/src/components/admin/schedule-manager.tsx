import { useEffect, useId, useState, type ReactNode } from "react";
import { SessionScheduleSchema, WEEKDAYS, type SessionSchedule, type SessionScheduleInput } from "@raudevweb/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/lib/admin-api";

function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => ReactNode }) {
	const id = useId();
	return (
		<div className="space-y-1">
			<label htmlFor={id} className="text-sm font-medium">
				{label}
			</label>
			{children(id)}
			{hint && <p className="text-xs text-muted-foreground">{hint}</p>}
		</div>
	);
}

const toDraft = (s: SessionSchedule): SessionScheduleInput => ({
	title: s.title,
	weekday: s.weekday,
	startTime: s.startTime,
	endTime: s.endTime,
	location: s.location,
	note: s.note,
	semesterStart: s.semesterStart,
	cancelled: s.cancelled,
});

/** Admin editor for the weekly physical session shown on /home. */
export function ScheduleManager({ onChanged }: { onChanged?: () => void }) {
	const [draft, setDraft] = useState<SessionScheduleInput | null>(null);
	const [saved, setSaved] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		adminApi<SessionSchedule>("schedule")
			.then((s) => setDraft(toDraft(s)))
			.catch((e: Error) => setError(e.message));
	}, []);

	if (!draft) {
		return <div className="mt-4 rounded-lg border p-4 text-sm text-muted-foreground">{error ?? "Loading…"}</div>;
	}

	const set = (patch: Partial<SessionScheduleInput>) => {
		setDraft({ ...draft, ...patch });
		setSaved(null);
	};

	async function save() {
		const parsed = SessionScheduleSchema.safeParse(draft);
		if (!parsed.success) {
			setError(parsed.error.issues.map((i) => i.message).join("; "));
			return;
		}
		setSaving(true);
		try {
			const res = await adminApi<SessionSchedule>("schedule", { method: "PUT", body: JSON.stringify(parsed.data) });
			setDraft(toDraft(res));
			setError(null);
			setSaved("Saved");
			onChanged?.();
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="mt-4 space-y-4 rounded-lg border p-4">
			<h3 className="font-semibold">Physical session</h3>
			{error && <p className="text-sm text-destructive">{error}</p>}

			<Field label="Lesson name" hint={'Shown on /home instead of "Physical session". Leave empty to use that default.'}>
				{(id) => (
					<Input
						id={id}
						placeholder="e.g. Intro to graphs & BFS"
						value={draft.title}
						onChange={(e) => set({ title: e.target.value })}
					/>
				)}
			</Field>

			<div className="grid gap-4 sm:grid-cols-3">
				<Field label="Day">
					{(id) => (
						<select
							id={id}
							value={draft.weekday}
							onChange={(e) => set({ weekday: Number(e.target.value) })}
							className="h-9 w-full rounded-md border bg-background px-3 text-sm"
						>
							{/* Monday first */}
							{[1, 2, 3, 4, 5, 6, 0].map((d) => (
								<option key={d} value={d}>
									{WEEKDAYS[d]}
								</option>
							))}
						</select>
					)}
				</Field>
				<Field label="Starts">
					{(id) => (
						<Input id={id} type="time" value={draft.startTime} onChange={(e) => set({ startTime: e.target.value })} />
					)}
				</Field>
				<Field label="Ends">
					{(id) => <Input id={id} type="time" value={draft.endTime} onChange={(e) => set({ endTime: e.target.value })} />}
				</Field>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<Field label="Location" hint="Optional, e.g. room or building">
					{(id) => <Input id={id} value={draft.location} onChange={(e) => set({ location: e.target.value })} />}
				</Field>
				<Field label="Semester start" hint="Week 1 is the week containing this date. Empty → calendar week number.">
					{(id) => (
						<div className="flex gap-2">
							<Input
								id={id}
								type="date"
								value={draft.semesterStart ?? ""}
								onChange={(e) => set({ semesterStart: e.target.value || null })}
							/>
							{draft.semesterStart && (
								<Button size="sm" variant="ghost" className="h-9" onClick={() => set({ semesterStart: null })}>
									Clear
								</Button>
							)}
						</div>
					)}
				</Field>
			</div>

			<Field label="Note" hint="Optional message shown under the session (e.g. what to bring)">
				{(id) => <Textarea id={id} value={draft.note} onChange={(e) => set({ note: e.target.value })} />}
			</Field>

			<label className="flex cursor-pointer items-center gap-2 text-sm">
				<input
					type="checkbox"
					className="size-4 accent-primary"
					checked={draft.cancelled}
					onChange={(e) => set({ cancelled: e.target.checked })}
				/>
				Cancel this week's session
				<span className="text-muted-foreground">(remember to uncheck it afterwards)</span>
			</label>

			<div className="flex items-center gap-3">
				<Button size="sm" disabled={saving} onClick={save}>
					{saving ? "Saving…" : "Save"}
				</Button>
				{saved && <span className="text-sm text-green-600">{saved}</span>}
			</div>
		</div>
	);
}
