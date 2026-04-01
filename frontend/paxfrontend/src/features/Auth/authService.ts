import {generatePKCE} from "./pkce";

const KEYCLOAK_URL = "http://localhost:8080";
const REALM = "pax";
const CLIENT_ID = "pax-frontend";
const REDIRECT_URI = "http://localhost:3000/auth/callback";

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
        `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth?${params.toString()}`;
}

export function logout() {

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("expires_at");


    const logoutUrl = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/logout` +
        `?client_id=${CLIENT_ID}` +
        `&post_logout_redirect_uri=${encodeURIComponent("http://localhost:3000")}`;


    window.location.href = logoutUrl;
}