"use client";

import { useState, useEffect } from "react";
import { createProject } from "@/app/actions/projectActions";

interface CreateProjectModalProps {
    developers: { _id: string; name: string }[];
    onClose: () => void;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

const PROJECT_COLORS = [
    "#f97316", // Orange
    "#ef4444", // Red
    "#22c55e", // Green
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#14b8a6", // Teal
    "#f59e0b", // Amber
];

export default function CreateProjectModal({
    developers,
    onClose,
    onSuccess,
    onError,
}: CreateProjectModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedDevs, setSelectedDevs] = useState<string[]>([]);
    const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    const toggleDeveloper = (devId: string) => {
        setSelectedDevs((prev) =>
            prev.includes(devId) ? prev.filter((id) => id !== devId) : [...prev, devId]
        );
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const form = e.currentTarget;
        const formData = new FormData(form);

        // Add selected developers
        selectedDevs.forEach((devId) => {
            formData.append("developers", devId);
        });

        formData.set("color", selectedColor);

        const result = await createProject(formData);

        if (result.success) {
            onSuccess?.("Project created successfully!");
            onClose();
        } else {
            setError(result.error || "Failed to create project");
            onError?.(result.error || "Failed to create project");
            setLoading(false);
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="glass-modal rounded-2xl p-6 w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-white">Create New Project</h3>
                        <p className="text-sm text-neutral-400">Set up a new project to organize tasks</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Project Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Project Name *
                        </label>
                        <input
                            name="name"
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-black/30 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                            placeholder="e.g., Mobile App Development"
                        />
                    </div>

                    {/* Project Key */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Project Key * <span className="text-neutral-500">(2-6 letters)</span>
                        </label>
                        <input
                            name="key"
                            type="text"
                            required
                            maxLength={6}
                            minLength={2}
                            pattern="[A-Za-z]+"
                            className="w-full px-4 py-3 bg-black/30 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all uppercase"
                            placeholder="e.g., MOB"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            rows={2}
                            className="w-full px-4 py-3 bg-black/30 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all resize-none"
                            placeholder="Brief description of the project"
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Start Date *
                            </label>
                            <input
                                name="startDate"
                                type="date"
                                required
                                defaultValue={new Date().toISOString().split("T")[0]}
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition [color-scheme:dark]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Target End Date
                            </label>
                            <input
                                name="targetEndDate"
                                type="date"
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Project Color
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {PROJECT_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-8 h-8 rounded-lg transition-all ${selectedColor === color
                                        ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110"
                                        : "hover:scale-105"
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Team Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Team Members
                        </label>
                        <div className="flex flex-wrap gap-2 p-3 bg-black/20 border border-neutral-700/50 rounded-xl max-h-36 overflow-y-auto">
                            {developers.length === 0 ? (
                                <p className="text-sm text-neutral-500">No developers available</p>
                            ) : (
                                developers.map((dev) => (
                                    <button
                                        key={dev._id}
                                        type="button"
                                        onClick={() => toggleDeveloper(dev._id)}
                                        className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${selectedDevs.includes(dev._id)
                                            ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                                            : "bg-neutral-800/50 border-neutral-700/50 text-neutral-300 hover:border-neutral-600"
                                            }`}
                                    >
                                        {dev.name}
                                        {selectedDevs.includes(dev._id) && (
                                            <svg className="w-3 h-3 inline ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                        {selectedDevs.length > 0 && (
                            <p className="text-xs text-neutral-500 mt-1">{selectedDevs.length} developer(s) selected</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-5 py-2.5 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-700/50 rounded-xl transition border border-transparent hover:border-neutral-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl shadow-lg shadow-orange-500/25 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Creating...
                                </>
                            ) : (
                                <>Create Project</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
