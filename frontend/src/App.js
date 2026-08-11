import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { PomodoroProvider } from "./context/PomodoroContext";
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import { ForgotPassword, ResetPassword } from "./pages/Password";

function Protected({ children }) {
    const { user, checked } = useAuth();
    if (!checked) return (
        <div className="min-h-screen flex items-center justify-center text-muted" data-testid="auth-loading">
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
        <ThemeProvider>
            <AuthProvider>
                <PomodoroProvider>
                    <BrowserRouter>
                        <Toaster position="top-right" richColors closeButton />
                        <Routes>
                            <Route path="/login" element={<PublicOnly><AuthPage mode="login" /></PublicOnly>} />
                            <Route path="/register" element={<PublicOnly><AuthPage mode="register" /></PublicOnly>} />
                            <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
                            <Route path="/reset-password" element={<PublicOnly><ResetPassword /></PublicOnly>} />
                            <Route path="/" element={<Protected><Dashboard /></Protected>} />
                            <Route path="/settings" element={<Protected><Settings /></Protected>} />
                            <Route path="/admin" element={<Protected><Admin /></Protected>} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </BrowserRouter>
                </PomodoroProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
