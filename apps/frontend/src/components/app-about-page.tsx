import { StaffCard } from "@/components/staff-card";
import { STAFF } from "@/data/staff";

export function AppAboutPage() {
	return (
		<div>
			<h1 className="text-2xl font-bold">About</h1>
			<p className="text-muted-foreground mt-2">We are a programming club.</p>

			<section className="mt-10">
				<h2 className="text-xl font-semibold">Our team</h2>
				<p className="text-muted-foreground mt-1 text-sm">The people who keep the club running.</p>
				<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{STAFF.map((m, i) => (
						<StaffCard key={`${m.name}-${i}`} member={m} />
					))}
				</div>
			</section>
		</div>
	);
}
