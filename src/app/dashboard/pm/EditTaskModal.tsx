"use client";

import { useState, useEffect } from "react";
import { updateTask, deleteTask } from "@/app/actions/taskActions";
import { calculateBusinessHours } from "@/lib/business-logic";

interface Task {
    _id: string;
    title: string;
    description: string;
    status: string;
    complexity: string;
    points: number;
    estimatedHours: number;
    actualHours: number;
    scheduledStartDate?: string;
    scheduledEndDate?: string;
    assignedTo?: { _id: string; name: string; email: string };
}

interface EditTaskModalProps {
    task: Task | null;
    developers: { _id: string; name: string }[];
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export default function EditTaskModal({
    task,
    developers,
    onClose,
    onSuccess,
    onError,
}: EditTaskModalProps) {
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [formData, setFormData] = useState({
        title: task?.title || "",
        description: task?.description || "",
        assignedTo: task?.assignedTo?._id || "",
        complexity: task?.complexity || "Easy",
        estimatedHours: task?.estimatedHours || 1,
        scheduledStartDate: task?.scheduledStartDate ? new Date(task.scheduledStartDate).toISOString().split('T')[0] : "",
        scheduledEndDate: task?.scheduledEndDate ? new Date(task.scheduledEndDate).toISOString().split('T')[0] : "",
    });

    useEffect(() => {
        if (formData.scheduledStartDate && formData.scheduledEndDate) {
            const hours = calculateBusinessHours(new Date(formData.scheduledStartDate), new Date(formData.scheduledEndDate));
            setFormData(prev => ({ ...prev, estimatedHours: hours }));
        }
    }, [formData.scheduledStartDate, formData.scheduledEndDate]);

    if (!task) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const result = await updateTask(task!._id, formData);

        if (result.success) {
            onSuccess("Task updated successfully");
            onClose();
        } else {
            onError(result.error || "Failed to update task");
        }

        setLoading(false);
    }

    async function handleDelete() {
        setLoading(true);

        const result = await deleteTask(task!._id);

        if (result.success) {
            onSuccess("Task deleted successfully");
            onClose();
        } else {
            onError(result.error || "Failed to delete task");
        }

        setLoading(false);
    }

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-[#1e1e1e]/90 backdrop-blur-xl rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h3 className="text-xl font-semibold text-white">Edit Task</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                {showDeleteConfirm ? (
                    <div className="p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Delete Task?</h4>
                            <p className="text-slate-400 mb-6">
                                Are you sure you want to delete "{task.title}"? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={loading}
                                    className="flex-1 py-2.5 px-4 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="flex-1 py-2.5 px-4 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition disabled:opacity-50"
                                >
                                    {loading ? "Deleting..." : "Delete Task"}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Task Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none"
                            />
                        </div>

                        {/* Assign To */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Assigned To *
                            </label>
                            <select
                                value={formData.assignedTo}
                                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                required
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                            >
                                <option value="">Select a developer</option>
                                {developers.map((dev) => (
                                    <option key={dev._id} value={dev._id}>
                                        {dev.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.scheduledStartDate}
                                    onChange={(e) => setFormData({ ...formData, scheduledStartDate: e.target.value })}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition [color-scheme:dark]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.scheduledEndDate}
                                    onChange={(e) => setFormData({ ...formData, scheduledEndDate: e.target.value })}
                                    min={formData.scheduledStartDate}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        {/* Complexity & Hours */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Complexity *
                                </label>
                                <select
                                    value={formData.complexity}
                                    onChange={(e) => setFormData({ ...formData, complexity: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                                >
                                    <option value="Easy">Easy (1 pt)</option>
                                    <option value="Medium">Medium (3 pts)</option>
                                    <option value="Hard">Hard (5 pts)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Estimated Hours *
                                </label>
                                <input
                                    type="number"
                                    value={formData.estimatedHours}
                                    onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) })}
                                    step="0.5"
                                    min="0.5"
                                    required
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                                />
                            </div>
                        </div>

                        {/* Current Status Info */}
                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Current Status:</span>
                                <span className="font-medium text-white">{task.status}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-1">
                                <span className="text-slate-400">Actual Hours Logged:</span>
                                <span className="font-medium text-white">{task.actualHours}h</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="py-2.5 px-4 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                            >
                                Delete Task
                            </button>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="py-2.5 px-5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="py-2.5 px-5 text-sm font-medium bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg shadow-lg shadow-orange-500/25 transition disabled:opacity-50"
                                >
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
