const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Token storage
const TOKEN_KEY = 'llm_council_token';

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

// Auth helpers
export const auth = {
    async signUp(email, password) {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Registration failed');
        }

        const data = await res.json();
        setToken(data.token);
        return data;
    },

    async signIn(email, password) {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Login failed');
        }

        const data = await res.json();
        setToken(data.token);
        return data;
    },

    async signOut() {
        removeToken();
    },

    async getSession() {
        const token = getToken();
        if (!token) return null;

        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!res.ok) {
                removeToken();
                return null;
            }

            const user = await res.json();
            return { user };
        } catch {
            return null;
        }
    },

    async getUser() {
        const session = await this.getSession();
        return session?.user ?? null;
    },

    onAuthStateChange(callback) {
        // Check initial state
        this.getSession().then((session) => {
            callback('INITIAL', session);
        });

        // Listen for storage changes (cross-tab sync)
        const handler = (e) => {
            if (e.key === TOKEN_KEY) {
                this.getSession().then((session) => {
                    callback(e.newValue ? 'SIGNED_IN' : 'SIGNED_OUT', session);
                });
            }
        };

        window.addEventListener('storage', handler);

        return {
            data: {
                subscription: {
                    unsubscribe: () => window.removeEventListener('storage', handler)
                }
            }
        };
    },

    getToken,
};
