"use client";

import { useEffect } from "react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDangerous = false,
}: ConfirmationModalProps) {
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (!isOpen) return;
            if (e.key === "Escape") onClose();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="glass-modal rounded-2xl p-6 max-w-md w-full animate-scale-in-bounce"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-4 mb-6">
                    {isDangerous ? (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center flex-shrink-0 border border-red-500/25">
                            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center flex-shrink-0 border border-orange-500/25">
                            <svg className="w-7 h-7 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    )}
                    <div className="flex-1 pt-1">
                        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                        <p className="text-neutral-400 text-sm leading-relaxed">{message}</p>
                    </div>
                </div>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="btn-ghost px-5 py-2.5 text-sm"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all hover:-translate-y-0.5 ${isDangerous
                            ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-500/25"
                            : "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-orange-500/25"
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
