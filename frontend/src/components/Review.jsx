import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { CalendarCheck, Fire } from "@phosphor-icons/react";

export default function Review({ onOpenCourse }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/review/due");
                setItems(data.items || []);
            } catch {} finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="space-y-3" data-testid="review-panel">
            <p className="text-sm text-muted">
                <Fire size={14} weight="fill" className="inline mr-1" />
                Aralıklı tekrar: Notlarını 1, 3 ve 7 gün sonra tekrar ederek uzun süreli hafızaya at.
            </p>

            {loading && <p className="text-muted">Yükleniyor...</p>}

            {!loading && items.length === 0 && (
                <div className="brut-card p-6 text-center">
                    <CalendarCheck size={30} weight="duotone" className="mx-auto mb-2" />
                    <p className="font-bold">Bugün tekrar edilecek not yok</p>
                    <p className="text-sm text-muted">Yeni notlar aldıkça burada tekrar önerileri çıkacak.</p>
                </div>
            )}

            <div className="space-y-2">
                {items.map((it) => (
                    <button
                        key={it.course_id + "-" + it.interval_days}
                        onClick={() => onOpenCourse?.(it.course_id)}
                        className="brut-card w-full p-3 text-left flex items-center gap-3 hover:translate-x-[2px] hover:translate-y-[2px] transition-transform duration-150"
                        data-testid={`review-item-${it.course_id}`}
                    >
                        <div className="w-10 h-10 brut-border rounded-md flex items-center justify-center font-black" style={{ background: it.color || "#FFE37E", color: "#1A1A1A" }}>
                            {it.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold truncate">{it.name}</div>
                            <div className="text-xs text-muted">
                                {it.age_days} gün önce güncellendi
                            </div>
                        </div>
                        <span className="tag-pill" style={{ background: it.interval_days === 7 ? "#FFC9B5" : it.interval_days === 3 ? "#D0C9FF" : "#A7E8D0" }}>
                            {it.interval_days}. gün
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
