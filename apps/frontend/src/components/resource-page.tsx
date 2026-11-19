import { useParams } from "react-router-dom";
import type { ResourceItem } from "@raudevweb/shared";
import { ContentCard } from "./content-card";
import { DetailLayout, useContent } from "./content-list";
import { MarkdownBody } from "./markdown";

/** /home/lessons/:id and /home/extras/:id — title, description, optional Markdown body, then the sources. */
export function ResourcePage({ type }: { type: "lessons" | "extras" }) {
	const { id } = useParams();
	const content = useContent<ResourceItem>(`${type}/${id}`);

	return (
		<DetailLayout type={type} content={content}>
			{(r) => (
				<>
					{r.body?.trim() && (
						<article>
							<MarkdownBody>{r.body}</MarkdownBody>
						</article>
					)}
					<section>
						<h2 className="mb-3 text-lg font-semibold">Sources</h2>
						<div className="grid gap-3 sm:grid-cols-2">
							{r.links.map((l) => (
								<ContentCard key={l.id} title={l.title} description={l.description} href={l.href} />
							))}
						</div>
					</section>
				</>
			)}
		</DetailLayout>
	);
}
