// Build-time only (scripts/prerender.mjs): renders the landing page to static HTML so
// crawlers and link-preview bots see real content instead of an empty <div id="root">.
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FirstPage from "./FirstPage";

export function render() {
	return renderToString(
		<QueryClientProvider client={new QueryClient()}>
			<StaticRouter location="/">
				<FirstPage />
			</StaticRouter>
		</QueryClientProvider>,
	);
}
