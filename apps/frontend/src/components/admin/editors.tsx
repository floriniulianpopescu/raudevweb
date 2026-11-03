import { useEffect, useId, useState, type ReactNode } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import {
	QUIZ_ANSWER_COUNT,
	QUIZ_QUESTION_COUNT,
	type ChallengeItem,
	type ContentType,
	type LinkItem,
	type QuizItemAdmin,
	type ResourceItem,
} from "@raudevweb/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

/** How the admin dashboard creates/edits one content type. */
export type Editor<Draft> = {
	empty: () => Draft;
	fromItem: (item: any) => Draft;
	/** Optional transform before validation (defaults to the draft itself). */
	toBody?: (draft: Draft) => unknown;
	Form: (props: { value: Draft; onChange: (v: Draft) => void }) => ReactNode;
	/** Second line shown under the title in the admin list. */
	summary: (item: any) => string;
};

// --- small building blocks ---------------------------------------------------

function Field({ label, children }: { label: string; children: (id: string) => ReactNode }) {
	const id = useId();
	return (
		<div className="space-y-1">
			<label className="text-sm font-medium" htmlFor={id}>
				{label}
			</label>
			{children(id)}
		</div>
	);
}

type Basic = { title: string; description: string };

function BasicFields<T extends Basic>({ value, onChange }: { value: T; onChange: (v: T) => void }) {
	return (
		<>
			<Field label="Title *">
				{(id) => (
					<Input id={id} value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} />
				)}
			</Field>
			<Field label="Description">
				{(id) => (
					<Textarea
						id={id}
						value={value.description}
						onChange={(e) => onChange({ ...value, description: e.target.value })}
					/>
				)}
			</Field>
		</>
	);
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// --- problems & exercises: { title, description, href } ------------------------

type LinkDraft = Basic & { href: string };

const linkEditor: Editor<LinkDraft> = {
	empty: () => ({ title: "", description: "", href: "" }),
	fromItem: (i: LinkItem) => ({ title: i.title, description: i.description, href: i.href }),
	summary: (i: LinkItem) => i.href,
	Form: ({ value, onChange }) => (
		<>
			<BasicFields value={value} onChange={onChange} />
			<Field label="External link *">
				{(id) => (
					<Input
						id={id}
						inputMode="url"
						placeholder="https://..."
						value={value.href}
						onChange={(e) => onChange({ ...value, href: e.target.value })}
					/>
				)}
			</Field>
		</>
	),
};

// --- challenges: { title, description, problemIds, exerciseIds } --------------

type ChallengeDraft = Basic & { problemIds: string[]; exerciseIds: string[] };

function Picker({
	label,
	endpoint,
	selected,
	onChange,
}: {
	label: string;
	endpoint: "problems" | "exercises";
	selected: string[];
	onChange: (ids: string[]) => void;
}) {
	const [options, setOptions] = useState<LinkItem[] | null>(null);

	useEffect(() => {
		adminApi<LinkItem[]>(endpoint).then(setOptions, () => setOptions([]));
	}, [endpoint]);

	const toggle = (id: string) =>
		onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

	return (
		<fieldset className="space-y-1">
			<legend className="text-sm font-medium">
				{label} <span className="text-muted-foreground">({selected.length} selected)</span>
			</legend>
			<div className="max-h-48 space-y-1 overflow-y-auto rounded-md border bg-background p-2">
				{options === null ? (
					<p className="text-sm text-muted-foreground">Loading…</p>
				) : options.length === 0 ? (
					<p className="text-sm text-muted-foreground">No {endpoint} yet — create some first.</p>
				) : (
					options.map((o) => (
						<label key={o.id} className="flex cursor-pointer items-center gap-2 text-sm">
							<input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} />
							<span className="truncate">{o.title}</span>
						</label>
					))
				)}
			</div>
		</fieldset>
	);
}

const challengeEditor: Editor<ChallengeDraft> = {
	empty: () => ({ title: "", description: "", problemIds: [], exerciseIds: [] }),
	fromItem: (i: ChallengeItem) => ({
		title: i.title,
		description: i.description,
		problemIds: i.problems.map((p) => p.id),
		exerciseIds: i.exercises.map((e) => e.id),
	}),
	summary: (i: ChallengeItem) =>
		`${plural(i.problems.length, "problem")}, ${plural(i.exercises.length, "exercise")}`,
	Form: ({ value, onChange }) => (
		<>
			<BasicFields value={value} onChange={onChange} />
			<div className="grid gap-3 sm:grid-cols-2">
				<Picker
					label="Problems"
					endpoint="problems"
					selected={value.problemIds}
					onChange={(problemIds) => onChange({ ...value, problemIds })}
				/>
				<Picker
					label="Exercises"
					endpoint="exercises"
					selected={value.exerciseIds}
					onChange={(exerciseIds) => onChange({ ...value, exerciseIds })}
				/>
			</div>
		</>
	),
};

// --- quizzes: 5 questions × 4 answers, exactly one correct --------------------

