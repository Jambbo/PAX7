import { apiClient } from '../../shared/api/apiClient';

export interface UserReadResponseDto {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
}

export interface NotificationReadResponseDto {
    id: number;
    recipient: UserReadResponseDto;
    sender: UserReadResponseDto;
    type: string;
    status: 'READ' | 'UNREAD';
    referenceId: string;
    createdAt: string;
}

export const fetchNotifications = async (page = 0, size = 20) => {
    const response = await apiClient.get(`/api/v1/notifications?page=${page}&size=${size}`);
    return response.data;
};

export const syncNotifications = async (lastId = 0) => {
    const response = await apiClient.get(`/api/v1/notifications/sync?lastId=${lastId}`);
    return response.data;
};

export const markAsRead = async (id: number) => {
    await apiClient.put(`/api/v1/notifications/${id}/read`);
};

export const markAllAsRead = async () => {
    await apiClient.put(`/api/v1/notifications/read-all`);
};

export const deleteNotification = async (id: number) => {
    await apiClient.delete(`/api/v1/notifications/${id}`);
};

export const deleteAllNotifications = async () => {
    await apiClient.delete(`/api/v1/notifications`);
};