import { Route, Routes } from "react-router-dom";
import { AppMainPage } from "@/components/app-main-page";
import { AppNavigationMenu } from "@/components/app-navigation-menu";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";

import { AppChallengesPage } from "@/components/app-challenges-page";
import { AppProblemsPage } from "@/components/app-problems-page";
import { AppExercisesPage } from "@/components/app-exercises-page";
import { AppQuizzesPage } from "@/components/app-quizzes-page";
import { AppLessonsPage } from "@/components/app-lessons-page";
import { AppExtrasPage } from "@/components/app-extras-page";
import { AppLeaderboardPage } from "@/components/app-leaderboard-page";
import { AppSettingsPage } from "@/components/app-settings-page";
import { AppAboutPage } from "@/components/app-about-page";
import { ChallengePage } from "@/components/challenge-page";
import { QuizPage } from "@/components/quiz-page";
import { ResourcePage } from "@/components/resource-page";

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
					<main className="flex-1 p-6">
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
						</Routes>
					</main>
				</SidebarInset>
			</SidebarProvider>
		</>
	);
}

export default HomePage;
