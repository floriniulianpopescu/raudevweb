import { BrowserRouter, Route, Routes } from "react-router-dom";
import FirstPage from "./FirstPage.tsx";
//import HomePage from "./HomePage.tsx";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<FirstPage />} />
                {/*Check if already logged with cookies or stuff like that*/}
                {/*<Route path="/signup" element={<SignUpPage />} /> */}
				{/* add these when the pages exist */}
				{/* <Route path="/login" element={<LoginPage />} /> */}
			</Routes>
		</BrowserRouter>
	);
}

export default App;
