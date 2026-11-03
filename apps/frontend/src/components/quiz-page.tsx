import { useState } from "react";
import { useParams } from "react-router-dom";
import { CheckIcon, XIcon } from "lucide-react";
import type { QuizItem, QuizResult } from "@raudevweb/shared";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { DetailLayout, useContent } from "./content-list";

/** /home/quizzes/:id */
export function QuizPage() {
	const { id } = useParams();
	const { data, error } = useContent<QuizItem>(`quizzes/${id}`);

	return (
		<DetailLayout type="quizzes" data={data} error={error}>
			{(quiz) => <QuizRunner key={quiz.id} quiz={quiz} />}
		</DetailLayout>
	);
}

/** Answer all questions, submit, then see which ones were right. Grading happens on the server. */
export function QuizRunner({ quiz }: { quiz: QuizItem }) {
	const [picked, setPicked] = useState<(number | null)[]>(() => quiz.questions.map(() => null));
	const [result, setResult] = useState<QuizResult | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const allAnswered = picked.every((p) => p !== null);

	async function submit() {
		setSubmitting(true);
		setError(null);
		try {
			const res = await fetch(`${API_URL}/api/content/quizzes/${quiz.id}/submit`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ answers: picked }),
			});
			if (!res.ok) throw new Error((await res.text()) || res.statusText);
			setResult(await res.json());
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setSubmitting(false);
		}
	}

	function retry() {
		setPicked(quiz.questions.map(() => null));
		setResult(null);
	}

	return (
		<div className="space-y-6">
			{quiz.questions.map((q, qi) => (
				<fieldset key={q.id} className="rounded-2xl border bg-card p-4 shadow-sm">
					<legend className="sr-only">Question {qi + 1}</legend>
					<p className="mb-3 font-medium">
						<span className="text-muted-foreground">{qi + 1}.</span> {q.question}
					</p>
					<div className="grid gap-2 sm:grid-cols-2">
						{q.answers.map((answer, ai) => {
							const selected = picked[qi] === ai;
							const isCorrect = result?.correct[qi] === ai;
							const isWrongPick = result && selected && !isCorrect;
							return (
								<button
									key={ai}
									type="button"
									disabled={!!result}
									aria-pressed={selected}
									onClick={() => setPicked(picked.map((p, i) => (i === qi ? ai : p)))}
									className={cn(
										"flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
										"focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
										!result && "hover:border-primary/50 hover:bg-muted",
										!result && selected && "border-primary bg-primary/10",
										isCorrect && "border-green-600 bg-green-600/10",
										isWrongPick && "border-destructive bg-destructive/10",
									)}
								>
									<span>{answer}</span>
									{isCorrect && <CheckIcon className="size-4 shrink-0 text-green-600" />}
									{isWrongPick && <XIcon className="size-4 shrink-0 text-destructive" />}
								</button>
							);
						})}
					</div>
				</fieldset>
			))}

			{error && <p className="text-sm text-destructive">{error}</p>}

			{result ? (
				<div className="flex items-center gap-4">
					<p className="font-semibold">
						Score: {result.score} / {result.total}
					</p>
					<Button variant="outline" onClick={retry}>
						Try again
					</Button>
				</div>
			) : (
				<Button disabled={!allAnswered || submitting} onClick={submit}>
					{submitting ? "Checking…" : "Submit answers"}
				</Button>
			)}
		</div>
	);
}
