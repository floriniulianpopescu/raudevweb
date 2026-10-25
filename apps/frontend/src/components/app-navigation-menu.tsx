import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export function AppNavigationMenu() {
	return (
		<NavigationMenu className="hidden max-w-full w-full md:flex">
			<NavigationMenuList className="w-full">
				{/* Left spacer, balances Account */}
				<NavigationMenuItem className="flex-1" aria-hidden />

				<NavigationMenuItem>
					<NavigationMenuLink className={navigationMenuTriggerStyle()}>
						Home
					</NavigationMenuLink>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuTrigger>Practice</NavigationMenuTrigger>
					<NavigationMenuContent>
						<NavigationMenuLink>Challenges</NavigationMenuLink>
						<NavigationMenuLink>Problems</NavigationMenuLink>
						<NavigationMenuLink>Exercises</NavigationMenuLink>
						<NavigationMenuLink>Quizes</NavigationMenuLink>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuTrigger>Resources</NavigationMenuTrigger>
					<NavigationMenuContent>
						<NavigationMenuLink>Lessons</NavigationMenuLink>
						<NavigationMenuLink>Extras</NavigationMenuLink>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink className={navigationMenuTriggerStyle()}>
						Leaderboard
					</NavigationMenuLink>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink className={navigationMenuTriggerStyle()}>
						Settings
					</NavigationMenuLink>
				</NavigationMenuItem>

				<NavigationMenuItem className="flex flex-1 justify-end">
					<NavigationMenuLink className={navigationMenuTriggerStyle()}>
						Account
					</NavigationMenuLink>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}
