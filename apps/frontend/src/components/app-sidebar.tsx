import {
	Binary,
	BookOpenText,
	ChevronRight,
	Home,
	Settings,
	Trophy,
	User,
} from "lucide-react";

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

const collapsibles = [
	{
		title: "Practice",
		icon: Binary,
		children: [
			{ title: "Challenges", url: "#" },
			{ title: "Problems", url: "#" },
			{ title: "Exercises", url: "#" },
			{ title: "Quizes", url: "#" },
		],
	},
	{
		title: "Resources",
		icon: BookOpenText,
		children: [
			{ title: "Lessons", url: "#" },
			{ title: "Extras", url: "#" },
		],
	},
];

const bitems = [
	{ title: "Leaderboard", url: "#", icon: Trophy },
	{ title: "Settings", url: "#", icon: Settings },
];

export function AppSidebar() {
	return (
		<Sidebar>
			<SidebarContent>
				{/* Upper */}
				<SidebarGroup>
					<SidebarGroupLabel>RAU DEV Logo</SidebarGroupLabel>
					<SidebarGroupContent>
						{/* Home */}
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton render={<a href="#" />}>
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
													<SidebarMenuSubButton render={<a href={child.url} />}>
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
									<SidebarMenuButton render={<a href={item.url} />}>
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
								<SidebarMenuButton render={<a href="#" />}>
									<User />
									<span>Account</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="gap-0">
				<SidebarGroupLabel className="h-auto">Version 0.0.1</SidebarGroupLabel>
				<SidebarGroupLabel>RAUDEV © 2026</SidebarGroupLabel>
				<SidebarGroupLabel className="h-auto">
					Romanian-American University
				</SidebarGroupLabel>
			</SidebarFooter>
		</Sidebar>
	);
}
