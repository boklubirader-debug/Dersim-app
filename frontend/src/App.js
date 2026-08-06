import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

function Protected({ children }) {
    const { user, checked } = useAuth();
    if (!checked) return (
        <div className="min-h-screen flex items-center justify-center text-neutral-500" data-testid="auth-loading">
            Yükleniyor...
        </div>
    );
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

function PublicOnly({ children }) {
    const { user, checked } = useAuth();
    if (!checked) return null;
    if (user) return <Navigate to="/" replace />;
    return children;
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster position="top-right" richColors closeButton />
                <Routes>
                    <Route path="/login" element={<PublicOnly><AuthPage mode="login" /></PublicOnly>} />
                    <Route path="/register" element={<PublicOnly><AuthPage mode="register" /></PublicOnly>} />
                    <Route path="/" element={<Protected><Dashboard /></Protected>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
