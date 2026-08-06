import React, { createContext, useContext, useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // null = checking
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/auth/me");
                setUser(data);
            } catch {
                setUser(false);
            } finally {
                setChecked(true);
            }
        })();
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post("/auth/login", { email, password });
            setUser(data);
            return { ok: true };
        } catch (e) {
            return { ok: false, error: formatApiErrorDetail(e.response?.data?.detail) || e.message };
        }
    };
    const register = async (name, email, password) => {
        try {
            const { data } = await api.post("/auth/register", { name, email, password });
            setUser(data);
            return { ok: true };
        } catch (e) {
            return { ok: false, error: formatApiErrorDetail(e.response?.data?.detail) || e.message };
        }
    };
    const logout = async () => {
        try { await api.post("/auth/logout"); } catch {}
        setUser(false);
    };

    return (
        <AuthContext.Provider value={{ user, checked, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
