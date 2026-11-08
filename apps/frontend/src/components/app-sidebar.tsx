import {
	Binary,
	BookOpenText,
	ChevronRight,
	Home,
	Settings,
	Trophy,
	Info,
} from "lucide-react";
import { Link } from "react-router-dom";
import darkLogo from "@/assets/darklogo.png";
import logo from "@/assets/logo.png";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useTheme } from "@/lib/theme";

const collapsibles = [
	{
		title: "Practice",
		icon: Binary,
		children: [
			{ title: "Challenges", url: "/home/challenges" },
			{ title: "Problems", url: "/home/problems" },
			{ title: "Exercises", url: "/home/exercises" },
			{ title: "Quizzes", url: "/home/quizzes" },
		],
	},
	{
		title: "Resources",
		icon: BookOpenText,
		children: [
			{ title: "Lessons", url: "/home/lessons" },
			{ title: "Extras", url: "/home/extras" },
		],
	},
];

const bitems = [
	{ title: "Leaderboard", url: "/home/leaderboard", icon: Trophy },
	{ title: "Settings", url: "/home/settings", icon: Settings },
];

export function AppSidebar() {
	const { theme } = useTheme();

	return (
		<Sidebar>
			<SidebarContent>
				{/* Upper */}
				<SidebarGroup>
					<SidebarGroupLabel className="h-auto">
						<img src={theme === "dark" ? darkLogo : logo} alt="RAU DEV" className="h-32 w-auto" />
					</SidebarGroupLabel>
					<SidebarGroupContent>
						{/* Home */}
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton render={<Link to="/home" />}>
									<Home />
									<span>Home</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>

						{/* Collapsible items (Practice + Resources) */}
						<SidebarMenu>
							{collapsibles.map((item) => (
								<Collapsible
									key={item.title}
									className="group/collapsible"
									render={<SidebarMenuItem />}
								>
									<CollapsibleTrigger
										render={<SidebarMenuButton className="group/trigger" />}
									>
										<item.icon />
										<span>{item.title}</span>
										<ChevronRight className="ml-auto transition-transform group-data-[panel-open]/trigger:rotate-90" />
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
											{item.children.map((child) => (
												<SidebarMenuSubItem key={child.title}>
													<SidebarMenuSubButton
														render={<Link to={child.url} />}
													>
														<span>{child.title}</span>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											))}
										</SidebarMenuSub>
									</CollapsibleContent>
								</Collapsible>
							))}
						</SidebarMenu>

						{/* Leaderboard + Settings */}
						<SidebarMenu>
							{bitems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton render={<Link to={item.url} />}>
										<item.icon />
										<span>{item.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Bottom */}
				<SidebarGroup className="mt-auto">
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton render={<Link to="/home/about" />}>
									<Info />
									<span>About</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="gap-0">
				<SidebarGroupLabel className="h-auto">Version 0.0.1</SidebarGroupLabel>
				<SidebarGroupLabel>© {new Date().getFullYear()} RAUDEV</SidebarGroupLabel>
				<SidebarGroupLabel className="h-auto">
					Romanian-American University
				</SidebarGroupLabel>
			</SidebarFooter>
		</Sidebar>
	);
}
