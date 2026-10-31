import { BrowserRouter, Route, Routes } from "react-router-dom";
import { GuestRoute, ProtectedRoute } from "@/components/route-guards.tsx";
import FirstPage from "./FirstPage.tsx";
import ForgotPage from "./ForgotPage.tsx";
import HomePage from "./HomePage.tsx";
import LoginPage from "./LoginPage.tsx";
import ResetPage from "./ResetPage.tsx";
import SignupPage from "./SignupPage.tsx";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<FirstPage />} />
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
