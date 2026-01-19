"use client";

import { useState, useEffect } from "react";
import { createTask } from "@/app/actions/taskActions";
import { calculateBusinessHours } from "@/lib/business-logic";

interface CreateTaskModalProps {
    developers: { _id: string; name: string }[];
    onClose: () => void;
    projectId?: string; // Optional: pre-link task to a project
}

export default function CreateTaskModal({ developers, onClose, projectId }: CreateTaskModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [estimatedHours, setEstimatedHours] = useState<number | "">("");

    useEffect(() => {
        if (startDate && endDate) {
            const hours = calculateBusinessHours(new Date(startDate), new Date(endDate));
            setEstimatedHours(hours);
        }
    }, [startDate, endDate]);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError("");

        const result = await createTask(formData);

        if (result.success) {
            onClose();
        } else {
            setError(result.error || "Failed to create task");
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white">Create New Task</h3>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                <form action={handleSubmit} className="space-y-5">
                    {/* Hidden project field */}
                    {projectId && <input type="hidden" name="projectId" value={projectId} />}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Task Title *
                        </label>
                        <input
                            name="title"
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-black/30 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                            placeholder="Enter task title"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            rows={3}
                            className="w-full px-4 py-3 bg-black/30 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all resize-none"
                            placeholder="Task description (optional)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Assign To *
                        </label>
                        <select
                            name="assignedTo"
                            required
                            className="w-full px-4 py-3 bg-black/30 border border-neutral-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                        >
                            <option value="">Select a developer</option>
                            {developers.map((dev) => (
                                <option key={dev._id} value={dev._id}>
                                    {dev.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Start Date *
                            </label>
                            <input
                                name="scheduledStartDate"
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition [color-scheme:dark]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                End Date *
                            </label>
                            <input
                                name="scheduledEndDate"
                                type="date"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Complexity *
                            </label>
                            <select
                                name="complexity"
                                required
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                            >
                                <option value="">Select</option>
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
                                name="estimatedHours"
                                type="number"
                                step="0.5"
                                min="0.5"
                                required
                                value={estimatedHours}
                                onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || "")}
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                                placeholder="Auto-calculated"
                            />
                        </div>
                    </div>

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
                                <>Create Task</>
                            )}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
