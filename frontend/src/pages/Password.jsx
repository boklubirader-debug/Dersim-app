import React, { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { api, formatApiErrorDetail } from "../lib/api";
import { useTheme } from "../context/ThemeContext";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, EnvelopeSimple, Moon, Sun, LockKey } from "@phosphor-icons/react";

export function ForgotPassword() {
    const { theme, toggle } = useTheme();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/auth/forgot-password", { email });
            setSent(true);
        } catch (e) {
            toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Hata");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell theme={theme} onToggle={toggle} title="Şifreni mi unuttun?" subtitle="Sıfırlama bağlantısı gönderelim">
            {sent ? (
                <div className="space-y-4">
                    <div className="brut-card p-5" style={{ background: "#A7E8D0", color: "#1A1A1A" }}>
                        <p className="font-bold">Bağlantı gönderildi ✓</p>
                        <p className="text-sm mt-1">
                            E-postan sistemde varsa şifre sıfırlama bağlantısı oluşturuldu. Bağlantı 1 saat geçerli.
                        </p>
                    </div>
                    <p className="text-xs text-muted">
                        (E-posta servisi entegre edilene kadar bağlantı sunucu log'larına yazılıyor. Yönetici sana bağlantıyı iletebilir.)
                    </p>
                    <Link to="/login" className="brut-btn w-full py-3 rounded-md font-bold flex items-center justify-center gap-2" data-testid="forgot-back-login">
                        <ArrowLeft size={16} weight="bold" /> Giriş sayfasına dön
                    </Link>
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-4" data-testid="forgot-form">
                    <div>
                        <label className="text-xs tracking-widest uppercase font-bold text-muted">E-posta</label>
                        <div className="relative mt-1">
                            <EnvelopeSimple size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="brut-input pl-9"
                                placeholder="kayitli@mail.com"
                                data-testid="forgot-email"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="brut-btn w-full flex items-center justify-center gap-2 py-3 rounded-md font-bold"
                        style={{ background: "#FFE37E", color: "#1A1A1A" }}
                        data-testid="forgot-submit"
                    >
                        {loading ? "Gönderiliyor..." : <>Bağlantıyı gönder <ArrowRight size={16} weight="bold" /></>}
                    </button>
                    <div className="text-sm text-muted">
                        <Link to="/login" className="font-bold underline underline-offset-4" data-testid="forgot-to-login">Girişe geri dön</Link>
                    </div>
                </form>
            )}
        </AuthShell>
    );
}

export function ResetPassword() {
    const [sp] = useSearchParams();
    const nav = useNavigate();
    const { theme, toggle } = useTheme();
    const token = sp.get("token") || "";
    const [newPass, setNewPass] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!token) { toast.error("Bağlantı geçersiz — token yok"); return; }
        setLoading(true);
        try {
            await api.post("/auth/reset-password", { token, new_password: newPass });
            toast.success("Şifren güncellendi. Yeni şifrenle giriş yap.");
            nav("/login");
        } catch (e) {
            toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Hata");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell theme={theme} onToggle={toggle} title="Yeni şifre belirle" subtitle="En az 6 karakter">
            {!token ? (
                <div className="space-y-4">
                    <div className="brut-card p-5" style={{ background: "#FFC9B5", color: "#1A1A1A" }}>
                        <p className="font-bold">Bağlantı geçersiz</p>
                        <p className="text-sm mt-1">Bağlantıyı tam olarak açtığından emin ol.</p>
                    </div>
                    <Link to="/forgot-password" className="brut-btn w-full py-3 rounded-md font-bold flex items-center justify-center gap-2">
                        Yeniden bağlantı iste
                    </Link>
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-4" data-testid="reset-form">
                    <div>
                        <label className="text-xs tracking-widest uppercase font-bold text-muted">Yeni şifre</label>
                        <div className="relative mt-1">
                            <LockKey size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                className="brut-input pl-9"
                                placeholder="En az 6 karakter"
                                data-testid="reset-new-password"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading || newPass.length < 6}
                        className="brut-btn w-full flex items-center justify-center gap-2 py-3 rounded-md font-bold"
                        style={{ background: "#A7E8D0", color: "#1A1A1A" }}
                        data-testid="reset-submit"
                    >
                        {loading ? "Güncelleniyor..." : "Şifreyi güncelle"}
                    </button>
                </form>
            )}
        </AuthShell>
    );
}

function AuthShell({ children, title, subtitle, theme, onToggle }) {
    return (
        <div className="min-h-screen grid md:grid-cols-2">
            <div className="hidden md:flex flex-col justify-between p-10 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #FFE37E 0%, #A7E8D0 60%, #D0C9FF 100%)" }}>
                <div className="flex items-center gap-2">
                    <div className="brut-border brut-shadow-sm bg-white w-10 h-10 rounded-md flex items-center justify-center">
                        <LockKey size={22} weight="duotone" />
                    </div>
                    <span className="font-display text-2xl font-extrabold">dersim.</span>
                </div>
                <div>
                    <h1 className="font-display text-5xl lg:text-6xl font-black leading-[0.95]">Güvenli erişim.</h1>
                    <p className="text-lg max-w-md mt-4">Şifreni sıfırlamak birkaç saniye alır. Verilerin güvende.</p>
                </div>
                <div />
            </div>

            <div className="flex items-center justify-center p-6 md:p-10 relative">
                <button
                    onClick={onToggle}
                    className="brut-btn absolute top-4 right-4 px-3 py-2 rounded-md font-bold text-sm flex items-center gap-1"
                    data-testid="auth-theme-toggle"
                    aria-label="Tema"
                >
                    {theme === "dark" ? <><Sun size={16} weight="bold" /> Gündüz</> : <><Moon size={16} weight="bold" /> Gece</>}
                </button>
                <div className="w-full max-w-md">
                    <div className="mb-6">
                        <p className="text-xs tracking-[0.2em] uppercase font-bold text-muted mb-2">{subtitle}</p>
                        <h2 className="font-display text-4xl font-black">{title}</h2>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
