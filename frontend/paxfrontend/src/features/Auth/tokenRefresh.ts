export const refreshAccessToken = async () => {

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;

    const res = await fetch(
        "http://localhost:8080/realms/pax/protocol/openid-connect/token",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                client_id: "pax-frontend",
                refresh_token: refreshToken
            })
        }
    );

    if (!res.ok) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("expires_at");
        window.location.href = "/";
        return false;
    }

    const data = await res.json();

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    localStorage.setItem("expires_at", (Date.now() + data.expires_in * 1000).toString());

    window.dispatchEvent(new Event("auth-change"));

    return true;
};