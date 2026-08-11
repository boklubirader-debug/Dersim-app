import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { BookOpen, ArrowRight, Moon, Sun } from "@phosphor-icons/react";

export default function AuthPage({ mode = "login" }) {
    const { login, register } = useAuth();
    const { theme, toggle } = useTheme();
    const nav = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const res = mode === "login"
            ? await login(email, password)
            : await register(name, email, password);
        setLoading(false);
        if (res.ok) {
            toast.success(mode === "login" ? "Hoş geldin!" : "Hesabın oluşturuldu");
            nav("/");
        } else {
            toast.error(res.error);
        }
    };

    return (
        <div className="min-h-screen grid md:grid-cols-2">
            <div className="hidden md:flex flex-col justify-between p-10 relative overflow-hidden" style={{background: "linear-gradient(135deg, #FFE37E 0%, #A7E8D0 60%, #D0C9FF 100%)"}}>
                <div className="flex items-center gap-2">
                    <div className="brut-border brut-shadow-sm bg-white w-10 h-10 rounded-md flex items-center justify-center">
                        <BookOpen size={22} weight="duotone" />
                    </div>
                    <span className="font-display text-2xl font-extrabold">dersim.</span>
                </div>
                <div>
                    <h1 className="font-display text-5xl lg:text-6xl font-black leading-[0.95] mb-6">
                        Ders çalışmak,<br/>
                        <span className="bg-white brut-border px-2 inline-block rotate-[-1deg]">artık düzenli.</span>
                    </h1>
                    <p className="text-lg max-w-md">PDF&apos;lerini, linklerini ve ders sıranı tek yerde topla. Her değişiklik otomatik kaydedilir.</p>
                </div>
                <div className="flex gap-3">
                    <span className="tag-pill bg-white">PDF Yükle</span>
                    <span className="tag-pill bg-white">Otomatik Kayıt</span>
                    <span className="tag-pill bg-white">Ders Sırası</span>
                </div>
            </div>

            <div className="flex items-center justify-center p-6 md:p-10 relative">
                <button
                    onClick={toggle}
                    aria-label={theme === "dark" ? "Aydınlık moda geç" : "Karanlık moda geç"}
                    className="brut-btn absolute top-4 right-4 px-3 py-2 rounded-md font-bold text-sm flex items-center gap-1"
                    data-testid="auth-theme-toggle"
                >
                    {theme === "dark" ? <><Sun size={16} weight="bold" /> Gündüz</> : <><Moon size={16} weight="bold" /> Gece</>}
                </button>
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <p className="text-xs tracking-[0.2em] uppercase font-bold text-muted mb-2">{mode === "login" ? "Tekrar hoş geldin" : "Hemen başla"}</p>
                        <h2 className="font-display text-4xl font-black">{mode === "login" ? "Giriş yap." : "Hesap oluştur."}</h2>
                    </div>
                    <form onSubmit={submit} className="space-y-4" data-testid="auth-form">
                        {mode === "register" && (
                            <div>
                                <label className="text-xs tracking-widest uppercase font-bold text-muted">Ad</label>
                                <input
                                    data-testid="auth-name-input"
                                    className="brut-input mt-1"
                                    placeholder="Adın"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-xs tracking-widest uppercase font-bold text-muted">E-posta</label>
                            <input
                                data-testid="auth-email-input"
                                type="email"
                                className="brut-input mt-1"
                                placeholder="ornek@mail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <label className="text-xs tracking-widest uppercase font-bold text-muted">Şifre</label>
                                {mode === "login" && (
                                    <Link to="/forgot-password" className="text-xs font-bold underline underline-offset-4 text-muted hover:text-[color:var(--text)]" data-testid="forgot-password-link">
                                        Şifremi unuttum
                                    </Link>
                                )}
                            </div>
                            <input
                                data-testid="auth-password-input"
                                type="password"
                                className="brut-input mt-1"
                                placeholder="En az 6 karakter"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <button
                            data-testid="auth-submit-btn"
                            type="submit"
                            disabled={loading}
                            className="brut-btn w-full flex items-center justify-center gap-2 py-3 rounded-md font-bold"
                            style={{background: "#FFE37E"}}
                        >
                            {loading ? "Bekle..." : mode === "login" ? "Giriş Yap" : "Kaydol"}
                            <ArrowRight size={18} weight="bold" />
                        </button>
                    </form>
                    <div className="mt-6 text-sm text-muted">
                        {mode === "login" ? (
                            <>Hesabın yok mu? <Link data-testid="link-to-register" to="/register" className="font-bold underline underline-offset-4">Kaydol</Link></>
                        ) : (
                            <>Zaten hesabın var mı? <Link data-testid="link-to-login" to="/login" className="font-bold underline underline-offset-4">Giriş yap</Link></>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
