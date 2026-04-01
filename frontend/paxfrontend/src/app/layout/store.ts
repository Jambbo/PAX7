import { configureStore } from '@reduxjs/toolkit';
// import cartReducer from '../features/basketSlice';
import notificationsReducer from '../../features/Notifications/notificationsSlice';

export const store = configureStore({
    reducer: {
        //TODO create reducers
        notifications: notificationsReducer,
    },
});

// Types for TS
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;