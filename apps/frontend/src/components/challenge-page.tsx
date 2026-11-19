import { useParams } from "react-router-dom";
import type { ChallengeItem, CompletableType, LinkItem } from "@raudevweb/shared";
import { ContentCard } from "./content-card";
import { CardGrid, DetailLayout, useContent } from "./content-list";
import { DoneBadge } from "./done-check";

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
						badge={<DoneBadge type={type} id={i.id} />}
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
					<LinkSection type="problems" title="Problems" items={c.problems} />
					<LinkSection type="exercises" title="Exercises" items={c.exercises} />
				</>
			)}
		</DetailLayout>
	);
}
