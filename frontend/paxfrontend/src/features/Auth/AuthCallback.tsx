import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export const AuthCallback = () => {
    const navigate = useNavigate();

    const isCalled = useRef(false);

    useEffect(() => {
        if (isCalled.current) return;

        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (!code) return;


        isCalled.current = true;

        const codeVerifier = localStorage.getItem("pkce_code_verifier");

        if (!codeVerifier) {
            console.error("Missing PKCE code_verifier");
            return;
        }

        fetch(`${import.meta.env.VITE_KEYCLOAK_URL}/realms/pax/protocol/openid-connect/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: "pax-frontend",
                code,
                redirect_uri: `${window.location.origin}/auth/callback`,
                code_verifier: codeVerifier,
            }),
        })
            .then(res => res.json())
            .then(data => {

                if (data.access_token) {
                    localStorage.setItem("access_token", data.access_token);
                    localStorage.setItem("refresh_token", data.refresh_token);
                    localStorage.setItem("expires_at", (Date.now() + data.expires_in * 1000).toString());
                    localStorage.removeItem("pkce_code_verifier");


                    window.dispatchEvent(new Event("auth-change"));

                    window.location.href = "/";
                } else {
                    console.error("Error getting token from Keycloak:", data);

                }
            })
            .catch(err => console.error("Network error during login:", err));
    }, [navigate]);

    return <div>Signing you in…</div>;
};