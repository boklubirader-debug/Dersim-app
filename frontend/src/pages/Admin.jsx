import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Users, Trash, ShieldCheck, User } from "@phosphor-icons/react";
import PomodoroMini from "../components/PomodoroMini";

export default function Admin() {
    const { user } = useAuth();
    const [data, setData] = useState({ total: 0, users: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/admin/users");
                setData(data);
            } catch (e) {
                toast.error(e.response?.data?.detail || "Kullanıcılar alınamadı");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (user && user.role !== "admin") return <Navigate to="/" replace />;

    const del = async (id, email) => {
        if (!window.confirm(`${email} kullanıcısı ve tüm verileri silinsin mi?`)) return;
        try {
            await api.delete(`/admin/users/${id}`);
            setData((d) => ({ total: d.total - 1, users: d.users.filter((u) => u.id !== id) }));
            toast.success("Kullanıcı silindi");
        } catch (e) {
            toast.error(e.response?.data?.detail || "Silinemedi");
        }
    };

    const fmt = (iso) => {
        try { return new Date(iso).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }); }
        catch { return iso; }
    };

    return (
        <div className="min-h-screen">
            <header className="border-b-2 border-[color:var(--ink)] bg-[color:var(--paper)] sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center gap-3">
                    <Link to="/settings" className="brut-btn px-3 py-2 rounded-md font-bold bg-white flex items-center gap-1" data-testid="admin-back">
                        <ArrowLeft size={16} weight="bold" /> Geri
                    </Link>
                    <div>
                        <h1 className="font-display text-2xl font-black flex items-center gap-2">
                            <ShieldCheck size={22} weight="duotone" /> Yönetici Paneli
                        </h1>
                        <p className="text-xs text-muted">Sitedeki tüm kullanıcılar</p>
                    </div>
                    <div className="ml-auto"><PomodoroMini /></div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-4">
                <div className="brut-card p-5 flex items-center gap-4" data-testid="admin-stats">
                    <div className="w-14 h-14 brut-border rounded-md flex items-center justify-center" style={{background:"#FFE37E"}}>
                        <Users size={26} weight="duotone" />
                    </div>
                    <div>
                        <p className="text-xs tracking-[0.2em] uppercase font-bold text-muted">Toplam Üye</p>
                        <p className="font-display text-4xl font-black" data-testid="admin-total-users">{data.total}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-muted py-10">Yükleniyor...</div>
                ) : (
                    <div className="brut-card overflow-x-auto" data-testid="admin-users-table">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-[color:var(--ink)] bg-[color:var(--muted-bg)]">
                                    <th className="text-left p-3">Kullanıcı</th>
                                    <th className="text-left p-3 hidden md:table-cell">E-posta</th>
                                    <th className="text-left p-3">Rol</th>
                                    <th className="text-left p-3 hidden lg:table-cell">Kayıt</th>
                                    <th className="text-left p-3">Dersler</th>
                                    <th className="text-left p-3 hidden md:table-cell">PDF</th>
                                    <th className="text-left p-3 hidden md:table-cell">Link</th>
                                    <th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.users.map((u) => (
                                    <tr key={u.id} className="border-b border-black/10 last:border-b-0" data-testid={`admin-user-${u.id}`}>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 brut-border rounded-md flex items-center justify-center font-black" style={{background: u.role === "admin" ? "#D0C9FF" : "#A7E8D0"}}>
                                                    {(u.name?.[0] || u.email?.[0] || "?").toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold">{u.name || "-"}</div>
                                                    <div className="text-xs text-muted md:hidden">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 hidden md:table-cell">{u.email}</td>
                                        <td className="p-3">
                                            <span className="tag-pill" style={{background: u.role === "admin" ? "#FFE37E" : "#FFFFFF"}}>
                                                {u.role === "admin" ? <ShieldCheck size={12} weight="bold" /> : <User size={12} weight="bold" />}
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-3 hidden lg:table-cell text-xs">{fmt(u.created_at)}</td>
                                        <td className="p-3 font-bold">{u.courses_count}</td>
                                        <td className="p-3 hidden md:table-cell font-bold">{u.pdfs_count}</td>
                                        <td className="p-3 hidden md:table-cell font-bold">{u.links_count}</td>
                                        <td className="p-3 text-right">
                                            {u.id !== user?.id && (
                                                <button
                                                    onClick={() => del(u.id, u.email)}
                                                    className="brut-btn px-2 py-1 rounded-md font-bold text-red-600 bg-white text-xs"
                                                    data-testid={`admin-delete-user-${u.id}`}
                                                    aria-label="Kullanıcıyı sil"
                                                >
                                                    <Trash size={14} weight="bold" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {data.users.length === 0 && (
                            <p className="p-6 text-center text-muted">Henüz kullanıcı yok.</p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