type QuestionDraft = { question: string; answers: string[]; correctIndex: number };
type QuizDraft = Basic & { questions: QuestionDraft[] };

const emptyQuestion = (): QuestionDraft => ({
	question: "",
	answers: Array(QUIZ_ANSWER_COUNT).fill(""),
	correctIndex: 0,
});

function QuestionEditor({
	index,
	value,
	onChange,
}: {
	index: number;
	value: QuestionDraft;
	onChange: (q: QuestionDraft) => void;
}) {
	const name = useId();
	const setAnswer = (a: number, text: string) =>
		onChange({ ...value, answers: value.answers.map((x, i) => (i === a ? text : x)) });

	return (
		<fieldset className="space-y-2 rounded-md border bg-background p-3">
			<legend className="px-1 text-sm font-medium">Question {index + 1}</legend>
			<Input
				placeholder="Question"
				value={value.question}
				onChange={(e) => onChange({ ...value, question: e.target.value })}
			/>
			{value.answers.map((answer, a) => (
				<div key={a} className="flex items-center gap-2">
					<input
						type="radio"
						name={name}
						aria-label={`Answer ${a + 1} is correct`}
						checked={value.correctIndex === a}
						onChange={() => onChange({ ...value, correctIndex: a })}
					/>
					<Input
						placeholder={`Answer ${a + 1}`}
						value={answer}
						onChange={(e) => setAnswer(a, e.target.value)}
						className={cn(value.correctIndex === a && "border-green-600")}
					/>
				</div>
			))}
			<p className="text-xs text-muted-foreground">Select the radio button next to the one correct answer.</p>
		</fieldset>
	);
}

const quizEditor: Editor<QuizDraft> = {
	empty: () => ({
		title: "",
		description: "",
		questions: Array.from({ length: QUIZ_QUESTION_COUNT }, emptyQuestion),
	}),
	fromItem: (i: QuizItemAdmin) => ({
		title: i.title,
		description: i.description,
		questions: i.questions.map(({ question, answers, correctIndex }) => ({ question, answers, correctIndex })),
	}),
	summary: (i: QuizItemAdmin) => plural(i.questions.length, "question"),
	Form: ({ value, onChange }) => (
		<>
			<BasicFields value={value} onChange={onChange} />
			{value.questions.map((q, i) => (
				<QuestionEditor
					key={i}
					index={i}
					value={q}
					onChange={(next) =>
						onChange({ ...value, questions: value.questions.map((x, j) => (j === i ? next : x)) })
					}
				/>
			))}
		</>
	),
};

// --- lessons & extras: { title, description, links[] } ------------------------

type ResourceLinkDraft = { title: string; description: string; href: string };
type ResourceDraft = Basic & { links: ResourceLinkDraft[] };

const emptyLink = (): ResourceLinkDraft => ({ title: "", description: "", href: "" });

const resourceEditor: Editor<ResourceDraft> = {
	empty: () => ({ title: "", description: "", links: [emptyLink()] }),
	fromItem: (i: ResourceItem) => ({
		title: i.title,
		description: i.description,
		links: i.links.map(({ title, description, href }) => ({ title, description, href })),
	}),
	summary: (i: ResourceItem) => plural(i.links.length, "link"),
	Form: ({ value, onChange }) => {
		const setLink = (i: number, patch: Partial<ResourceLinkDraft>) =>
			onChange({ ...value, links: value.links.map((l, j) => (j === i ? { ...l, ...patch } : l)) });

		return (
			<>
				<BasicFields value={value} onChange={onChange} />
				<div className="space-y-2">
					<p className="text-sm font-medium">Bibliography *</p>
					{value.links.map((link, i) => (
						<div key={i} className="grid gap-2 rounded-md border bg-background p-3 sm:grid-cols-[1fr_1fr_auto]">
							<Input placeholder="Title" value={link.title} onChange={(e) => setLink(i, { title: e.target.value })} />
							<Input
								placeholder="https://..."
								inputMode="url"
								value={link.href}
								onChange={(e) => setLink(i, { href: e.target.value })}
							/>
							<Button
								size="icon"
								variant="ghost"
								aria-label="Remove link"
								disabled={value.links.length === 1}
								onClick={() => onChange({ ...value, links: value.links.filter((_, j) => j !== i) })}
							>
								<Trash2Icon />
							</Button>
							<Input
								className="sm:col-span-3"
								placeholder="Short note (optional)"
								value={link.description}
								onChange={(e) => setLink(i, { description: e.target.value })}
							/>
						</div>
					))}
					<Button
						size="sm"
						variant="outline"
						onClick={() => onChange({ ...value, links: [...value.links, emptyLink()] })}
					>
						<PlusIcon /> Add link
					</Button>
				</div>
			</>
		);
	},
};

export const EDITORS: Record<ContentType, Editor<any>> = {
	challenges: challengeEditor,
	problems: linkEditor,
	exercises: linkEditor,
	quizzes: quizEditor,
	lessons: resourceEditor,
	extras: resourceEditor,
};
