import {generatePKCE} from "./pkce";

const REDIRECT_URI = `${window.location.origin}/auth/callback`;

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL + "/realms/pax/protocol/openid-connect";
const CLIENT_ID = "pax-frontend";

const getInfoFromToken = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (e) {
        return null;
    }
};

export async function login() {

    const {codeVerifier, codeChallenge} = await generatePKCE();
    localStorage.setItem("pkce_code_verifier", codeVerifier);
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: "code",
        scope: "openid profile email",
        redirect_uri: REDIRECT_URI,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
    });

    window.location.href =
        `${KEYCLOAK_URL}/auth?${params.toString()}`;
}

export function logout() {

    const idToken = localStorage.getItem("id_token");
    const logoutUrl = `${KEYCLOAK_URL}/logout?client_id=${CLIENT_ID}` +
        `&post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("expires_at");



    window.location.href = logoutUrl;
}