import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import CourseSidebar from "../components/CourseSidebar";
import CourseDetail from "../components/CourseDetail";
import ExamCountdown from "../components/ExamCountdown";
import { toast } from "sonner";
import { BookOpen, SignOut } from "@phosphor-icons/react";

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [courses, setCourses] = useState([]);
    const [activeCourseId, setActiveCourseId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/courses");
                setCourses(data);
                if (data.length > 0) setActiveCourseId(data[0].id);
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

    return (
        <div className="min-h-screen">
            <header className="border-b-2 border-black bg-[#FDFBF7] sticky top-0 z-40" data-testid="app-header">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="brut-border brut-shadow-sm bg-[#FFE37E] w-10 h-10 rounded-md flex items-center justify-center">
                            <BookOpen size={22} weight="duotone" />
                        </div>
                        <div>
                            <h1 className="font-display text-xl font-black leading-none">dersim.</h1>
                            <p className="text-xs text-neutral-600 mt-0.5">Ders çalışma paneli</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right">
                            <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Hoş geldin</p>
                            <p className="font-bold text-sm" data-testid="user-name">{user?.name || user?.email}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="brut-btn px-3 py-2 rounded-md font-bold bg-white flex items-center gap-2 text-sm"
                            data-testid="logout-btn"
                        >
                            <SignOut size={16} weight="bold" /> Çıkış
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
                <ExamCountdown />
                {loading ? (
                    <div className="text-center text-neutral-500 py-20">Yükleniyor...</div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        <CourseSidebar
                            courses={courses}
                            activeCourseId={activeCourseId}
                            onSelect={setActiveCourseId}
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
                <BookOpen size={30} weight="duotone" />
            </div>
            <h3 className="font-display text-2xl font-black mb-2">
                {hasCourses ? "Bir ders seç" : "Hemen başla"}
            </h3>
            <p className="text-neutral-600 max-w-md">
                {hasCourses
                    ? "Soldan bir ders seç, PDF ve linklerini bir arada gör."
                    : "Sol taraftan ilk dersini ekle. PDF'lerin, linklerin ve notların otomatik olarak kaydedilecek."}
            </p>
        </div>
    );
}
