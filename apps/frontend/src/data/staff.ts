/**
 * Managing staff shown on the About page.
 *
 * Photos: put the image in `apps/frontend/public/staff/` and reference it as
 * "/staff/<file>". Square images (e.g. 400×400 JPG/WebP) look best. Leave
 * `photo` out to show the person's initials instead.
 */
export type StaffMember = {
	name: string;
	role: string;
	photo?: string;
	bio?: string;
	links?: { label: string; href: string }[];
};

// TODO: replace these placeholders with the real team
export const STAFF: StaffMember[] = [
	{ name: "First Last", role: "President", bio: "Short line about this person." },
	{ name: "First Last", role: "Vice President" },
	{ name: "First Last", role: "Technical Lead" },
	{ name: "First Last", role: "Events Coordinator" },
];
