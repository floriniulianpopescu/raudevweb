import { AppMainPage } from "@/components/app-main-page";
import { AppNavigationMenu } from "@/components/app-navigation-menu";
import { AppSidebar } from "@/components/app-sidebar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";

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
					</header>
					<main className="flex-1 p-6">
						{/* Main page content goes here */}
						<AppMainPage />
					</main>
				</SidebarInset>
			</SidebarProvider>
		</>
	);
}

export default HomePage;
