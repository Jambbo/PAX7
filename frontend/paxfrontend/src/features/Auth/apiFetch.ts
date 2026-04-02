import { refreshAccessToken } from "./tokenRefresh";

export async function apiFetch(input: RequestInfo, init?: RequestInit) {
    const expiresAt = Number(localStorage.getItem("expires_at"));

    if (expiresAt && expiresAt - Date.now() < 60_000) {
        await refreshAccessToken();
    }

    const token = localStorage.getItem("access_token");
    const res = await fetch(input, {
        ...init,
        headers: {
            ...init?.headers,
            Authorization: `Bearer ${token}`,
        },
    });

    if (res.status === 401) {
        const ok = await refreshAccessToken();
        if (ok) {
            const newToken = localStorage.getItem("access_token");
            return fetch(input, {
                ...init,
                headers: {
                    ...init?.headers,
                    Authorization: `Bearer ${newToken}`,
                },
            });
        }
    }

    return res;
}