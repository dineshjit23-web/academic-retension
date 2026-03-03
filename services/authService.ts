const API_BASE_URL = '/api';

export const AuthService = {
    async checkUserExists(username: string): Promise<boolean> {
        try {
            const resp = await fetch(`${API_BASE_URL}/auth/check?username=${encodeURIComponent(username)}`);
            if (resp.ok) {
                const data = await resp.json();
                return data.exists;
            }
            return false;
        } catch (error) {
            console.error('Check user failed:', error);
            return false;
        }
    },

    async isSupported(): Promise<boolean> {
        return true;
    },

    async registerPin(username: string, pin: string): Promise<boolean> {
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${API_BASE_URL}/auth/pin/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ username, pin })
            });
            return resp.ok;
        } catch (error) {
            console.error('PIN registration failed:', error);
            return false;
        }
    },

    async verifyPin(username: string, pin: string): Promise<boolean> {
        const token = localStorage.getItem('token');
        try {
            const resp = await fetch(`${API_BASE_URL}/auth/pin/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ username, pin })
            });
            return resp.ok;
        } catch (error) {
            console.error('PIN verification failed:', error);
            return false;
        }
    },

    // Mocked versions to maintain compatibility
    async registerBiometric(): Promise<boolean> { return false; },
    async authenticateBiometric(): Promise<boolean> { return false; },
    async saveFaceDescriptor(): Promise<boolean> { return false; },
    async getFaceDescriptor(): Promise<null> { return null; },
    async registerWebAuthn(): Promise<boolean> { return false; },
    async authenticateWebAuthn(): Promise<boolean> { return false; },
    async loadModels(): Promise<void> { return; },
    async verifyFace(): Promise<boolean> { return false; }
};
