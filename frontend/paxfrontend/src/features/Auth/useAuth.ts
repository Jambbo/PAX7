import { useEffect, useState } from "react";

export function useAuth() {
    const [authenticated, setAuthenticated] = useState(
        Boolean(localStorage.getItem("access_token"))
    );

    useEffect(() => {
        const handler = () => {
            const token = localStorage.getItem("access_token");

            setAuthenticated(Boolean(token && token !== "undefined"));
        };


        window.addEventListener("storage", handler);

        window.addEventListener("auth-change", handler);

        return () => {
            window.removeEventListener("storage", handler);
            window.removeEventListener("auth-change", handler);
        };
    }, []);

    return { authenticated };
}