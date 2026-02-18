import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUserLoggedIn();
    }, []);

    const checkUserLoggedIn = async () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                // Attempt to validate session
                const response = await api.get('/auth/me/');
                if (response.data) {
                    setUser(response.data);
                } else {
                    throw new Error('Invalid user data');
                }
            } catch (error) {
                console.warn("Session validation failed:", error);
                // Graceful degradation: clear token but don't crash
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                setUser(null);
            }
        }
        // Always finish loading
        setLoading(false);
    };

    const login = async (username, password) => {
        console.log("LOGIN ATTEMPT:", { username, password });
        try {
            const response = await api.post('/auth/login/', { username, password });
            console.log("LOGIN SUCCESS:", response.data);
            const { access, refresh, role, username: apiUsername } = response.data; // MyTokenObtainPair returns extra data if customized

            // Decoding token is better but for now rely on response or /me
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);

            // Fetch user details immediately
            const userResponse = await api.get('/auth/me/');
            setUser(userResponse.data);
            return userResponse.data;
        } catch (error) {
            console.error("LOGIN FAILED:", error.response?.data || error);
            throw error;
        }
    };

    const register = async (userData) => {
        await api.post('/auth/register/', userData);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.clear(); // Clear all session data
        setUser(null);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
