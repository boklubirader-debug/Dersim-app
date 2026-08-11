import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api, formatApiErrorDetail } from "../lib/api";
import { useTheme } from "../context/ThemeContext";
import { toast } from "sonner";
import { ArrowLeft, User, LockKey, Moon, Sun, Trash } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import PomodoroMini from "../components/PomodoroMini";

export default function Settings() {
    const { user, logout } = useAuth();
    const { theme, toggle } = useTheme();
    const nav = useNavigate();
    const [name, setName] = useState(user?.name || "");
    const [savingName, setSavingName] = useState(false);
    const [curPass, setCurPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [changing, setChanging] = useState(false);

    const saveName = async (e) => {
        e.preventDefault();
        if (!name.trim() || name === user.name) return;
        setSavingName(true);
        try {
            await api.patch("/auth/me", { name: name.trim() });
            toast.success("İsim güncellendi");
        } catch (e) {
            toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Güncellenemedi");
        } finally {
            setSavingName(false);
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        setChanging(true);
        try {
            await api.post("/auth/change-password", { current_password: curPass, new_password: newPass });
            setCurPass(""); setNewPass("");
            toast.success("Şifre değiştirildi");
        } catch (e) {
            toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Değiştirilemedi");
        } finally {
            setChanging(false);
        }
    };

    return (
        <div className="min-h-screen">
            <header className="border-b-2 border-[color:var(--ink)] bg-[color:var(--paper)] sticky top-0 z-40">
                <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 flex items-center gap-3">
                    <Link to="/" className="brut-btn px-3 py-2 rounded-md font-bold bg-white flex items-center gap-1" data-testid="settings-back">
                        <ArrowLeft size={16} weight="bold" /> Geri
                    </Link>
                    <h1 className="font-display text-2xl font-black">Ayarlar</h1>
                    <div className="ml-auto"><PomodoroMini /></div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-6">
                {/* Theme */}
                <section className="brut-card p-5" data-testid="settings-theme">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-xs tracking-[0.2em] uppercase font-bold text-muted">Görünüm</p>
                            <h2 className="font-display text-xl font-black flex items-center gap-2">
                                {theme === "dark" ? <Moon size={20} weight="fill" /> : <Sun size={20} weight="fill" />}
                                {theme === "dark" ? "Karanlık mod açık" : "Aydınlık mod açık"}
                            </h2>
                            <p className="text-sm text-muted mt-1">Gece çalışırken gözünü yormasın.</p>
                        </div>
                        <button
                            onClick={toggle}
                            className="brut-btn px-4 py-2 rounded-md font-bold flex items-center gap-2"
                            style={{background: theme === "dark" ? "#FFE37E" : "#D0C9FF", color: "#1A1A1A"}}
                            data-testid="theme-toggle-btn"
                        >
                            {theme === "dark" ? <><Sun size={16} weight="bold" /> Aydınlığa geç</> : <><Moon size={16} weight="bold" /> Karanlığa geç</>}
                        </button>
                    </div>
                </section>

                {/* Profile */}
                <section className="brut-card p-5" data-testid="settings-profile">
                    <div className="flex items-center gap-2 mb-4">
                        <User size={20} weight="duotone" />
                        <h2 className="font-display text-xl font-black">Profil</h2>
                    </div>
                    <form onSubmit={saveName} className="space-y-3">
                        <div>
                            <label className="text-xs tracking-widest uppercase font-bold text-muted">E-posta</label>
                            <input value={user?.email || ""} disabled className="brut-input mt-1 opacity-70" data-testid="settings-email" />
                        </div>
                        <div>
                            <label className="text-xs tracking-widest uppercase font-bold text-muted">İsim</label>
                            <input value={name} onChange={(e) => setName(e.target.value)} className="brut-input mt-1" data-testid="settings-name-input" required />
                        </div>
                        <button
                            type="submit"
                            className="brut-btn px-4 py-2 rounded-md font-bold"
                            style={{background: "#A7E8D0", color: "#1A1A1A"}}
                            disabled={savingName || !name.trim() || name === user?.name}
                            data-testid="settings-name-save"
                        >
                            {savingName ? "Kaydediliyor..." : "İsmi kaydet"}
                        </button>
                    </form>
                </section>

                {/* Password */}
                <section className="brut-card p-5" data-testid="settings-password">
                    <div className="flex items-center gap-2 mb-4">
                        <LockKey size={20} weight="duotone" />
                        <h2 className="font-display text-xl font-black">Şifre Değiştir</h2>
                    </div>
                    <form onSubmit={changePassword} className="space-y-3">
                        <div>
                            <label className="text-xs tracking-widest uppercase font-bold text-muted">Mevcut şifre</label>
                            <input type="password" value={curPass} onChange={(e) => setCurPass(e.target.value)} className="brut-input mt-1" required data-testid="settings-current-password" />
                        </div>
                        <div>
                            <label className="text-xs tracking-widest uppercase font-bold text-muted">Yeni şifre (en az 6 karakter)</label>
                            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="brut-input mt-1" minLength={6} required data-testid="settings-new-password" />
                        </div>
                        <button
                            type="submit"
                            className="brut-btn px-4 py-2 rounded-md font-bold"
                            style={{background: "#FFE37E", color: "#1A1A1A"}}
                            disabled={changing || !curPass || newPass.length < 6}
                            data-testid="settings-password-save"
                        >
                            {changing ? "Değiştiriliyor..." : "Şifreyi değiştir"}
                        </button>
                    </form>
                </section>

                {user?.role === "admin" && (
                    <section className="brut-card p-5" data-testid="settings-admin-link">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                                <p className="text-xs tracking-[0.2em] uppercase font-bold text-muted">Yönetim</p>
                                <h2 className="font-display text-xl font-black">Yönetici paneli</h2>
                                <p className="text-sm text-muted mt-1">Sitedeki tüm kullanıcıları gör.</p>
                            </div>
                            <Link
                                to="/admin"
                                className="brut-btn px-4 py-2 rounded-md font-bold"
                                style={{background: "#D0C9FF", color: "#1A1A1A"}}
                                data-testid="settings-admin-btn"
                            >Paneli aç</Link>
                        </div>
                    </section>
                )}

                <button
                    onClick={async () => { await logout(); nav("/login"); }}
                    className="brut-btn px-4 py-2 rounded-md font-bold bg-white flex items-center gap-2"
                    data-testid="settings-logout"
                >
                    <Trash size={16} weight="bold" /> Oturumu Kapat
                </button>
            </main>
        </div>
    );
}
