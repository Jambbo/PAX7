const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/v1/posts`;

export interface Post {
    id: number;
    text: string;
    views: number;
    likes: number;
    createdAt: string;
    updatedAt: string;

    authorUsername?: string;
    authorId?: string;
    groupId?: number;
    groupName?: string;

    images?: string[];
}

export async function fetchAllPosts(): Promise<Post[]> {
    const token = localStorage.getItem("access_token");
    const headers: HeadersInit = {
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        "Content-Type": "application/json"
    };

    const response = await fetch(`${API_URL}/all?t=${new Date().getTime()}`, {
        method: "GET",
        headers,
        cache: "no-store",
        mode: "cors"
    });

    if (!response.ok) {
        throw new Error("Failed to load all posts");
    }

    return response.json();
}

export async function fetchGroupPosts(groupId: number): Promise<Post[]> {
    const token = localStorage.getItem("access_token");
    const headers: HeadersInit = {
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        "Content-Type": "application/json"
    };

    const response = await fetch(`${API_URL}/group/${groupId}?t=${new Date().getTime()}`, {
        method: "GET",
        headers,
        cache: "no-store",
        mode: "cors"
    });

    if (!response.ok) {
        throw new Error("Failed to load community posts");
    }

    return response.json();
}


export interface CreatePostDto {
    text: string;
    groupId: number;
}

export async function createPost(data: CreatePostDto): Promise<Post> {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("You are not authorized");

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error("Failed to create post");
    }

    let newPost = await response.json();

    if (!newPost.id) {
        try {
            const allPostsRes = await fetch(`${API_URL}/all?t=${Date.now()}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (allPostsRes.ok) {
                const allPosts = await allPostsRes.json();
                const matchedPost = allPosts.find((p: any) => p.text === data.text);
                if (matchedPost && matchedPost.id) {
                    newPost = matchedPost;
                }
            }
        } catch (e) {
            console.error("Failed to extract ID for the new post", e);
        }
    }

    return newPost;
}
export async function deletePost(postId: number): Promise<void> {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/posts/${postId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error("Failed to delete post");
    }
}
export async function likePost(postId: number): Promise<Post> {
    const token = localStorage.getItem("access_token");
    const headers: HeadersInit = {
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };

    const response = await fetch(`${API_URL}/${postId}/like`, {
        method: "POST",
        headers
    });

    if (!response.ok) {
        throw new Error("Failed to change like status");
    }

    const text = await response.text();
    return text ? JSON.parse(text) : { id: postId };
}

export async function updatePost(postId: number, data: UpdatePostDto): Promise<Post> {
    const token = localStorage.getItem("access_token");
    const headers: HeadersInit = {
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        "Content-Type": "application/json"
    };

    const response = await fetch(`${API_URL}/${postId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error("Backend rejected request (400):", errorData);
        throw new Error("Failed to update post");
    }

    return response.json();
}


export interface Comment {
    id: number;
    content: string;
    authorId: string;
    authorUsername: string;
    postId: number;
    likes: number;
    dislikes?: number;
    createdAt: string;
}

export async function fetchComments(postId: number): Promise<Comment[]> {
    const token = localStorage.getItem("access_token");
    const headers: HeadersInit = {
        ...(token && token !== "undefined" ? { "Authorization": `Bearer ${token}` } : {}),
        "Content-Type": "application/json"
    };

    const response = await fetch(`${API_URL}/${postId}/comments`, {
        method: "GET",
        headers,
        mode: "cors"
    });

    if (!response.ok) throw new Error("Failed to load comments");
    return response.json();
}

export async function createComment(postId: number, text: string): Promise<Comment> {
    const token = localStorage.getItem("access_token");
    if (!token || token === "undefined") throw new Error("Unauthorized");

    const response = await fetch(`${API_URL}/${postId}/comments`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: text })
    });

    if (!response.ok) throw new Error("Failed to create comment");
    return response.json();
}

export async function updateComment(postId: number, commentId: number, text: string): Promise<Comment> {
    const token = localStorage.getItem("access_token");
    if (!token || token === "undefined") throw new Error("Unauthorized");

    const response = await fetch(`${API_URL}/${postId}/comments/${commentId}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: text })
    });

    if (!response.ok) throw new Error("Failed to update comment");
    return response.json();
}

export async function deleteComment(postId: number, commentId: number): Promise<void> {
    const token = localStorage.getItem("access_token");
    if (!token || token === "undefined") throw new Error("Unauthorized");

    const response = await fetch(`${API_URL}/${postId}/comments/${commentId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok && response.status !== 204 && response.status !== 200) {
        throw new Error("Failed to delete comment");
    }
}

export async function likeComment(postId: number, commentId: number): Promise<Comment> {
    const token = localStorage.getItem("access_token");
    if (!token || token === "undefined") throw new Error("Unauthorized");

    const response = await fetch(`${API_URL}/${postId}/comments/${commentId}/like`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error("Failed to like comment");
    return response.json();
}

export async function dislikeComment(postId: number, commentId: number): Promise<Comment> {
    const token = localStorage.getItem("access_token");
    if (!token || token === "undefined") throw new Error("Unauthorized");

    const response = await fetch(`${API_URL}/${postId}/comments/${commentId}/dislike`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error("Failed to dislike comment");
    return response.json();
}

export async function removeCommentInteraction(postId: number, commentId: number): Promise<Comment> {
    const token = localStorage.getItem("access_token");
    if (!token || token === "undefined") throw new Error("Unauthorized");

    const response = await fetch(`${API_URL}/${postId}/comments/${commentId}/interaction`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error("Failed to remove interaction");
    return response.json();
}

export type PostSortType = 'date' | 'likes';

export function sortPosts(posts: Post[], sortBy: PostSortType = 'date'): Post[] {
    return [...posts].sort((a, b) => {
        if (sortBy === 'likes') {
            return (b.likes || 0) - (a.likes || 0);
        }

        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
    });
}

export async function addBookmark(postId: number): Promise<void> {
    const token = localStorage.getItem("access_token");
    if (!token || token === "undefined") throw new Error("Unauthorized");

    const response = await fetch(`${API_URL}/${postId}/bookmark`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) throw new Error("Failed to add bookmark");
}

export async function removeBookmark(postId: number): Promise<void> {
    const token = localStorage.getItem("access_token");
    if (!token || token === "undefined") throw new Error("Unauthorized");

    const response = await fetch(`${API_URL}/${postId}/bookmark`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) throw new Error("Failed to remove bookmark");
}

export async function fetchBookmarks(): Promise<Post[]> {
    const token = localStorage.getItem("access_token");
    if (!token || token === "undefined") return [];

    const response = await fetch(`${API_URL}/bookmarks`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) throw new Error("Failed to fetch bookmarks");
    return response.json();
}

const handleSaveToggle = async (postId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const isSaved = savedPosts.has(postId);

    if (isSaved) {
        setSavedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
        try { await removeBookmark(postId); } catch (err) {}
    } else {
        setSavedPosts(prev => new Set(prev).add(postId));
        try { await addBookmark(postId); } catch (err) {}
    }

    localStorage.setItem('pax_saved_posts', JSON.stringify(Array.from(savedPosts)));
};