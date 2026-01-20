"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateTask, deleteTask, getDevelopers } from "@/app/actions/taskActions";
import { calculateBusinessHours } from "@/lib/business-logic";

interface EditTaskPageProps {
    task: {
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
    };
}

export default function EditTaskPageClient({ task }: EditTaskPageProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [developers, setDevelopers] = useState<{ _id: string; name: string }[]>([]);

    // Form state with explicit fallbacks for null/undefined values
    const [formData, setFormData] = useState({
        title: task.title || "",
        description: task.description || "",
        assignedTo: task.assignedTo?._id || "",
        complexity: task.complexity || "Easy",
        estimatedHours: task.estimatedHours || 1,
        scheduledStartDate: task.scheduledStartDate
            ? new Date(task.scheduledStartDate).toISOString().split('T')[0]
            : "",
        scheduledEndDate: task.scheduledEndDate
            ? new Date(task.scheduledEndDate).toISOString().split('T')[0]
            : "",
    });

    useEffect(() => {
        async function loadDevs() {
            const result = await getDevelopers();
            if (result.success) {
                setDevelopers(result.developers || []);
            }
        }
        loadDevs();
    }, []);

    // Calculate estimated hours based on dates - derived value using useMemo
    const computedEstimatedHours = useMemo(() => {
        if (formData.scheduledStartDate && formData.scheduledEndDate) {
            return calculateBusinessHours(new Date(formData.scheduledStartDate), new Date(formData.scheduledEndDate));
        }
        return formData.estimatedHours;
    }, [formData.scheduledStartDate, formData.scheduledEndDate, formData.estimatedHours]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const result = await updateTask(task._id, formData);

        if (result.success) {
            router.push("/dashboard/pm?tab=tasks");
            router.refresh();
        } else {
            console.error(result.error);
            setLoading(false);
        }
    }

    async function handleDelete() {
        setLoading(true);
        const result = await deleteTask(task._id);
        if (result.success) {
            router.push("/dashboard/pm?tab=tasks");
            router.refresh();
        } else {
            console.error(result.error);
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/30 to-white p-6 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Premium Form Container */}
                <div className="form-container-premium animate-fade-in">
                    {/* Premium Header */}
                    <div className="form-header-premium">
                        <div className="form-header-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <div className="form-header-content flex-1">
                            <h1>Edit Task</h1>
                            <p>Update task details, assignment, and schedule</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="p-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete Task"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>

                    {/* Delete Confirmation */}
                    {showDeleteConfirm && (
                        <div className="delete-confirm-premium">
                            <h4>Delete Task?</h4>
                            <p>Are you sure you want to delete &quot;{task.title}&quot;? This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={loading}
                                    className="btn-stunning-ghost flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="flex-1 py-3 px-4 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl transition disabled:opacity-50"
                                >
                                    {loading ? "Deleting..." : "Delete Task"}
                                </button>
                            </div>
                        </div>
                    )}

                    {!showDeleteConfirm && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Information Section */}
                            <div className="section-divider-premium">
                                <h3>Basic Information</h3>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="form-label-premium">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Task Title <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        className="input-stunning"
                                    />
                                </div>

                                <div>
                                    <label className="form-label-premium">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                        </svg>
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="textarea-stunning"
                                    />
                                </div>
                            </div>

                            {/* Assignment Section */}
                            <div className="section-divider-premium">
                                <h3>Assignment</h3>
                            </div>

                            <div>
                                <label className="form-label-premium">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Assigned To <span className="required">*</span>
                                </label>
                                <select
                                    value={formData.assignedTo}
                                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                    className="select-stunning"
                                >
                                    <option value="">Select a developer</option>
                                    {developers.map((dev) => (
                                        <option key={dev._id} value={dev._id}>
                                            {dev.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Schedule Section */}
                            <div className="section-divider-premium">
                                <h3>Schedule</h3>
                            </div>

                            <div className="form-field-group">
                                <div>
                                    <label className="form-label-premium">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.scheduledStartDate}
                                        onChange={(e) => setFormData({ ...formData, scheduledStartDate: e.target.value })}
                                        className="input-stunning"
                                    />
                                </div>
                                <div>
                                    <label className="form-label-premium">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.scheduledEndDate}
                                        onChange={(e) => setFormData({ ...formData, scheduledEndDate: e.target.value })}
                                        min={formData.scheduledStartDate}
                                        className="input-stunning"
                                    />
                                </div>
                            </div>

                            {/* Complexity & Hours Section */}
                            <div className="section-divider-premium">
                                <h3>Complexity & Estimates</h3>
                            </div>

                            <div className="form-field-group">
                                <div>
                                    <label className="form-label-premium">
                                        Complexity <span className="required">*</span>
                                    </label>
                                    <select
                                        value={formData.complexity}
                                        onChange={(e) => setFormData({ ...formData, complexity: e.target.value })}
                                        required
                                        className="select-stunning"
                                    >
                                        <option value="Easy">🟢 Easy (1 pt)</option>
                                        <option value="Medium">🟡 Medium (3 pts)</option>
                                        <option value="Hard">🔴 Hard (5 pts)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label-premium">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Estimated Hours <span className="required">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={computedEstimatedHours}
                                        onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) })}
                                        step="0.5"
                                        min="0.5"
                                        required
                                        className="input-stunning"
                                    />
                                </div>
                            </div>

                            {/* Current Status Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="metrics-card-premium">
                                    <span className="label">Current Status</span>
                                    <span className="value">{task.status}</span>
                                </div>
                                <div className="metrics-card-premium highlight">
                                    <span className="label">Actual Hours</span>
                                    <span className="value">{task.actualHours}h logged</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="form-actions-premium">
                                <Link href="/dashboard/pm" className="btn-stunning-ghost">
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-stunning-primary"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
