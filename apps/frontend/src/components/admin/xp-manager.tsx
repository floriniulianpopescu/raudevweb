import { useCallback, useEffect, useMemo, useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { BulkXpAdjustmentSchema, XpAdjustmentSchema, type UserXp } from "@raudevweb/shared";
import { SearchInput } from "@/components/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSelection } from "@/hooks/use-selection";
import { adminApi } from "@/lib/admin-api";
import { matchesSearch } from "@/lib/search";
import { cn } from "@/lib/utils";
import { Checkbox, SelectionBar } from "./selection-bar";

const QUICK_AMOUNTS = [10, 50, 100];

export function XpManager({ onChanged }: { onChanged?: () => void } = {}) {
	const [users, setUsers] = useState<UserXp[] | null>(null);
	const [amounts, setAmounts] = useState<Record<string, string>>({});
	const [busy, setBusy] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [bulkAmount, setBulkAmount] = useState("");
	const [bulkBusy, setBulkBusy] = useState(false);

	const load = useCallback(async () => {
		try {
			setUsers(await adminApi<UserXp[]>("users"));
			setError(null);
		} catch (e) {
			setError((e as Error).message);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const visible = useMemo(() => {
		return users?.filter((u) => matchesSearch(query, u.name, u.email)) ?? null;
	}, [users, query]);

	const allIds = useMemo(() => users?.map((u) => u.id) ?? [], [users]);
	const visibleIds = useMemo(() => visible?.map((u) => u.id) ?? [], [visible]);
	const selection = useSelection(visibleIds, allIds);

	const bulkValue = Number(bulkAmount);
	const bulkValid = bulkAmount !== "" && Number.isInteger(bulkValue) && bulkValue > 0;

	/** Same +/- amount for every selected user. */
	async function adjustSelected(sign: 1 | -1) {
		const parsed = BulkXpAdjustmentSchema.safeParse({
			ids: [...selection.selected],
			delta: sign * bulkValue,
		});
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? "Invalid amount");
			return;
		}
		setBulkBusy(true);
		try {
			await adminApi("users/xp", { method: "POST", body: JSON.stringify(parsed.data) });
			await load();
			setBulkAmount("");
			onChanged?.();
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setBulkBusy(false);
		}
	}

	/** sign: +1 to add, -1 to deduct */
	async function adjust(user: UserXp, amount: number, sign: 1 | -1) {
		const parsed = XpAdjustmentSchema.safeParse({ delta: sign * amount });
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? "Invalid amount");
			return;
		}
		setBusy(user.id);
		try {
			const updated = await adminApi<UserXp>(`users/${user.id}/xp`, {
				method: "POST",
				body: JSON.stringify(parsed.data),
			});
			// Update in place, then keep the list sorted by XP
			setUsers((list) =>
				list
					?.map((u) => (u.id === updated.id ? updated : u))
					.sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name)) ?? null,
			);
			setError(null);
			onChanged?.();
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setBusy(null);
		}
	}

	return (
		<div className="mt-4 rounded-lg border p-4">
			<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
				<h3 className="font-semibold">
					User XP {users && <span className="font-normal text-muted-foreground">({users.length} users)</span>}
				</h3>
				<SearchInput
					className="w-56"
					placeholder="Search name or email"
					value={query}
					onChange={setQuery}
				/>
			</div>

			{error && <p className="mb-3 text-sm text-destructive">{error}</p>}

			{visible === null ? (
				<p className="text-sm text-muted-foreground">Loading…</p>
			) : visible.length === 0 ? (
				<p className="text-sm text-muted-foreground">No users found.</p>
			) : (
				<>
				<SelectionBar selection={selection} visibleCount={visible.length}>
					<Input
						type="number"
						min={1}
						step={1}
						className="h-8 w-24"
						placeholder="Amount"
						aria-label="XP amount for selected users"
						value={bulkAmount}
						onChange={(e) => setBulkAmount(e.target.value)}
					/>
					<Button size="sm" disabled={bulkBusy || !bulkValid} onClick={() => adjustSelected(1)}>
						<PlusIcon /> Add to {selection.count}
					</Button>
					<Button
						size="sm"
						variant="destructive"
						disabled={bulkBusy || !bulkValid}
						onClick={() => adjustSelected(-1)}
					>
						<MinusIcon /> Deduct from {selection.count}
					</Button>
				</SelectionBar>
				<ul className="divide-y">
					{visible.map((u) => {
						const amount = Number(amounts[u.id] ?? "");
						const validAmount = Number.isInteger(amount) && amount > 0;
						const disabled = busy === u.id;
						return (
							<li
								key={u.id}
								className={cn(
									"flex flex-wrap items-center gap-3 rounded-md px-2 py-3",
									selection.isSelected(u.id) && "bg-primary/5",
								)}
							>
								<Checkbox
									label={`Select ${u.name}`}
									checked={selection.isSelected(u.id)}
									onChange={() => selection.toggle(u.id)}
								/>
								<span className="min-w-0 flex-1">
									<span className="flex items-center gap-2">
										<span className="truncate font-medium">{u.name}</span>
										{u.role === "admin" && <Badge variant="secondary">admin</Badge>}
									</span>
									<span className="block truncate text-sm text-muted-foreground">{u.email}</span>
								</span>

								<span className="flex flex-wrap items-center gap-2">
									<span className="w-20 text-right font-semibold tabular-nums">{u.xp} XP</span>

									{QUICK_AMOUNTS.map((n) => (
										<Button
											key={n}
											size="xs"
											variant="outline"
											disabled={disabled}
											onClick={() => adjust(u, n, 1)}
										>
											+{n}
										</Button>
									))}

									<Input
										type="number"
										min={1}
										step={1}
										className="w-24"
										placeholder="Amount"
										aria-label={`XP amount for ${u.name}`}
										value={amounts[u.id] ?? ""}
										onChange={(e) => setAmounts({ ...amounts, [u.id]: e.target.value })}
									/>
									<Button
										size="sm"
										disabled={disabled || !validAmount}
										onClick={() => adjust(u, amount, 1)}
									>
										<PlusIcon /> Add
									</Button>
									<Button
										size="sm"
										variant="destructive"
										disabled={disabled || !validAmount || u.xp === 0}
										onClick={() => adjust(u, amount, -1)}
									>
										<MinusIcon /> Deduct
									</Button>
								</span>
							</li>
						);
					})}
				</ul>
				</>
			)}
		</div>
	);
}
