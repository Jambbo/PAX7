export const categories = [
    "All Categories",
    "Technology",
    "Art & Design",
    "Health & Fitness",
    "Gaming",
    "Business",
    "Music",
    "Literature",
    "Finance"
];

export interface Community {
    id: number;
    name: string;
    description: string;
    avatar: string;
    banner: string;
    members: number;
    posts: number;
    category: string;
    isPrivate: boolean;
    isJoined: boolean;
    isVerified: boolean;
    onlineMembers: number;
}


