import { useEffect, useRef } from "react";
import { refreshAccessToken } from "./tokenRefresh";

export const useTokenRefresh = () => {

    const refreshing = useRef(false);

    useEffect(() => {

        const interval = setInterval(async () => {

            if (refreshing.current) return;

            const expiresAt = Number(localStorage.getItem("expires_at"));
            if (!expiresAt) return;

            const now = Date.now();

            if (expiresAt - now < 60000) {
                refreshing.current = true;
                await refreshAccessToken();
                refreshing.current = false;
            }

        }, 10000);

        return () => clearInterval(interval);

    }, []);
};