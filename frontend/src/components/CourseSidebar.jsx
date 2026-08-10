import React, { useState } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVertical, Plus, Trash, PencilSimple, BookOpen, CheckSquare, Square } from "@phosphor-icons/react";
import { api } from "../lib/api";
import { toast } from "sonner";

const COLORS = ["#FFE37E", "#A7E8D0", "#D0C9FF", "#FFC9B5", "#B5E0FF", "#FFB5D8"];

function SortableCourseItem({ course, active, onSelect, onDelete, onRename, onToggleComplete, index }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: course.id });
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(course.name);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
    };

    const save = async () => {
        setEditing(false);
        if (name.trim() && name !== course.name) await onRename(course.id, name.trim());
        else setName(course.name);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            data-testid={`course-item-${course.id}`}
            className={`group brut-card flex items-center gap-2 p-3 cursor-pointer transition-transform duration-150 ${active ? "translate-x-[2px] translate-y-[2px]" : ""} ${course.completed ? "opacity-70" : ""}`}
        >
            <button
                {...attributes}
                {...listeners}
                data-testid={`course-drag-${course.id}`}
                className="cursor-grab active:cursor-grabbing text-neutral-500 hover:text-black"
                aria-label="Sürükle"
            >
                <DotsSixVertical size={20} weight="bold" />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onToggleComplete(course); }}
                className="shrink-0"
                data-testid={`course-complete-${course.id}`}
                aria-label={course.completed ? "Tamamlandı olarak işaretle kaldır" : "Tamamlandı olarak işaretle"}
                title={course.completed ? "Tamamlandı" : "Tamamlanmadı"}
            >
                {course.completed ? (
                    <CheckSquare size={22} weight="fill" style={{color: "#16A34A"}} />
                ) : (
                    <Square size={22} weight="bold" />
                )}
            </button>
            <div
                className="w-8 h-8 rounded-md brut-border flex items-center justify-center shrink-0 text-sm font-black"
                style={{ background: course.color || "#FFE37E" }}
            >
                {index + 1}
            </div>
            <div className="flex-1 min-w-0" onClick={() => !editing && onSelect(course.id)}>
                {editing ? (
                    <input
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={save}
                        onKeyDown={(e) => e.key === "Enter" && save()}
                        className="w-full bg-transparent outline-none font-bold"
                        data-testid={`course-rename-input-${course.id}`}
                    />
                ) : (
                    <div className={`font-bold truncate ${course.completed ? "line-through decoration-2" : ""}`}>{course.name}</div>
                )}
            </div>
            <button
                data-testid={`course-edit-${course.id}`}
                className="opacity-0 group-hover:opacity-100 p-1"
                onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                aria-label="Düzenle"
            >
                <PencilSimple size={16} />
            </button>
            <button
                data-testid={`course-delete-${course.id}`}
                className="opacity-0 group-hover:opacity-100 p-1 text-red-600"
                onClick={(e) => { e.stopPropagation(); onDelete(course.id); }}
                aria-label="Sil"
            >
                <Trash size={16} weight="bold" />
            </button>
        </div>
    );
}

