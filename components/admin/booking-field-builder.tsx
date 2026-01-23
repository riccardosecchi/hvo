"use client";

import React, { useState, useCallback } from "react";
import { Reorder } from "framer-motion";
import {
    Plus,
    Type,
    Mail,
    Phone,
    Hash,
    AlignLeft,
    List,
} from "lucide-react";
import type { BookingFieldConfig, BookingFieldType } from "@/lib/database.types";
import { BookingFieldItem } from "./booking-field-item";

interface BookingFieldBuilderProps {
    fields: BookingFieldConfig[];
    onChange: React.Dispatch<React.SetStateAction<BookingFieldConfig[]>>;
}

const FIELD_TYPES: { type: BookingFieldType; label: string; icon: React.ReactNode }[] = [
    { type: "text", label: "Testo", icon: <Type className="w-4 h-4" /> },
    { type: "email", label: "Email", icon: <Mail className="w-4 h-4" /> },
    { type: "tel", label: "Telefono", icon: <Phone className="w-4 h-4" /> },
    { type: "number", label: "Numero", icon: <Hash className="w-4 h-4" /> },
    { type: "textarea", label: "Testo lungo", icon: <AlignLeft className="w-4 h-4" /> },
    { type: "select", label: "Selezione", icon: <List className="w-4 h-4" /> },
];

const DEFAULT_FIELDS: BookingFieldConfig[] = [
    { field_name: "name", field_label: "Nome Completo", field_type: "text", is_required: true },
    { field_name: "email", field_label: "Email", field_type: "email", is_required: true },
];

export function BookingFieldBuilder({ fields, onChange }: BookingFieldBuilderProps) {
    const [newFieldType, setNewFieldType] = useState<BookingFieldType>("text");

    const addField = () => {
        const newField: BookingFieldConfig = {
            field_name: `field_${Date.now()}`,
            field_label: "",
            field_type: newFieldType,
            is_required: false,
            field_options: newFieldType === "select" ? ["Opzione 1", "Opzione 2"] : undefined,
        };
        onChange([...fields, newField]);
    };

    // Use functional updates to avoid stale closure issues
    const updateField = useCallback((index: number, updates: Partial<BookingFieldConfig>) => {
        onChange(prevFields => {
            const newFields = [...prevFields];
            newFields[index] = { ...newFields[index], ...updates };
            return newFields;
        });
    }, [onChange]);

    const removeField = useCallback((index: number) => {
        onChange(prevFields => prevFields.filter((_, i) => i !== index));
    }, [onChange]);

    const addDefaultFields = () => {
        onChange([...DEFAULT_FIELDS]);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                    Campi del form di prenotazione
                </p>
                {fields.length === 0 && (
                    <button
                        type="button"
                        onClick={addDefaultFields}
                        className="text-xs text-[var(--accent)] hover:text-white transition-colors"
                    >
                        + Aggiungi campi predefiniti
                    </button>
                )}
            </div>

            {/* Fields List */}
            <Reorder.Group
                axis="y"
                values={fields}
                onReorder={onChange}
                className="space-y-3"
            >
                {fields.map((field, index) => (
                    <BookingFieldItem
                        key={field.field_name}
                        field={field}
                        types={FIELD_TYPES}
                        onUpdate={(updates) => updateField(index, updates)}
                        onRemove={() => removeField(index)}
                    />
                ))}
            </Reorder.Group>

            {/* Add Field Button */}
            <div className="flex items-center gap-3">
                <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as BookingFieldType)}
                    className="px-3 py-2 text-sm bg-[var(--surface-2)] border border-white/[0.06] rounded-md text-white focus:outline-none focus:border-[var(--accent)]/50"
                >
                    {FIELD_TYPES.map((ft) => (
                        <option key={ft.type} value={ft.type}>
                            {ft.label}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={addField}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--accent)] border border-[var(--accent)]/30 rounded-md hover:bg-[var(--accent)]/10 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Aggiungi campo
                </button>
            </div>

            {/* Preview note */}
            {fields.length > 0 && (
                <p className="text-xs text-[var(--text-muted)]">
                    💡 Trascina i campi per riordinarli.
                </p>
            )}
        </div>
    );
}
