import { useState } from "react";
import { ExternalLinkIcon } from "lucide-react";
import type { StaffMember } from "@/data/staff";

const initials = (name: string) =>
	name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((w) => w[0]?.toUpperCase())
		.join("");

/** Photo (or initials), name, role, optional bio and links. */
export function StaffCard({ member }: { member: StaffMember }) {
	const [broken, setBroken] = useState(false);
	const showPhoto = member.photo && !broken;

	return (
		<article className="flex flex-col items-center rounded-2xl border bg-card p-6 text-center text-card-foreground shadow-sm">
			{showPhoto ? (
				<img
					src={member.photo}
					alt={member.name}
					loading="lazy"
					onError={() => setBroken(true)}
					className="size-28 rounded-full object-cover ring-4 ring-primary/10"
				/>
			) : (
				<span
					aria-hidden
					className="flex size-28 items-center justify-center rounded-full bg-primary/10 text-3xl font-semibold text-primary ring-4 ring-primary/5"
				>
					{initials(member.name) || "?"}
				</span>
			)}

			<h3 className="mt-4 font-semibold">{member.name}</h3>
			<p className="text-sm font-medium text-primary">{member.role}</p>
			{member.bio && <p className="mt-2 text-sm text-muted-foreground">{member.bio}</p>}

			{member.links && member.links.length > 0 && (
				<div className="mt-3 flex flex-wrap justify-center gap-3">
					{member.links.map((l) => (
						<a
							key={l.href}
							href={l.href}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
						>
							{l.label} <ExternalLinkIcon className="size-3" />
						</a>
					))}
				</div>
			)}
		</article>
	);
}