export default function CourseSidebar({ courses, activeCourseId, onSelect, onChange }) {
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState("");
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = courses.findIndex((c) => c.id === active.id);
        const newIndex = courses.findIndex((c) => c.id === over.id);
        const newOrder = arrayMove(courses, oldIndex, newIndex);
        onChange(newOrder);
        try {
            await api.post("/courses/reorder", { ordered_ids: newOrder.map((c) => c.id) });
            toast.success("Sıra kaydedildi", { duration: 1200 });
        } catch {
            toast.error("Sıralama kaydedilemedi");
        }
    };

    const addCourse = async () => {
        if (!newName.trim()) return;
        try {
            const color = COLORS[courses.length % COLORS.length];
            const { data } = await api.post("/courses", { name: newName.trim(), color });
            onChange([...courses, data]);
            onSelect(data.id);
            setNewName("");
            setAdding(false);
            toast.success("Ders eklendi");
        } catch {
            toast.error("Ders eklenemedi");
        }
    };

    const deleteCourse = async (id) => {
        if (!window.confirm("Bu dersi ve tüm içeriğini silmek istediğine emin misin?")) return;
        try {
            await api.delete(`/courses/${id}`);
            onChange(courses.filter((c) => c.id !== id));
            if (activeCourseId === id) onSelect(null);
            toast.success("Ders silindi");
        } catch {
            toast.error("Silinemedi");
        }
    };

    const renameCourse = async (id, name) => {
        try {
            const { data } = await api.patch(`/courses/${id}`, { name });
            onChange(courses.map((c) => (c.id === id ? data : c)));
        } catch {
            toast.error("Yeniden adlandırılamadı");
        }
    };

    const toggleComplete = async (course) => {
        const next = !course.completed;
        onChange(courses.map((c) => (c.id === course.id ? { ...c, completed: next } : c)));
        try {
            const { data } = await api.patch(`/courses/${course.id}`, { completed: next });
            onChange(courses.map((c) => (c.id === course.id ? data : c)));
            if (next) toast.success("Ders tamamlandı olarak işaretlendi", { duration: 1200 });
        } catch {
            onChange(courses.map((c) => (c.id === course.id ? { ...c, completed: !next } : c)));
            toast.error("Durum güncellenemedi");
        }
    };

    const completedCount = courses.filter((c) => c.completed).length;
    const progress = courses.length ? Math.round((completedCount / courses.length) * 100) : 0;

    return (
        <aside className="w-full lg:w-80 shrink-0" data-testid="course-sidebar">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-xs tracking-[0.2em] uppercase font-bold text-neutral-500">Ders Sırası</p>
                    <h2 className="font-display text-2xl font-black flex items-center gap-2">
                        <BookOpen size={22} weight="duotone" /> Sıradaki dersler
                    </h2>
                </div>
            </div>
            {courses.length > 0 && (
                <div className="mb-3 brut-card p-3 flex items-center gap-3" data-testid="course-progress">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs uppercase tracking-widest font-bold text-neutral-600">İlerleme</span>
                            <span className="text-xs font-bold">{completedCount}/{courses.length} · {progress}%</span>
                        </div>
                        <div className="h-2 border-2 border-black rounded-full overflow-hidden bg-white">
                            <div
                                className="h-full transition-[width] duration-300"
                                style={{ width: `${progress}%`, background: "#A7E8D0" }}
                            />
                        </div>
                    </div>
                </div>
            )}
            <p className="text-xs text-neutral-600 mb-3">Sürükleyip sırala. Kutucuğu işaretle: tamamlandı.</p>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={courses.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                        {courses.map((c, i) => (
                            <SortableCourseItem
                                key={c.id}
                                index={i}
                                course={c}
                                active={c.id === activeCourseId}
                                onSelect={onSelect}
                                onDelete={deleteCourse}
                                onRename={renameCourse}
                                onToggleComplete={toggleComplete}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {courses.length === 0 && (
                <div className="brut-card p-6 text-center" data-testid="course-empty">
                    <p className="font-bold mb-1">Henüz ders yok</p>
                    <p className="text-sm text-neutral-600">İlk dersini ekleyerek başla.</p>
                </div>
            )}

            <div className="mt-4">
                {adding ? (
                    <div className="brut-card p-3 space-y-2">
                        <input
                            autoFocus
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addCourse()}
                            placeholder="Ders adı (örn. Matematik)"
                            className="brut-input"
                            data-testid="new-course-input"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={addCourse}
                                className="brut-btn flex-1 py-2 rounded-md font-bold"
                                style={{background: "#A7E8D0"}}
                                data-testid="new-course-save-btn"
                            >Ekle</button>
                            <button
                                onClick={() => { setAdding(false); setNewName(""); }}
                                className="brut-btn px-3 py-2 rounded-md font-bold bg-white"
                                data-testid="new-course-cancel-btn"
                            >İptal</button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setAdding(true)}
                        className="brut-btn w-full py-3 rounded-md font-bold flex items-center justify-center gap-2 bg-white"
                        data-testid="add-course-btn"
                    >
                        <Plus size={18} weight="bold" /> Yeni Ders Ekle
                    </button>
                )}
            </div>
        </aside>
    );
}
