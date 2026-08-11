import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Sparkle, Sun, Moon, Coffee } from "@phosphor-icons/react";

// Rotating motivational messages shown next to the greeting.
const MESSAGES = [
    "İyi dersler!",
    "Bugün bir konu daha kapatalım",
    "Küçük adımlar, büyük ilerleme",
    "Bir Pomodoro, bir zafer",
    "Sen bunu yaparsın",
    "Ders çalışmak = yatırım",
    "Dünkü halinden bir adım öteye",
    "Odaklan — sadece 25 dakika",
    "Not al, tekrar et, sindir",
    "Başladığın işi bitir",
    "Zihnini uykuya değil, ödüle bırak",
    "Bugünkü çabaların yarını yazıyor",
];

function pickGreeting(hour) {
    if (hour < 6) return { text: "İyi geceler", Icon: Moon, tint: "#D0C9FF" };
    if (hour < 12) return { text: "Günaydın", Icon: Sun, tint: "#FFE37E" };
    if (hour < 18) return { text: "Merhaba", Icon: Sparkle, tint: "#A7E8D0" };
    if (hour < 22) return { text: "İyi akşamlar", Icon: Coffee, tint: "#FFC9B5" };
    return { text: "İyi geceler", Icon: Moon, tint: "#D0C9FF" };
}

export default function WelcomeBanner() {
    const { user } = useAuth();
    const [idx, setIdx] = useState(() => Math.floor(Math.random() * MESSAGES.length));
    const [hour, setHour] = useState(() => new Date().getHours());
    const [visible, setVisible] = useState(true);

    // Rotate motivational text every 6 seconds (fade in/out)
    useEffect(() => {
        const id = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setIdx((i) => (i + 1 + Math.floor(Math.random() * (MESSAGES.length - 1))) % MESSAGES.length);
                setVisible(true);
            }, 350);
        }, 6000);
        return () => clearInterval(id);
    }, []);

    // Keep greeting fresh across day/night boundaries
    useEffect(() => {
        const id = setInterval(() => setHour(new Date().getHours()), 60 * 1000);
        return () => clearInterval(id);
    }, []);

    const greet = pickGreeting(hour);
    const name = user?.name?.split(" ")[0] || "Öğrenci";
    const Icon = greet.Icon;

    return (
        <div className="w-full flex justify-center mb-6" data-testid="welcome-banner">
            <div className="brut-card px-5 py-4 md:px-8 md:py-5 text-center max-w-2xl w-full"
                 style={{ background: `linear-gradient(135deg, ${greet.tint} 0%, #FFFFFF 130%)` }}>
                <div className="flex items-center justify-center gap-2 text-black">
                    <Icon size={20} weight="fill" />
                    <p className="font-display font-black text-2xl md:text-3xl leading-none">
                        {greet.text}, <span className="underline decoration-2 decoration-black underline-offset-4">{name}</span>!
                    </p>
                </div>
                <div className="h-6 mt-2 relative overflow-hidden">
                    <p
                        key={idx}
                        className={`text-sm md:text-base text-neutral-800 font-medium transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
                        data-testid="welcome-message"
                    >
                        {MESSAGES[idx]}
                    </p>
                </div>
            </div>
        </div>
    );
}
