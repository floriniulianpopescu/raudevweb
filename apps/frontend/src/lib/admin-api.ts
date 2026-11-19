export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");

/** A non-2xx API response. `message` is the response body, as before; `status` lets callers spot e.g. 404. */
export class ApiError extends Error {
	readonly status: number;
	constructor(status: number, message: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
}

export const isNotFound = (e: unknown) => e instanceof ApiError && e.status === 404;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, {
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		...init,
	});
	if (!res.ok) throw new ApiError(res.status, (await res.text()) || res.statusText);
	return (res.status === 204 ? undefined : await res.json()) as T;
}

/** Admin-only CRUD endpoints: /api/admin/<path> */
export function adminApi<T>(path: string, init?: RequestInit): Promise<T> {
	return request<T>(`${API_URL}/api/admin/${path}`, init);
}

/** GET any signed-in endpoint under /api/<path> (e.g. "leaderboard") */
export function apiGet<T>(path: string): Promise<T> {
	return request<T>(`${API_URL}/api/${path}`);
}

/** Send a write (PUT/DELETE/…) to any signed-in endpoint under /api/<path> */
export function apiSend<T>(path: string, method: string): Promise<T> {
	return request<T>(`${API_URL}/api/${path}`, { method });
}

/** Read-only content endpoints for any signed-in user: /api/content/<path> */
export function contentApi<T>(path: string): Promise<T> {
	return request<T>(`${API_URL}/api/content/${path}`);
}
