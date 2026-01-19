"use client";

import { useState } from "react";

interface BlockerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (blockerNote: string) => void;
    isRemoving?: boolean;
}

export default function BlockerModal({ isOpen, onClose, onConfirm, isRemoving = false }: BlockerModalProps) {
    const [blockerNote, setBlockerNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        await onConfirm(blockerNote);
        setBlockerNote("");
        setSubmitting(false);
        onClose();
    }

    function handleClose() {
        setBlockerNote("");
        onClose();
    }

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
            <div className="glass-modal rounded-2xl p-6 w-full max-w-md animate-scale-in-bounce">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <div className={`p-3 rounded-xl ${isRemoving
                        ? "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20"
                        : "bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/20"}`}>
                        {isRemoving ? (
                            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">
                            {isRemoving ? "Remove Blocker" : "Mark as Blocked"}
                        </h3>
                        <p className="text-xs text-neutral-500">
                            {isRemoving ? "Task will resume normal status" : "This will notify your PM"}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {!isRemoving && (
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                What&apos;s blocking this task?
                            </label>
                            <textarea
                                value={blockerNote}
                                onChange={(e) => setBlockerNote(e.target.value)}
                                placeholder="Describe the blocker (e.g., waiting for API access, dependency on another task...)"
                                rows={3}
                                className="input-premium w-full resize-none"
                            />
                            <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1.5">
                                <svg className="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                This helps your PM understand and resolve the issue faster.
                            </p>
                        </div>
                    )}

                    {isRemoving && (
                        <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <p className="text-sm text-neutral-300">
                                Are you sure you want to remove the blocker from this task? The task will return to its normal status.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={submitting}
                            className="btn-ghost px-5 py-2.5 text-sm disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 shadow-lg ${isRemoving
                                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/25"
                                : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-500/25"
                                } hover:-translate-y-0.5`}
                        >
                            {submitting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : isRemoving ? (
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Remove Blocker
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    Mark as Blocked
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
