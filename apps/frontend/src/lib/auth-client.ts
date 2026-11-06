import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  // Matches the backend `admin` plugin, so session.user.role is typed
  plugins: [adminClient()],
});
