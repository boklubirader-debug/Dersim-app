import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { TrendUp, TrendDown, Fire, CheckCircle, FilePdf, LinkSimple, BookOpen } from "@phosphor-icons/react";

export default function Stats() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/stats/weekly");
                setData(data);
            } catch {}
            finally { setLoading(false); }
        })();
    }, []);

    if (loading) return <p className="text-muted">Yükleniyor...</p>;
    if (!data) return <p className="text-muted">İstatistik alınamadı.</p>;

    const positive = data.delta_pct >= 0;
    const maxDaily = Math.max(1, ...data.daily.map((d) => d.count));
    const dayLabels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
    const todayIdx = (new Date().getDay() + 6) % 7;

    return (
        <div className="space-y-4" data-testid="stats-panel">
            {/* Delta banner */}
            <div className="brut-card p-4 flex items-center gap-4" style={{ background: positive ? "#DCFCE7" : "#FEE2E2" }}>
                <div className="w-12 h-12 brut-border rounded-md flex items-center justify-center" style={{ background: positive ? "#A7E8D0" : "#FFC9B5" }}>
                    {positive ? <TrendUp size={22} weight="bold" color="#1A1A1A" /> : <TrendDown size={22} weight="bold" color="#1A1A1A" />}
                </div>
                <div>
                    <p className="text-xs tracking-widest uppercase font-bold text-neutral-700">Bu hafta</p>
                    <p className="font-display text-xl font-black text-black" data-testid="stats-delta">
                        {positive ? `%${Math.abs(data.delta_pct)} daha fazla çalıştın` : `Geçen haftaya göre %${Math.abs(data.delta_pct)} daha az`}
                    </p>
                    <p className="text-sm text-neutral-700">Bu hafta {data.this_week.total} işlem · Geçen hafta {data.last_week.total} işlem</p>
                </div>
            </div>

            {/* Streak */}
            <div className="brut-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 brut-border rounded-md flex items-center justify-center" style={{ background: "#FFE37E" }}>
                    <Fire size={22} weight="fill" color="#1A1A1A" />
                </div>
                <div>
                    <p className="text-xs tracking-widest uppercase font-bold text-muted">Çalışma Serisi</p>
                    <p className="font-display text-2xl font-black" data-testid="stats-streak">{data.streak_days} gün</p>
                    <p className="text-sm text-muted">Ardışık gün — bugün de bir şey ekle, seriyi kırma!</p>
                </div>
            </div>

            {/* Grid of metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Metric icon={<CheckCircle size={18} weight="fill" />} label="Tamamlanan" value={data.this_week.courses_completed} bg="#A7E8D0" />
                <Metric icon={<BookOpen size={18} weight="fill" />} label="Ders güncelleme" value={data.this_week.courses_touched} bg="#FFE37E" />
                <Metric icon={<FilePdf size={18} weight="fill" />} label="PDF eklenen" value={data.this_week.pdfs_added} bg="#FFC9B5" />
                <Metric icon={<LinkSimple size={18} weight="fill" />} label="Link eklenen" value={data.this_week.links_added} bg="#D0C9FF" />
            </div>

            {/* Sparkline */}
            <div className="brut-card p-4">
                <p className="text-xs tracking-widest uppercase font-bold text-muted mb-3">Son 7 gün</p>
                <div className="flex items-end justify-between gap-2 h-32">
                    {data.daily.map((d, i) => {
                        const h = Math.round((d.count / maxDaily) * 100);
                        const isToday = i === 6;
                        return (
                            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                    className="w-full brut-border rounded-t-md"
                                    style={{
                                        height: `${Math.max(6, h)}%`,
                                        background: isToday ? "#FFE37E" : "#D0C9FF",
                                        transition: "height 300ms ease",
                                    }}
                                    title={`${d.count} işlem`}
                                />
                                <div className="text-[10px] font-bold text-muted">{dayLabels[(todayIdx + 1 + i) % 7]}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function Metric({ icon, label, value, bg }) {
    return (
        <div className="brut-card p-3">
            <div className="w-8 h-8 brut-border rounded-md flex items-center justify-center mb-2" style={{ background: bg, color: "#1A1A1A" }}>
                {icon}
            </div>
            <div className="text-xs uppercase tracking-widest font-bold text-muted">{label}</div>
            <div className="font-display text-2xl font-black">{value}</div>
        </div>
    );
}
