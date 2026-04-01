export type Visibility = "public" | "private" | "hidden";

export interface CreateCommunityFormData {
    name: string;
    description: string;
    visibility: Visibility;
    isNsfw: boolean;
    category: string;
}
