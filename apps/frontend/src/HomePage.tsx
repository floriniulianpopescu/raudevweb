import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AppNavigationMenu } from "@/components/app-navigation-menu";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";

import { NotFoundView } from "@/components/not-found";
import { Skeleton } from "@/components/ui/skeleton";
import { lazyPage } from "@/lib/lazy-page";

// Each section is its own download, fetched the first time it is opened
const AppMainPage = lazyPage(() => import("@/components/app-main-page"), "AppMainPage");
const AppChallengesPage = lazyPage(() => import("@/components/app-challenges-page"), "AppChallengesPage");
const AppProblemsPage = lazyPage(() => import("@/components/app-problems-page"), "AppProblemsPage");
const AppExercisesPage = lazyPage(() => import("@/components/app-exercises-page"), "AppExercisesPage");
const AppQuizzesPage = lazyPage(() => import("@/components/app-quizzes-page"), "AppQuizzesPage");
const AppLessonsPage = lazyPage(() => import("@/components/app-lessons-page"), "AppLessonsPage");
const AppExtrasPage = lazyPage(() => import("@/components/app-extras-page"), "AppExtrasPage");
const AppLeaderboardPage = lazyPage(() => import("@/components/app-leaderboard-page"), "AppLeaderboardPage");
const AppSettingsPage = lazyPage(() => import("@/components/app-settings-page"), "AppSettingsPage");
const AppAboutPage = lazyPage(() => import("@/components/app-about-page"), "AppAboutPage");
const ChallengePage = lazyPage(() => import("@/components/challenge-page"), "ChallengePage");
const QuizPage = lazyPage(() => import("@/components/quiz-page"), "QuizPage");
const ResourcePage = lazyPage(() => import("@/components/resource-page"), "ResourcePage");

function HomePage() {
	return (
		<>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset>
					<header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
						<SidebarTrigger />
						<div className="flex flex-1 justify-center">
							<AppNavigationMenu />
						</div>
						<ThemeToggle />
					</header>
					{/* Not <main>: SidebarInset already renders the page's <main> landmark */}
					<div className="flex-1 p-6">
						<Suspense fallback={<Skeleton className="h-32 rounded-2xl" />}>
							<Routes>
								<Route index element={<AppMainPage />} />
								<Route path="challenges" element={<AppChallengesPage />} />
								<Route path="challenges/:id" element={<ChallengePage />} />
								<Route path="problems" element={<AppProblemsPage />} />
								<Route path="exercises" element={<AppExercisesPage />} />
								<Route path="quizzes" element={<AppQuizzesPage />} />
								<Route path="quizzes/:id" element={<QuizPage />} />
								<Route path="lessons" element={<AppLessonsPage />} />
								<Route path="lessons/:id" element={<ResourcePage type="lessons" />} />
								<Route path="extras" element={<AppExtrasPage />} />
								<Route path="extras/:id" element={<ResourcePage type="extras" />} />
								<Route path="leaderboard" element={<AppLeaderboardPage />} />
								<Route path="settings" element={<AppSettingsPage />} />
								<Route path="about" element={<AppAboutPage />} />
								<Route path="*" element={<NotFoundView backTo="/home" backLabel="Back to Home" />} />
							</Routes>
						</Suspense>
					</div>
				</SidebarInset>
			</SidebarProvider>
		</>
	);
}

export default HomePage;
