import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { SessionCacheGuard } from "@/components/session-cache-guard.tsx";
import { queryClient } from "@/lib/query-client.ts";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<SessionCacheGuard />
			<App />
		</QueryClientProvider>
	</StrictMode>,
);
