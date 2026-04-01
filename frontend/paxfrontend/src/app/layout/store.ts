import { configureStore } from '@reduxjs/toolkit';
// import cartReducer from '../features/basketSlice';

export const store = configureStore({
    reducer: {
        //TODO create reducers
    },
});

// Types for TS
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;