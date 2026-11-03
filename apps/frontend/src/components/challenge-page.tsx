import { useParams } from "react-router-dom";
import type { ChallengeItem, LinkItem } from "@raudevweb/shared";
import { ContentCard } from "./content-card";
import { CardGrid, DetailLayout, useContent } from "./content-list";

function LinkSection({ title, items }: { title: string; items: LinkItem[] }) {
	if (items.length === 0) return null;
	return (
		<section>
			<h2 className="mb-3 text-lg font-semibold">
				{title} <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
			</h2>
			<CardGrid>
				{items.map((i) => (
					<ContentCard key={i.id} title={i.title} description={i.description} href={i.href} />
				))}
			</CardGrid>
		</section>
	);
}

/** /home/challenges/:id — a challenge with its problems and exercises. */
export function ChallengePage() {
	const { id } = useParams();
	const { data, error } = useContent<ChallengeItem>(`challenges/${id}`);

	return (
		<DetailLayout type="challenges" data={data} error={error}>
			{(c) => (
				<>
					<LinkSection title="Problems" items={c.problems} />
					<LinkSection title="Exercises" items={c.exercises} />
				</>
			)}
		</DetailLayout>
	);
}
