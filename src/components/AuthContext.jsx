/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem('gym_user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            localStorage.removeItem('gym_user');
            return null;
        }
    });

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('gym_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('gym_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
