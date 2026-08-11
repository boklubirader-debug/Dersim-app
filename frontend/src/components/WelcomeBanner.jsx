import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Sparkle, Sun, Moon, Coffee } from "@phosphor-icons/react";

const ENABLED_KEY = "dersim.welcome.enabled";

const MESSAGES = [
    "İyi dersler!",
    "Bugün bir konu daha",
    "Küçük adımlar, büyük ilerleme",
    "Bir Pomodoro, bir zafer",
    "Sen bunu yaparsın",
    "Odaklan — sadece 25 dakika",
    "Not al, tekrar et, sindir",
    "Başladığın işi bitir",
    "Bugünkü çabaların yarını yazıyor",
    "Yavaş ol ama durma",
];

export function isWelcomeEnabled() {
    try {
        const v = localStorage.getItem(ENABLED_KEY);
        return v === null ? true : v === "1";
    } catch { return true; }
}
export function setWelcomeEnabled(on) {
    try { localStorage.setItem(ENABLED_KEY, on ? "1" : "0"); } catch {}
    try { window.dispatchEvent(new Event("dersim:welcome-changed")); } catch {}
}

function pickGreeting(hour) {
    if (hour < 6)  return { text: "İyi geceler",  Icon: Moon,    tint: "#D0C9FF" };
    if (hour < 12) return { text: "Günaydın",     Icon: Sun,     tint: "#FFE37E" };
    if (hour < 18) return { text: "Merhaba",      Icon: Sparkle, tint: "#A7E8D0" };
    if (hour < 22) return { text: "İyi akşamlar", Icon: Coffee,  tint: "#FFC9B5" };
    return          { text: "İyi geceler",        Icon: Moon,    tint: "#D0C9FF" };
}

/**
 * Compact header greeting that fits next to Ayarlar/Çıkış.
 * Rotates a motivational tagline every ~6s.
 * Respects the toggle in /settings.
 */
export default function WelcomeBanner() {
    const { user } = useAuth();
    const [enabled, setEnabled] = useState(isWelcomeEnabled());
    const [idx, setIdx] = useState(() => Math.floor(Math.random() * MESSAGES.length));
    const [hour, setHour] = useState(() => new Date().getHours());
    const [visible, setVisible] = useState(true);

    // React to settings toggle changes
    useEffect(() => {
        const handler = () => setEnabled(isWelcomeEnabled());
        window.addEventListener("dersim:welcome-changed", handler);
        window.addEventListener("storage", handler);
        return () => {
            window.removeEventListener("dersim:welcome-changed", handler);
            window.removeEventListener("storage", handler);
        };
    }, []);

    useEffect(() => {
        if (!enabled) return;
        const id = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setIdx((i) => (i + 1 + Math.floor(Math.random() * (MESSAGES.length - 1))) % MESSAGES.length);
                setVisible(true);
            }, 300);
        }, 6000);
        return () => clearInterval(id);
    }, [enabled]);

    useEffect(() => {
        const id = setInterval(() => setHour(new Date().getHours()), 60 * 1000);
        return () => clearInterval(id);
    }, []);

    if (!enabled) return null;

    const greet = pickGreeting(hour);
    const name = user?.name?.split(" ")[0] || "Öğrenci";
    const Icon = greet.Icon;

    return (
        <div className="hidden md:flex flex-col items-end text-right mr-1 min-w-0" data-testid="welcome-banner">
            <div className="flex items-center gap-1.5 min-w-0">
                <Icon size={14} weight="fill" style={{ color: greet.tint === "#FFE37E" ? "#B48A00" : "var(--text)" }} />
                <p className="text-xs uppercase tracking-widest font-bold text-muted truncate">
                    {greet.text},
                </p>
                <p className="font-bold text-sm truncate max-w-[140px]" data-testid="welcome-name">{name}</p>
            </div>
            <div className="h-4 mt-0.5 overflow-hidden">
                <p
                    key={idx}
                    className={`text-[11px] italic text-muted transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
                    data-testid="welcome-message"
                >
                    {MESSAGES[idx]}
                </p>
            </div>
        </div>
    );
}
