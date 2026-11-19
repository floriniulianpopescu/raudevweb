import { useParams } from "react-router-dom";
import type { ChallengeItem, CompletableType, LinkItem } from "@raudevweb/shared";
import { ContentCard } from "./content-card";
import { CardGrid, DetailLayout, useContent } from "./content-list";
import { ChallengeProgress, DoneCheck } from "./done-check";

function LinkSection({ type, title, items }: { type: CompletableType; title: string; items: LinkItem[] }) {
	if (items.length === 0) return null;
	return (
		<section>
			<h2 className="mb-3 text-lg font-semibold">
				{title} <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
			</h2>
			<CardGrid>
				{items.map((i) => (
					<ContentCard
						key={i.id}
						title={i.title}
						description={i.description}
						href={i.href}
						footer={<DoneCheck type={type} id={i.id} title={i.title} />}
					/>
				))}
			</CardGrid>
		</section>
	);
}

/** /home/challenges/:id — a challenge with its problems and exercises. */
export function ChallengePage() {
	const { id } = useParams();
	const content = useContent<ChallengeItem>(`challenges/${id}`);

	return (
		<DetailLayout type="challenges" content={content}>
			{(c) => (
				<>
					<ChallengeProgress
						problemIds={c.problems.map((p) => p.id)}
						exerciseIds={c.exercises.map((e) => e.id)}
					/>
					<LinkSection type="problems" title="Problems" items={c.problems} />
					<LinkSection type="exercises" title="Exercises" items={c.exercises} />
				</>
			)}
		</DetailLayout>
	);
}
