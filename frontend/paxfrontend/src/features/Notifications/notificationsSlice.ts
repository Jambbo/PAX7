import {createSlice, PayloadAction, createAsyncThunk} from '@reduxjs/toolkit';
import {
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    NotificationReadResponseDto
} from './notificationService';

interface NotificationsState {
    items: NotificationReadResponseDto[];
    unreadCount: number;
    loading: boolean;
    hasMore: boolean;
    page: number;
}

const initialState: NotificationsState = {
    items: [],
    unreadCount: 0,
    loading: false,
    hasMore: true,
    page: 0,
};
export const fetchInitialNotifications = createAsyncThunk(
    'notifications/fetchInitial',
    async (_, {rejectWithValue}) => {
        try {
            const response = await fetchNotifications(0, 20);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch notifications');
        }
    }
);

export const fetchMoreNotifications = createAsyncThunk(
    'notifications/fetchMore',
    async (page: number, {rejectWithValue}) => {
        try {
            const response = await fetchNotifications(page, 20);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch more notifications');
        }
    }
);

export const markNotificationRead = createAsyncThunk(
    'notifications/markRead',
    async (id: number, {rejectWithValue}) => {
        try {
            await markAsRead(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to mark as read');
        }
    }
);

export const markAllNotificationsRead = createAsyncThunk(
    'notifications/markAllRead',
    async (_, {rejectWithValue}) => {
        try {
            await markAllAsRead();
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to mark all as read');
        }
    }
);

export const deleteNotificationThunk = createAsyncThunk(
    'notifications/delete',
    async (id: number, {rejectWithValue}) => {
        try {
            await deleteNotification(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to delete notification');
        }
    }
);

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action: PayloadAction<NotificationReadResponseDto>) => {
            if (!state.items.find(n => n.id === action.payload.id)) {
                state.items.unshift(action.payload);
                if (action.payload.status === 'UNREAD') {
                    state.unreadCount += 1;
                }
            }
        },
        syncMissedNotifications: (state, action: PayloadAction<NotificationReadResponseDto[]>) => {
            const newNotifs = action.payload.filter(
                notif => !state.items.find(existing => existing.id === notif.id)
            );
            if (newNotifs.length > 0) {
                state.items = [...newNotifs, ...state.items];
                state.unreadCount += newNotifs.filter(n => n.status === 'UNREAD').length;
            }
        },
        removeNotificationLocally: (state, action: PayloadAction<number>) => {
            const idx = state.items.findIndex(n => n.id === action.payload);
            if (idx !== -1) {
                if (state.items[idx].status === 'UNREAD') {
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
                state.items.splice(idx, 1);
            }
        }
    },
    extraReducers: (builder) => {
        builder.addCase(fetchInitialNotifications.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(fetchInitialNotifications.fulfilled, (state, action) => {
            state.loading = false;
            state.items = action.payload.content || [];
            state.unreadCount = state.items.filter((i: any) => i.status === 'UNREAD').length;
            state.page = 0;
            state.hasMore = !action.payload.last;
        });
        builder.addCase(fetchInitialNotifications.rejected, (state) => {
            state.loading = false;
        });

        builder.addCase(fetchMoreNotifications.fulfilled, (state, action) => {
            const newItems = action.payload.content || [];
            const uniqueNew = newItems.filter(
                (n: any) => !state.items.find(i => i.id === n.id)
            );
            state.items = [...state.items, ...uniqueNew];
            state.page += 1;
            state.hasMore = !action.payload.last;

            state.unreadCount = state.items.filter(i => i.status === 'UNREAD').length;
        });

        builder.addCase(markNotificationRead.fulfilled, (state, action) => {
            const idx = state.items.findIndex(n => n.id === action.payload);
            if (idx !== -1 && state.items[idx].status === 'UNREAD') {
                state.items[idx].status = 'READ';
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        });

        builder.addCase(markAllNotificationsRead.fulfilled, (state) => {
            state.items.forEach(item => item.status = 'READ');
            state.unreadCount = 0;
        });

        builder.addCase(deleteNotificationThunk.fulfilled, (state, action) => {
            const idx = state.items.findIndex(n => n.id === action.payload);
            if (idx !== -1) {
                if (state.items[idx].status === 'UNREAD') {
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
                state.items.splice(idx, 1);
            }
        });
    }
});

export const {addNotification, syncMissedNotifications, removeNotificationLocally} = notificationsSlice.actions;

export default notificationsSlice.reducer;
