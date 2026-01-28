"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string) => void;
    hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const colors = {
    success: {
        bg: "bg-green-500/10",
        border: "border-green-500/30",
        icon: "text-green-400",
        text: "text-green-400",
    },
    error: {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        icon: "text-red-400",
        text: "text-red-400",
    },
    warning: {
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        icon: "text-amber-400",
        text: "text-amber-400",
    },
    info: {
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        icon: "text-blue-400",
        text: "text-blue-400",
    },
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const Icon = icons[toast.type];
    const colorClasses = colors[toast.type];

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm ${colorClasses.bg} ${colorClasses.border}`}
        >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${colorClasses.icon}`} />
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${colorClasses.text}`}>{toast.title}</p>
                {toast.message && (
                    <p className="text-sm text-[var(--text-muted)] mt-1">{toast.message}</p>
                )}
            </div>
            <button
                onClick={onClose}
                className="p-1 rounded hover:bg-white/10 transition-colors"
            >
                <X className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
        </motion.div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, title: string, message?: string) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, type, title, message }]);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <div key={toast.id} className="pointer-events-auto">
                            <ToastItem toast={toast} onClose={() => hideToast(toast.id)} />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
