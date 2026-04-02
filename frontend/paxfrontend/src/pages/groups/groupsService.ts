const API_URL = "http://localhost:8081/api/v1/groups";

export enum GroupPrivacy {
    PUBLIC = "PUBLIC",
    PRIVATE = "PRIVATE",
    HIDDEN = "HIDDEN"
}

export interface Group {
    id: number;
    name: string;
    description: string;
    groupPrivacy: GroupPrivacy;
    location?: string;
    ownerId?: string | number;
}

export interface CreateGroupDto {
    name: string;
    description: string;
    groupPrivacy: GroupPrivacy;
    location?: string;
}

export async function fetchGroupById(id: number): Promise<Group> {
    const token = localStorage.getItem("access_token");
    const headers: HeadersInit = {
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        "Content-Type": "application/json"
    };

    const response = await fetch(`${API_URL}/${id}`, {
        method: "GET",
        headers,
        mode: "cors"
    });

    if (!response.ok) {
        throw new Error(`Failed to load group: ${response.status}`);
    }

    return response.json();
}

export async function fetchAllGroups(): Promise<Group[]> {
    const token = localStorage.getItem("access_token");

    const headers: HeadersInit = {
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        "Content-Type": "application/json"
    };

    const response = await fetch("http://localhost:8081/api/v1/groups/all", {
        method: "GET",
        headers,
        mode: "cors"
    });

    if (!response.ok) {
        throw new Error(`Failed to load groups: ${response.status}`);
    }

    return response.json();
}

export async function fetchMyGroups(): Promise<Group[]> {
    const token = localStorage.getItem("access_token");

    const headers: HeadersInit = {
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        "Content-Type": "application/json"
    };

    const response = await fetch("http://localhost:8081/api/v1/groups/me", {
        method: "GET",
        headers,
        mode: "cors"
    });

    if (!response.ok) {
        throw new Error(`Failed to load groups: ${response.status}`);
    }

    return response.json();
}
export async function fetchUsersCount(): Promise<Number> {
    const token = localStorage.getItem("access_token");

    const headers: HeadersInit = {
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        "Content-Type": "application/json"
    };

    const response = await fetch("http://localhost:8081/api/v1/users/count", {
        method: "GET",
        headers,
        mode: "cors"
    });

    if (!response.ok) {
        throw new Error(`Failed to load users count: ${response.status}`);
    }

    return response.json();
}

export async function joinGroup(groupId: number): Promise<void> {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("You are not authorized");

    const response = await fetch(`http://localhost:8081/api/v1/groups/${groupId}/join`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        }
    });

    if (!response.ok) {
        throw new Error("Failed to join community on server");
    }
}
export async function leaveGroup(groupId: number): Promise<void> {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`http://localhost:8081/api/v1/groups/${groupId}/leave`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Leave failed");
}
export async function createGroup(data: any) {
    const token = localStorage.getItem("access_token");

    const payload = {
        id: null,
        name: data.name,
        description: data.description,
        groupPrivacy: data.visibility ? data.visibility.toUpperCase() : "PUBLIC",
        location: "Online",
        ownerId: null
    };

    console.log("Real JSON sent to server:", payload);

    const response = await fetch("http://localhost:8081/api/v1/groups", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorDetails = await response.json().catch(() => ({}));
        console.error("Server rejected request:", errorDetails);
        throw new Error("400 Bad Request");
    }

    return response.json();

}

export async function deleteGroup(groupId: number): Promise<void> {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("You are not authorized");

    const response = await fetch(`http://localhost:8081/api/v1/groups/${groupId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error("Failed to delete community");
    }
}

export async function updateGroup(groupId: number, data: any): Promise<Group> {
    const token = localStorage.getItem("access_token");

    const payload = {
        id: groupId,
        name: data.name,
        description: data.description,
        groupPrivacy: data.visibility ? data.visibility.toUpperCase() : "PUBLIC",
        location: data.location || "Online",
        ownerId: null
    };

    const response = await fetch(`http://localhost:8081/api/v1/groups/${groupId}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Backend rejected update request. Details:", errorData);
        throw new Error("Failed to update group");
    }

    return response.json();
}