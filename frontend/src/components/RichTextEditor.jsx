import React, { useEffect, useRef, useState } from "react";
import { TextB, TextItalic, TextUnderline, ListBullets, ListNumbers, TextHOne, TextT, Highlighter, Palette } from "@phosphor-icons/react";

const TEXT_COLORS = [
    { name: "Siyah", value: "#1A1A1A" },
    { name: "Kırmızı", value: "#DC2626" },
    { name: "Yeşil", value: "#16A34A" },
    { name: "Mavi", value: "#2563EB" },
    { name: "Turuncu", value: "#EA580C" },
    { name: "Mor", value: "#7C3AED" },
];
const HIGHLIGHTS = [
    { name: "Sarı", value: "#FEF08A" },
    { name: "Yeşil", value: "#BBF7D0" },
    { name: "Pembe", value: "#FBCFE8" },
    { name: "Mavi", value: "#BFDBFE" },
    { name: "Lila", value: "#DDD6FE" },
    { name: "Kaldır", value: "transparent" },
];

/**
 * Simple contentEditable rich text editor with color/highlight support.
 * Emits HTML to onChange; value is HTML string.
 */
export default function RichTextEditor({ value, onChange, placeholder = "" }) {
    const ref = useRef(null);
    const lastValueRef = useRef(value || "");
    const [showColors, setShowColors] = useState(false);
    const [showHighlights, setShowHighlights] = useState(false);

    // Sync incoming value only when it changes externally (avoid caret jumps while typing)
    useEffect(() => {
        if (!ref.current) return;
        if (value !== lastValueRef.current && value !== ref.current.innerHTML) {
            ref.current.innerHTML = value || "";
            lastValueRef.current = value || "";
        }
    }, [value]);

    const exec = (command, arg = null) => {
        ref.current?.focus();
        document.execCommand("styleWithCSS", false, true);
        document.execCommand(command, false, arg);
        handleInput();
    };

    const handleInput = () => {
        const html = ref.current?.innerHTML || "";
        lastValueRef.current = html;
        onChange?.(html);
    };

    return (
        <div className="space-y-2" data-testid="rich-editor">
            <div className="brut-card p-2 flex flex-wrap items-center gap-1 sticky top-[76px] bg-white z-10">
                <ToolBtn onClick={() => exec("bold")} label="Kalın" testid="rt-bold"><TextB size={16} weight="bold" /></ToolBtn>
                <ToolBtn onClick={() => exec("italic")} label="İtalik" testid="rt-italic"><TextItalic size={16} weight="bold" /></ToolBtn>
                <ToolBtn onClick={() => exec("underline")} label="Altı çizili" testid="rt-underline"><TextUnderline size={16} weight="bold" /></ToolBtn>
                <span className="w-px h-6 bg-black/10 mx-1" />
                <ToolBtn onClick={() => exec("formatBlock", "H3")} label="Başlık" testid="rt-h"><TextHOne size={16} weight="bold" /></ToolBtn>
                <ToolBtn onClick={() => exec("formatBlock", "P")} label="Paragraf" testid="rt-p"><TextT size={16} weight="bold" /></ToolBtn>
                <ToolBtn onClick={() => exec("insertUnorderedList")} label="Madde" testid="rt-ul"><ListBullets size={16} weight="bold" /></ToolBtn>
                <ToolBtn onClick={() => exec("insertOrderedList")} label="Numaralı liste" testid="rt-ol"><ListNumbers size={16} weight="bold" /></ToolBtn>
                <span className="w-px h-6 bg-black/10 mx-1" />

                <div className="relative">
                    <ToolBtn onClick={() => { setShowColors((v) => !v); setShowHighlights(false); }} label="Yazı rengi" testid="rt-color">
                        <Palette size={16} weight="bold" />
                    </ToolBtn>
                    {showColors && (
                        <div className="absolute z-20 mt-1 brut-card bg-white p-2 grid grid-cols-6 gap-1 min-w-[190px]">
                            {TEXT_COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    title={c.name}
                                    onClick={() => { exec("foreColor", c.value); setShowColors(false); }}
                                    className="w-7 h-7 rounded-sm border-2 border-black"
                                    style={{ background: c.value }}
                                    data-testid={`rt-color-${c.name}`}
                                    aria-label={`Yazı rengi: ${c.name}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative">
                    <ToolBtn onClick={() => { setShowHighlights((v) => !v); setShowColors(false); }} label="Vurgu" testid="rt-highlight">
                        <Highlighter size={16} weight="bold" />
                    </ToolBtn>
                    {showHighlights && (
                        <div className="absolute z-20 mt-1 brut-card bg-white p-2 grid grid-cols-6 gap-1 min-w-[190px]">
                            {HIGHLIGHTS.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    title={c.name}
                                    onClick={() => { exec("hiliteColor", c.value); setShowHighlights(false); }}
                                    className="w-7 h-7 rounded-sm border-2 border-black"
                                    style={{ background: c.value === "transparent" ? "repeating-linear-gradient(45deg,#fff,#fff 4px,#eee 4px,#eee 8px)" : c.value }}
                                    data-testid={`rt-highlight-${c.name}`}
                                    aria-label={`Vurgu: ${c.name}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div
                ref={ref}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onBlur={handleInput}
                data-placeholder={placeholder}
                className="brut-input min-h-[300px] leading-relaxed prose prose-sm max-w-none rt-editable"
                data-testid="rich-editor-content"
            />
            <style>{`
                .rt-editable:empty:before {
                    content: attr(data-placeholder);
                    color: #9CA3AF;
                }
                .rt-editable h3 { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 1.25rem; margin: 0.5rem 0; }
                .rt-editable ul { list-style: disc; padding-left: 1.4rem; }
                .rt-editable ol { list-style: decimal; padding-left: 1.4rem; }
                .rt-editable p { margin: 0.35rem 0; }
            `}</style>
        </div>
    );
}

function ToolBtn({ children, onClick, label, testid }) {
    return (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            title={label}
            aria-label={label}
            data-testid={testid}
            className="w-8 h-8 flex items-center justify-center rounded-md border-2 border-black bg-white hover:bg-[#FFE37E] transition-colors"
            style={{ boxShadow: "2px 2px 0 0 #1A1A1A" }}
        >
            {children}
        </button>
    );
}
