import { useParams } from "react-router-dom";
import type { ResourceItem } from "@raudevweb/shared";
import { ContentCard } from "./content-card";
import { DetailLayout, useContent } from "./content-list";

/** /home/lessons/:id and /home/extras/:id — title, description and a bibliography. */
export function ResourcePage({ type }: { type: "lessons" | "extras" }) {
	const { id } = useParams();
	const { data, error } = useContent<ResourceItem>(`${type}/${id}`);

	return (
		<DetailLayout type={type} data={data} error={error}>
			{(r) => (
				<section>
					<h2 className="mb-3 text-lg font-semibold">Bibliography</h2>
					<div className="grid gap-3 sm:grid-cols-2">
						{r.links.map((l) => (
							<ContentCard key={l.id} title={l.title} description={l.description} href={l.href} />
						))}
					</div>
				</section>
			)}
		</DetailLayout>
	);
}
