"use client";

import { useState, useEffect } from "react";
import { updateProject, deleteProject } from "@/app/actions/projectActions";
import { ProjectStatus } from "@/models/Project";

interface EditProjectModalProps {
    project: {
        _id: string;
        name: string;
        key: string;
        description: string;
        status: ProjectStatus;
        color: string;
        startDate: string;
        targetEndDate?: string;
        developers: { _id: string; name: string }[];
    };
    allDevelopers: { _id: string; name: string }[];
    onClose: () => void;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

const PROJECT_COLORS = [
    "#f97316", "#ef4444", "#22c55e", "#3b82f6",
    "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b",
];

const STATUS_OPTIONS: { value: ProjectStatus; label: string; color: string }[] = [
    { value: "Active", label: "Active", color: "bg-emerald-500" },
    { value: "On Hold", label: "On Hold", color: "bg-amber-500" },
    { value: "Completed", label: "Completed", color: "bg-blue-500" },
    { value: "Archived", label: "Archived", color: "bg-neutral-500" },
];

export default function EditProjectModal({
    project,
    allDevelopers,
    onClose,
    onSuccess,
    onError,
}: EditProjectModalProps) {
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description);
    const [status, setStatus] = useState(project.status);
    const [selectedColor, setSelectedColor] = useState(project.color);
    const [startDate, setStartDate] = useState(
        new Date(project.startDate).toISOString().split("T")[0]
    );
    const [targetEndDate, setTargetEndDate] = useState(
        project.targetEndDate
            ? new Date(project.targetEndDate).toISOString().split("T")[0]
            : ""
    );
    const [selectedDevs, setSelectedDevs] = useState<string[]>(
        project.developers.map(d => d._id)
    );

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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await updateProject(project._id, {
            name,
            description,
            status,
            color: selectedColor,
            startDate,
            targetEndDate: targetEndDate || null,
            developers: selectedDevs,
        });

        if (result.success) {
            onSuccess?.("Project updated successfully!");
            onClose();
        } else {
            setError(result.error || "Failed to update project");
            onError?.(result.error || "Failed to update project");
            setLoading(false);
        }
    }

    async function handleDelete(deleteTasksToo: boolean) {
        setDeleting(true);
        const result = await deleteProject(project._id, deleteTasksToo);

        if (result.success) {
            onSuccess?.("Project deleted successfully!");
            onClose();
        } else {
            setError(result.error || "Failed to delete project");
            onError?.(result.error || "Failed to delete project");
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="glass-modal rounded-2xl p-6 w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: selectedColor }}
                        >
                            {project.key}
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-white">Edit Project</h3>
                            <p className="text-sm text-neutral-400">{project.key}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                        title="Delete Project"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <p className="text-red-400 font-medium mb-3">Delete this project?</p>
                        <p className="text-sm text-neutral-400 mb-4">
                            Choose whether to also delete all tasks in this project or keep them as standalone tasks.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleDelete(false)}
                                disabled={deleting}
                                className="flex-1 py-2 text-sm font-medium bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition disabled:opacity-50"
                            >
                                {deleting ? "..." : "Keep Tasks"}
                            </button>
                            <button
                                onClick={() => handleDelete(true)}
                                disabled={deleting}
                                className="flex-1 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition disabled:opacity-50"
                            >
                                {deleting ? "..." : "Delete All"}
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-3 py-2 text-sm text-neutral-400 hover:text-white transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Project Name
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-black/30 border border-neutral-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Status
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {STATUS_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setStatus(opt.value)}
                                    className={`px-4 py-2 text-sm rounded-lg border transition-all flex items-center gap-2 ${status === opt.value
                                        ? "bg-orange-500/20 border-orange-500/50 text-white"
                                        : "bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:border-neutral-600"
                                        }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Description
                        </label>
                        <textarea
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 bg-black/30 border border-neutral-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none"
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition [color-scheme:dark]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Target End
                            </label>
                            <input
                                type="date"
                                value={targetEndDate}
                                onChange={(e) => setTargetEndDate(e.target.value)}
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    {/* Color */}
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
                            {allDevelopers.length === 0 ? (
                                <p className="text-sm text-neutral-500">No developers available</p>
                            ) : (
                                allDevelopers.map((dev) => (
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
                            className="px-5 py-2.5 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-700/50 rounded-xl transition"
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
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
