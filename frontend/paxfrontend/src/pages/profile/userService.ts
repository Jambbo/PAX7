const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/v1/users`;
import { apiFetch } from '../../features/Auth/apiFetch';

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

    if (!response.ok) throw new Error("Failed to load profile");
    return response.json();
}

export async function fetchCurrentUser(): Promise<UserData> {
    const token = localStorage.getItem("access_token");
    if (!token || token === "undefined") throw new Error("You are not authorized");

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;

    return fetchUserById(userId);
}

export async function updateUser(userId: string, data: any): Promise<UserData> {
    const token = localStorage.getItem("access_token");
    if (!token || token === "undefined") throw new Error("You are not authorized");

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
        throw new Error("Failed to update profile");
    }
    return response.json();
}

const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    if (!token || token === "undefined") throw new Error("You are not authorized");
    return {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };
};

export const sendFriendRequest = async (userId: string) => {
    const response = await fetch(`${API_URL}/${userId}/friend-request`, { method: 'POST', headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to send friend request");
};

export const acceptFriendRequest = async (notificationId: number, senderId: string) => {
    const response = await fetch(`${API_URL}/friend-request/${notificationId}/accept?senderId=${senderId}`, { method: 'POST', headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to accept friend request");
};

export const declineFriendRequest = async (notificationId: number) => {
    const response = await fetch(`${API_URL}/friend-request/${notificationId}/decline`, { method: 'POST', headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to decline friend request");
};

export const fetchMyFriends = async (): Promise<UserData[]> => {
    const response = await fetch(`${API_URL}/me/friends`, { method: 'GET', headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to fetch friends");
    return response.json();
};

export const toggleProfilePrivacy = async () => {
    const response = await fetch(`${API_URL}/me/profile-privacy`, { method: 'PATCH', headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to toggle profile privacy");
    return response.json();
};

export const checkFriendshipStatus = async (userId: string): Promise<{status: string}> => {
    const res = await apiFetch(`${API_URL}/${userId}/friendship-status`, { method: 'GET' });
    return res.json();
};

export const removeFriendCall = async (userId: string): Promise<void> => {
    await apiFetch(`${API_URL}/${userId}/friend`, { method: 'DELETE' });
};

export const fetchOutgoingRequests = async (): Promise<UserData[]> => {
    const res = await apiFetch(`${API_URL}/me/friend-requests/outgoing`, { method: 'GET' });
    return res.json();
};
