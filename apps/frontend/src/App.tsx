import { BrowserRouter, Route, Routes } from "react-router-dom";
import FirstPage from "./FirstPage.tsx";
import HomePage from "./HomePage.tsx";
import SignupPage from "./SignupPage.tsx";
import LoginPage from "./LoginPage.tsx";
import ForgotPage from "./ForgotPage.tsx";
import ResetPage from "./ResetPage.tsx";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<FirstPage />} />
                <Route path="/home" element={<HomePage />} />
                {/*Check if already logged with cookies or stuff like that*/}
                <Route path="/signup" element={<SignupPage />} />
				<Route path="/login" element={<LoginPage />} />
                <Route path="/forgot" element={<ForgotPage />} />
                <Route path="/reset" element={<ResetPage />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
