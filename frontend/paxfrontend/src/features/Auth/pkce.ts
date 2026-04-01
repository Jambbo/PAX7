function generateRandomString(length: number) {
    const charset =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const values = crypto.getRandomValues(new Uint8Array(length));
    values.forEach(v => (result += charset[v % charset.length]));
    return result;
}

async function sha256(plain: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return await crypto.subtle.digest("SHA-256", data);
}

function base64UrlEncode(buffer: ArrayBuffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

export async function generatePKCE() {
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64UrlEncode(hashed);

    return { codeVerifier, codeChallenge };
}