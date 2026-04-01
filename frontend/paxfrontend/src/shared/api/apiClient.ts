const BASE_URL = 'http://localhost:8081';

async function fetchClient(endpoint: string, { data, ...customConfig }: { data?: any } & RequestInit = {}) {
    const token = localStorage.getItem('access_token');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method: data ? 'POST' : 'GET',
        ...customConfig,
        headers: {
            ...headers,
            ...customConfig.headers,
        },
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        if (response.status === 401) {
            // Optional: Implement logout or token refresh trigger here
            // console.error('Unauthorized response');
        }

        let responseData;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        if (!response.ok) {
            const error = new Error(response.statusText);
            (error as any).response = { status: response.status, data: responseData };
            return Promise.reject(error);
        }

        return { data: responseData, status: response.status, headers: response.headers, config };
    } catch (error) {
        return Promise.reject(error);
    }
}

export const apiClient = {
    get: (url: string, config?: RequestInit) => fetchClient(url, { ...config, method: 'GET' }),
    post: (url: string, data?: any, config?: RequestInit) => fetchClient(url, { ...config, method: 'POST', data }),
    put: (url: string, data?: any, config?: RequestInit) => fetchClient(url, { ...config, method: 'PUT', data }),
    delete: (url: string, config?: RequestInit) => fetchClient(url, { ...config, method: 'DELETE' }),
    patch: (url: string, data?: any, config?: RequestInit) => fetchClient(url, { ...config, method: 'PATCH', data }),
};
