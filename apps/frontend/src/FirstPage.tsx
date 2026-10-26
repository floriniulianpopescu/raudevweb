import {
	Calendar,
	Clock,
	Code2,
	ExternalLink,
	MapPin,
	MessagesSquare,
	Mic,
	Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const JOIN_FORM_URL =
	"https://forms.cloud.microsoft/pages/responsepage.aspx?id=Fa--e4Wf-020_9kgcQfNfchESy1MQ3pAnsE6zKK_XZBUM1hQRUM3U0pYTkowWUw5SksxQjFOTURGOC4u&route=shorturl";
const INSTAGRAM_URL = "https://www.instagram.com/raudev.club/";
const LINKEDIN_URL = "https://www.linkedin.com/company/rau-dev/posts/";

const FEATURES = [
	{
		icon: Code2,
		title: "Coding Challenges",
		description:
			"Sharpen problem-solving skills with weekly algorithm challenges solved together.",
	},
	{
		icon: MessagesSquare,
		title: "Mock Interviews",
		description:
			"Practice technical & behavioral interviews in a friendly, supportive environment.",
	},
	{
		icon: Mic,
		title: "Guest Speakers",
		description:
			"Gain real-world career advice and industry insights from experienced IT pros.",
	},
	{
		icon: Users,
		title: "Student Community",
		description:
			"Connect, collaborate, and build innovative projects with RAU developers.",
	},
];

const MEETING_DETAILS = [
	{ icon: Calendar, title: "Every Friday", subtitle: "Weekly session" },
	{ icon: Clock, title: "11:00 – 14:00", subtitle: "3 hours duration" },
	{ icon: MapPin, title: "Room 515", subtitle: "Campus building" },
];

export default function FirstPage() {
	return (
		<div className="relative isolate min-h-screen bg-background text-foreground flex flex-col justify-between overflow-x-hidden">
			{/* BACKGROUND GRADIENT */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_15%,transparent),transparent_70%)]"
			/>

			<div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12 lg:py-16 space-y-12 sm:space-y-16">
				{/* 1. HERO SECTION */}
				<section className="flex flex-col items-center text-center max-w-3xl mx-auto pt-4 sm:pt-6">
					<Badge
						variant="secondary"
						className="mb-6 gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium shadow-sm border border-primary/10"
					>
						<Code2 className="h-4 w-4 text-primary shrink-0" />
						Romanian-American University
					</Badge>

					<h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl leading-[1.1]">
						Welcome to{" "}
						<span className="bg-gradient-to-r from-primary via-primary/90 to-primary/60 bg-clip-text text-transparent">
							RAUDEV
						</span>
					</h1>

					<p className="mt-5 text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl text-balance">
						The software engineering and programming student club at RAU. Solve
						challenges, practice interviews, learn from industry experts, and
						grow together.
					</p>

					<div className="mt-8 grid grid-cols-2 gap-2 w-full max-w-xs sm:max-w-sm">
						<Button
							size="sm"
							className="w-full h-10 text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 shadow-md transition-transform active:scale-[0.98]"
							render={<Link to="/signup" />}
							nativeButton={false}
						>
							Sign up
						</Button>
						<Button
							size="sm"
							variant="outline"
							className="w-full h-10 text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 border-primary/20 hover:bg-primary/5 transition-transform active:scale-[0.98]"
							render={<Link to="/login" />}
							nativeButton={false}
						>
							Log in
						</Button>
					</div>
				</section>

				{/* 2. WHAT WE DO */}
				<section className="space-y-6">
					<div className="text-center max-w-xl mx-auto">
						<h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
							What We Do
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Everything you need to grow as a software developer, built into
							one club.
						</p>
					</div>

					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{FEATURES.map(({ icon: Icon, title, description }) => (
							<Card
								key={title}
								className="flex flex-col justify-between transition-all hover:border-primary/40 hover:shadow-sm"
							>
								<CardHeader className="p-5 pb-2">
									<div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
										<Icon className="h-5 w-5" />
									</div>
									<CardTitle className="text-base">{title}</CardTitle>
								</CardHeader>
								<CardContent className="p-5 pt-0">
									<p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
										{description}
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				</section>

				{/* 3. PARALLEL BOTTOM ROW: MEETINGS + COMMUNITY */}
				<section className="grid gap-6 md:grid-cols-2 items-stretch">
					{/* JOIN OUR MEETINGS (LEFT) */}
					<Card className="border-primary/20 bg-card/60 shadow-sm backdrop-blur-sm flex flex-col justify-between p-1">
						<CardHeader className="p-4 pb-2">
							<Badge
								variant="outline"
								className="w-fit mb-2 text-primary border-primary/30 text-xs px-2.5 py-0.5"
							>
								Weekly Schedule
							</Badge>
							<CardTitle className="text-xl sm:text-2xl">
								Join Our Meetings
							</CardTitle>
							<p className="text-xs text-muted-foreground mt-0.5">
								All RAU students are welcome — no prior experience required!
							</p>
						</CardHeader>
						<CardContent className="p-4 pt-2 space-y-2.5">
							{MEETING_DETAILS.map(({ icon: Icon, title, subtitle }) => (
								<div
									key={title}
									className="flex items-center gap-3 rounded-lg border bg-background/80 p-2.5 transition-colors hover:border-primary/40"
								>
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
										<Icon className="h-4 w-4" />
									</div>
									<div>
										<p className="text-sm font-semibold leading-none">
											{title}
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											{subtitle}
										</p>
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					{/* BECOME PART OF COMMUNITY (RIGHT) */}
					<Card className="border-primary/20 bg-muted/30 shadow-sm flex flex-col justify-between p-1">
						<div>
							<CardHeader className="p-4 pb-2">
								<Badge
									variant="outline"
									className="w-fit mb-2 text-primary border-primary/30 text-xs px-2.5 py-0.5"
								>
									Get Involved
								</Badge>
								<CardTitle className="text-xl sm:text-2xl">
									Become Part of the Community
								</CardTitle>
								<p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
									Fill in the membership form to join our official active member
									list, and follow us on social channels for event updates.
								</p>
							</CardHeader>
						</div>

						<CardContent className="p-4 pt-2 space-y-2.5">
							<Button
								size="default"
								className="w-full h-11 text-sm font-semibold inline-flex items-center justify-center gap-2"
								render={
									<a
										href={JOIN_FORM_URL}
										target="_blank"
										rel="noopener noreferrer"
									/>
								}
								nativeButton={false}
							>
								<span>Join the Club</span>
								<ExternalLink className="h-3.5 w-3.5" />
							</Button>

							<div className="grid grid-cols-2 gap-2 pt-0.5">
								<Button
									variant="outline"
									size="sm"
									className="w-full h-10 text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5"
									render={
										<a
											href={INSTAGRAM_URL}
											target="_blank"
											rel="noopener noreferrer"
										/>
									}
									nativeButton={false}
								>
									<svg
										className="h-3.5 w-3.5 fill-current shrink-0"
										viewBox="0 0 24 24"
									>
										<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
									</svg>
									<span>Instagram</span>
									<ExternalLink className="h-3 w-3" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="w-full h-10 text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5"
									render={
										<a
											href={LINKEDIN_URL}
											target="_blank"
											rel="noopener noreferrer"
										/>
									}
									nativeButton={false}
								>
									<svg
										className="h-3.5 w-3.5 fill-current shrink-0"
										viewBox="0 0 24 24"
									>
										<path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
									</svg>
									<span>LinkedIn</span>
									<ExternalLink className="h-3 w-3" />
								</Button>
							</div>
						</CardContent>
					</Card>
				</section>
			</div>

			{/* FOOTER */}
			<footer className="border-t py-6 text-center text-xs text-muted-foreground">
				© {new Date().getFullYear()} RAUDEV · Romanian-American University
			</footer>
		</div>
	);
}
