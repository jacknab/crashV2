class API {
    static getHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    static async makeRequest(url, options = {}) {
        try {
            options.headers = { ...this.getHeaders(), ...options.headers };
            const response = await fetch(url, options);
            
            // Handle unauthorized access
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return null;
            }

            // Handle other errors
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return response;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    static async get(url) {
        return this.makeRequest(url);
    }

    static async post(url, data) {
        return this.makeRequest(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async put(url, data) {
        return this.makeRequest(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    static async delete(url) {
        return this.makeRequest(url, {
            method: 'DELETE'
        });
    }
}

// Make API available globally
window.API = API;