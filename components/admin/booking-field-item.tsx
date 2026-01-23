"use client";

import { Reorder } from "framer-motion";
import { GripVertical, Trash2 } from "lucide-react";
import { useEffect, useState, memo } from "react";
import type { BookingFieldConfig, BookingFieldType } from "@/lib/database.types";

interface BookingFieldItemProps {
    field: BookingFieldConfig;
    onUpdate: (updates: Partial<BookingFieldConfig>) => void;
    onRemove: () => void;
    types: { type: BookingFieldType; label: string; icon: React.ReactNode }[];
}

export const BookingFieldItem = memo(function BookingFieldItem({
    field,
    onUpdate,
    onRemove,
    types,
}: BookingFieldItemProps) {
    // Local state for smooth typing without parent re-renders interruption
    const [label, setLabel] = useState(field.field_label);
    const [options, setOptions] = useState((field.field_options || []).join(", "));

    // Sync local state if prop changes externally (rare, but good practice)
    useEffect(() => {
        setLabel(field.field_label);
    }, [field.field_label]);

    useEffect(() => {
        setOptions((field.field_options || []).join(", "));
    }, [field.field_options]);

    // Handlers
    const handleLabelBlur = () => {
        if (label !== field.field_label) {
            onUpdate({ field_label: label });
        }
    };

    const handleOptionsBlur = () => {
        const currentOptions = (field.field_options || []).join(", ");
        if (options !== currentOptions) {
            onUpdate({
                field_options: options.split(",").map((s) => s.trim()).filter(Boolean),
            });
        }
    };

    return (
        <Reorder.Item
            value={field}
            className="group relative"
        >
            <div className="p-4 rounded-lg bg-[var(--surface-2)] border border-white/[0.06] hover:border-white/[0.1] transition-colors">
                <div className="flex items-start gap-3">
                    {/* Drag Handle */}
                    <div className="pt-2 cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-white transition-colors">
                        <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Field Configuration */}
                    <div className="flex-1 space-y-3">
                        {/* Row 1: Label and Type */}
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)} // Local update only
                                onBlur={handleLabelBlur} // Commit to parent on blur
                                placeholder="Nome campo (es: Nome, Email)"
                                className="px-3 py-2 text-sm bg-[var(--surface-1)] border border-white/[0.06] rounded-md text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50"
                            />
                            <select
                                value={field.field_type}
                                onChange={(e) => {
                                    const type = e.target.value as BookingFieldType;
                                    onUpdate({
                                        field_type: type,
                                        field_options: type === "select" ? ["Opzione 1"] : undefined,
                                    });
                                }}
                                className="px-3 py-2 text-sm bg-[var(--surface-1)] border border-white/[0.06] rounded-md text-white focus:outline-none focus:border-[var(--accent)]/50"
                            >
                                {types.map((ft) => (
                                    <option key={ft.type} value={ft.type}>
                                        {ft.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Row 2: Options for select */}
                        {field.field_type === "select" && (
                            <input
                                type="text"
                                value={options}
                                onChange={(e) => setOptions(e.target.value)} // Local update
                                onBlur={handleOptionsBlur} // Commit
                                placeholder="Opzioni (separate da virgola)"
                                className="w-full px-3 py-2 text-sm bg-[var(--surface-1)] border border-white/[0.06] rounded-md text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50"
                            />
                        )}

                        {/* Row 3: Required toggle */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={field.is_required}
                                onChange={(e) => onUpdate({ is_required: e.target.checked })}
                                className="w-4 h-4 rounded border-white/20 bg-[var(--surface-1)] text-[var(--accent)] focus:ring-[var(--accent)]/50"
                            />
                            <span className="text-xs text-[var(--text-muted)]">Campo obbligatorio</span>
                        </label>
                    </div>

                    {/* Delete Button */}
                    <button
                        type="button"
                        onClick={onRemove}
                        className="p-2 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </Reorder.Item>
    );
});
