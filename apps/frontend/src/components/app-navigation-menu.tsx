import { Link } from "react-router-dom";
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
					<NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link to="/home" />}>
						Home
					</NavigationMenuLink>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuTrigger>Practice</NavigationMenuTrigger>
					<NavigationMenuContent>
						<NavigationMenuLink render={<Link to="/home/challenges" />}>Challenges</NavigationMenuLink>
						<NavigationMenuLink render={<Link to="/home/problems" />}>Problems</NavigationMenuLink>
						<NavigationMenuLink render={<Link to="/home/exercises" />}>Exercises</NavigationMenuLink>
						<NavigationMenuLink render={<Link to="/home/quizes" />}>Quizes</NavigationMenuLink>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuTrigger>Resources</NavigationMenuTrigger>
					<NavigationMenuContent>
						<NavigationMenuLink render={<Link to="/home/lessons" />}>Lessons</NavigationMenuLink>
						<NavigationMenuLink render={<Link to="/home/extras" />}>Extras</NavigationMenuLink>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link to="/home/leaderboard" />}>
						Leaderboard
					</NavigationMenuLink>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link to="/home/settings" />}>
						Settings
					</NavigationMenuLink>
				</NavigationMenuItem>

				<NavigationMenuItem className="flex flex-1 justify-end">
					<NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link to="/home/account" />}>
						Account
					</NavigationMenuLink>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}
