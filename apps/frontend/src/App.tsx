import { Suspense } from "react";
import { createBrowserRouter, Route, RouterProvider, Routes, ScrollRestoration, useLocation } from "react-router-dom";
import { RouteError } from "@/components/route-error.tsx";
import { GuestRoute, ProtectedRoute } from "@/components/route-guards.tsx";
import { ThemeToggle } from "@/components/theme-toggle.tsx";
import { lazyPage } from "@/lib/lazy-page.ts";
import FirstPage from "./FirstPage.tsx";

// The landing page ships in the main bundle; every other page is downloaded when first opened
const HomePage = lazyPage(() => import("./HomePage.tsx"), "default");
const LoginPage = lazyPage(() => import("./LoginPage.tsx"), "default");
const SignupPage = lazyPage(() => import("./SignupPage.tsx"), "default");
const ForgotPage = lazyPage(() => import("./ForgotPage.tsx"), "default");
const ResetPage = lazyPage(() => import("./ResetPage.tsx"), "default");
const VerifyEmailPage = lazyPage(() => import("./VerifyEmailPage.tsx"), "default");
const NotFoundPage = lazyPage(() => import("@/components/not-found.tsx"), "NotFoundPage");

/** Floating theme button for the guest pages (/home has one in its header). */
function GuestThemeToggle() {
	const { pathname } = useLocation();
	if (pathname.startsWith("/home")) return null;
	return (
		<ThemeToggle className="fixed top-3 right-3 z-50 border bg-background/80 shadow-sm backdrop-blur" />
	);
}

/** Every page. Kept as one <Routes> tree (HomePage nests its own) inside a single data-router route. */
function AppRoutes() {
	return (
		<>
			{/* New pages start at the top; Back/Forward return to where you were */}
			<ScrollRestoration />
			<GuestThemeToggle />
			<Suspense fallback={null}>
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
					{/* Not guest-only: signed-in users also reset via Settings → email link */}
					<Route path="/reset" element={<ResetPage />} />
					{/* Confirmation-email landing page; not guest-only since the link logs the user in */}
					<Route path="/verify-email" element={<VerifyEmailPage />} />
					<Route path="*" element={<NotFoundPage />} />
				</Routes>
			</Suspense>
		</>
	);
}

// A data router is needed for <ScrollRestoration> and the crash fallback (errorElement)
const router = createBrowserRouter([{ path: "*", element: <AppRoutes />, errorElement: <RouteError /> }]);

export default function App() {
	return <RouterProvider router={router} />;
}
