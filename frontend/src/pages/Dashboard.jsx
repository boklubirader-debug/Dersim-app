import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import CourseSidebar from "../components/CourseSidebar";
import CourseDetail from "../components/CourseDetail";
import ExamCountdown from "../components/ExamCountdown";
import ToolsBar from "../components/ToolsBar";
import PomodoroMini from "../components/PomodoroMini";
import { toast } from "sonner";
import { BookOpen, SignOut, Gear, Moon, Sun, ShieldCheck } from "@phosphor-icons/react";

const LAST_COURSE_KEY = "dersim.lastCourseId";

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { theme, toggle } = useTheme();
    const [courses, setCourses] = useState([]);
    const [activeCourseId, setActiveCourseId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/courses");
                setCourses(data);
                if (data.length > 0) {
                    let saved = null;
                    try { saved = localStorage.getItem(LAST_COURSE_KEY); } catch {}
                    const found = saved && data.find((c) => c.id === saved);
                    setActiveCourseId(found ? saved : data[0].id);
                }
            } catch {
                toast.error("Dersler alınamadı");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const activeCourse = courses.find((c) => c.id === activeCourseId);

    const onCourseUpdate = (updated) => {
        setCourses((cs) => cs.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    };

    const selectCourse = (id) => {
        setActiveCourseId(id);
        try { if (id) localStorage.setItem(LAST_COURSE_KEY, id); else localStorage.removeItem(LAST_COURSE_KEY); } catch {}
    };

    return (
        <div className="min-h-screen">
            <header className="border-b-2 border-[color:var(--ink)] bg-[color:var(--paper)] sticky top-0 z-40" data-testid="app-header">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="brut-border brut-shadow-sm w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{background: "#FFE37E"}}>
                            <BookOpen size={22} weight="duotone" color="#1A1A1A" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-display text-xl font-black leading-none">dersim.</h1>
                            <p className="text-xs text-muted mt-0.5 truncate">Ders çalışma paneli</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <PomodoroMini />
                        <div className="hidden md:block text-right mr-1">
                            <p className="text-xs text-muted uppercase tracking-widest font-bold">Hoş geldin</p>
                            <p className="font-bold text-sm truncate max-w-[160px]" data-testid="user-name">{user?.name || user?.email}</p>
                        </div>
                        <button
                            onClick={toggle}
                            aria-label={theme === "dark" ? "Aydınlık moda geç" : "Karanlık moda geç"}
                            className="brut-btn px-3 py-2 rounded-md font-bold flex items-center gap-1 text-sm"
                            data-testid="theme-toggle-header"
                        >
                            {theme === "dark" ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
                        </button>
                        {user?.role === "admin" && (
                            <Link to="/admin" className="brut-btn px-3 py-2 rounded-md font-bold text-sm hidden sm:flex items-center gap-1" style={{background: "#D0C9FF", color: "#1A1A1A"}} data-testid="header-admin-btn">
                                <ShieldCheck size={16} weight="bold" /> Panel
                            </Link>
                        )}
                        <Link to="/settings" className="brut-btn px-3 py-2 rounded-md font-bold flex items-center gap-1 text-sm" data-testid="header-settings-btn">
                            <Gear size={16} weight="bold" /> <span className="hidden sm:inline">Ayarlar</span>
                        </Link>
                        <button
                            onClick={logout}
                            className="brut-btn px-3 py-2 rounded-md font-bold flex items-center gap-1 text-sm"
                            data-testid="logout-btn"
                            aria-label="Çıkış yap"
                        >
                            <SignOut size={16} weight="bold" /> <span className="hidden sm:inline">Çıkış</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-start gap-3 mb-4">
                    <div className="md:flex-1 min-w-0">
                        <ToolsBar onOpenCourse={selectCourse} />
                    </div>
                    <div className="md:flex-1 md:max-w-[600px] md:ml-auto">
                        <ExamCountdown />
                    </div>
                </div>
                {loading ? (
                    <div className="text-center text-muted py-20">Yükleniyor...</div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        <CourseSidebar
                            courses={courses}
                            activeCourseId={activeCourseId}
                            onSelect={selectCourse}
                            onChange={setCourses}
                        />
                        <div className="flex-1 min-w-0">
                            {activeCourse ? (
                                <CourseDetail course={activeCourse} onCourseUpdate={onCourseUpdate} />
                            ) : (
                                <EmptyState hasCourses={courses.length > 0} />
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function EmptyState({ hasCourses }) {
    return (
        <div className="brut-card p-10 flex flex-col items-center text-center" data-testid="empty-state">
            <div className="w-16 h-16 brut-border rounded-md flex items-center justify-center mb-4" style={{background: "#A7E8D0"}}>
                <BookOpen size={30} weight="duotone" color="#1A1A1A" />
            </div>
            <h3 className="font-display text-2xl font-black mb-2">
                {hasCourses ? "Bir ders seç" : "Hemen başla"}
            </h3>
            <p className="text-muted max-w-md">
                {hasCourses
                    ? "Soldan bir ders seç, PDF ve linklerini bir arada gör."
                    : "Sol taraftan ilk dersini ekle. PDF'lerin, linklerin ve notların otomatik olarak kaydedilecek."}
            </p>
        </div>
    );
}
