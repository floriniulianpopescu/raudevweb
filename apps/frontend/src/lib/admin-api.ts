export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");

async function request<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, {
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		...init,
	});
	if (!res.ok) throw new Error((await res.text()) || res.statusText);
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

/** Read-only content endpoints for any signed-in user: /api/content/<path> */
export function contentApi<T>(path: string): Promise<T> {
	return request<T>(`${API_URL}/api/content/${path}`);
}
