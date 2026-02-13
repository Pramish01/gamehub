const AuthManager = {
    KEYS: {
        IS_LOGGED_IN: 'isLoggedIn',
        USERNAME: 'username',
        EMAIL: 'email',
        LOGIN_TIME: 'loginTime',
        SESSION_TOKEN: 'sessionToken'
    },

    SESSION_DURATION: 24 * 60 * 60 * 1000,


    generateSessionToken() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },


    login(email, username, password) {
        try {
            if (!email || !username || !password) {
                throw new Error('All fields are required');
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Invalid email format');
            }

            const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
            if (!usernameRegex.test(username)) {
                throw new Error('Username must be 3-20 characters (letters, numbers, underscore only)');
            }

            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }

            const sessionToken = this.generateSessionToken();
            const loginTime = Date.now();

            localStorage.setItem(this.KEYS.IS_LOGGED_IN, 'true');
            localStorage.setItem(this.KEYS.USERNAME, username);
            localStorage.setItem(this.KEYS.EMAIL, email);
            localStorage.setItem(this.KEYS.LOGIN_TIME, loginTime.toString());
            localStorage.setItem(this.KEYS.SESSION_TOKEN, sessionToken);

            return {
                success: true,
                message: 'Login successful!'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    },


    logout() {
        localStorage.removeItem(this.KEYS.IS_LOGGED_IN);
        localStorage.removeItem(this.KEYS.USERNAME);
        localStorage.removeItem(this.KEYS.EMAIL);
        localStorage.removeItem(this.KEYS.LOGIN_TIME);
        localStorage.removeItem(this.KEYS.SESSION_TOKEN);

        return {
            success: true,
            message: 'Logged out successfully'
        };
    },


    isAuthenticated() {
        const isLoggedIn = localStorage.getItem(this.KEYS.IS_LOGGED_IN);
        const loginTime = localStorage.getItem(this.KEYS.LOGIN_TIME);
        const sessionToken = localStorage.getItem(this.KEYS.SESSION_TOKEN);

        if (isLoggedIn !== 'true' || !loginTime || !sessionToken) {
            return false;
        }

        const currentTime = Date.now();
        const timeDifference = currentTime - parseInt(loginTime);

        if (timeDifference > this.SESSION_DURATION) {
            this.logout();
            return false;
        }

        return true;
    },

    getCurrentUser() {
        if (!this.isAuthenticated()) {
            return null;
        }

        return {
            username: localStorage.getItem(this.KEYS.USERNAME),
            email: localStorage.getItem(this.KEYS.EMAIL),
            loginTime: parseInt(localStorage.getItem(this.KEYS.LOGIN_TIME)),
            sessionToken: localStorage.getItem(this.KEYS.SESSION_TOKEN)
        };
    },


    updateUsername(newUsername) {
        if (!this.isAuthenticated()) {
            return {
                success: false,
                message: 'Not authenticated'
            };
        }

        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(newUsername)) {
            return {
                success: false,
                message: 'Invalid username format'
            };
        }

        localStorage.setItem(this.KEYS.USERNAME, newUsername);
        return {
            success: true,
            message: 'Username updated successfully'
        };
    },


    refreshSession() {
        if (!this.isAuthenticated()) {
            return false;
        }

        localStorage.setItem(this.KEYS.LOGIN_TIME, Date.now().toString());
        return true;
    },


    getSessionTimeRemaining() {
        if (!this.isAuthenticated()) {
            return 0;
        }

        const loginTime = parseInt(localStorage.getItem(this.KEYS.LOGIN_TIME));
        const currentTime = Date.now();
        const timeDifference = currentTime - loginTime;
        const timeRemaining = this.SESSION_DURATION - timeDifference;

        return Math.floor(timeRemaining / (1000 * 60));
    }
};

window.AuthManager = AuthManager;