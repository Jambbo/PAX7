const API_URL = "http://localhost:8081/api/v1/users";

export interface UserData {
    id: string;
    username: string;
    email: string;
    createdAt?: string;
    status?: string;
    bio?: string;
    location?: string;
    website?: string;
}

// Отримуємо БУДЬ-ЯКОГО юзера за його ID
export async function fetchUserById(userId: string): Promise<UserData> {
    const token = localStorage.getItem("access_token");
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token && token !== "undefined") {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/${userId}`, {
        method: "GET",
        headers
    });

    if (!response.ok) throw new Error("Не вдалося завантажити профіль");
    return response.json();
}

// Отримуємо поточного юзера з токена
export async function fetchCurrentUser(): Promise<UserData> {
    const token = localStorage.getItem("access_token");
    if (!token || token === "undefined") throw new Error("Ви не авторизовані");

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;

    return fetchUserById(userId);
}

// Оновлюємо дані юзера
export async function updateUser(userId: string, data: any): Promise<UserData> {
    const token = localStorage.getItem("access_token");
    if (!token || token === "undefined") throw new Error("Ви не авторизовані");

    const payload = {
        username: data.username,
        email: data.email,
        bio: data.bio || "",
        location: data.location || "",
        website: data.website || ""
    };

    const response = await fetch(`${API_URL}/${userId}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error("Не вдалося оновити профіль");
    }
    return response.json();
}