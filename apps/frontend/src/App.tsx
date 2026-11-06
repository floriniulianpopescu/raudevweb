import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { GuestRoute, ProtectedRoute } from "@/components/route-guards.tsx";
import { ThemeToggle } from "@/components/theme-toggle.tsx";
import FirstPage from "./FirstPage.tsx";
import ForgotPage from "./ForgotPage.tsx";
import HomePage from "./HomePage.tsx";
import LoginPage from "./LoginPage.tsx";
import ResetPage from "./ResetPage.tsx";
import SignupPage from "./SignupPage.tsx";

/** Floating theme button for the guest pages (/home has one in its header). */
function GuestThemeToggle() {
	const { pathname } = useLocation();
	if (pathname.startsWith("/home")) return null;
	return (
		<ThemeToggle className="fixed top-3 right-3 z-50 border bg-background/80 shadow-sm backdrop-blur" />
	);
}

function App() {
	return (
		<BrowserRouter>
			<GuestThemeToggle />
			<Routes>
				<Route
					path="/"
					element={
						<GuestRoute>
							<FirstPage />
						</GuestRoute>
					}
				/>
				<Route
					path="/home/*"
					element={
						<ProtectedRoute>
							<HomePage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/signup"
					element={
						<GuestRoute>
							<SignupPage />
						</GuestRoute>
					}
				/>
				<Route
					path="/login"
					element={
						<GuestRoute>
							<LoginPage />
						</GuestRoute>
					}
				/>
				<Route
					path="/forgot"
					element={
						<GuestRoute>
							<ForgotPage />
						</GuestRoute>
					}
				/>
				<Route
					path="/reset"
					element={
						<GuestRoute>
							<ResetPage />
						</GuestRoute>
					}
				/>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
