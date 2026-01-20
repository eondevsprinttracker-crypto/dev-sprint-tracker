"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateProject, deleteProject } from "@/app/actions/projectActions";
import { getDevelopers } from "@/app/actions/taskActions";
import { ProjectStatus } from "@/models/Project";

interface EditProjectPageProps {
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

export default function EditProjectPageClient({ project }: EditProjectPageProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Developer state
    const [allDevelopers, setAllDevelopers] = useState<{ _id: string; name: string }[]>([]);
    const [loadingDevelopers, setLoadingDevelopers] = useState(true);

    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description);
    const [status, setStatus] = useState(project.status);
    const [selectedColor, setSelectedColor] = useState(project.color);
    const [startDate] = useState(
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
        async function loadDevelopers() {
            const result = await getDevelopers();
            if (result.success) {
                setAllDevelopers(result.developers || []);
            }
            setLoadingDevelopers(false);
        }
        loadDevelopers();
    }, []);

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
            router.push("/dashboard/pm?tab=projects");
            router.refresh();
        } else {
            setError(result.error || "Failed to update project");
            setLoading(false);
        }
    }

    async function handleDelete(deleteTasksToo: boolean) {
        setDeleting(true);
        const result = await deleteProject(project._id, deleteTasksToo);

        if (result.success) {
            router.push("/dashboard/pm?tab=projects");
            router.refresh();
        } else {
            setError(result.error || "Failed to delete project");
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/30 to-white p-6 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Premium Form Container */}
                <div className="form-container-premium animate-fade-in">
                    {/* Premium Header */}
                    <div className="form-header-premium">
                        <div
                            className="form-header-icon"
                            style={{ background: `linear-gradient(135deg, ${selectedColor} 0%, ${selectedColor}cc 100%)` }}
                        >
                            <span className="text-white font-bold text-lg">{project.key}</span>
                        </div>
                        <div className="form-header-content flex-1">
                            <h1>Edit Project</h1>
                            <p>Update project details, team, and settings</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="p-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete Project"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>

                    {/* Delete Confirmation */}
                    {showDeleteConfirm && (
                        <div className="delete-confirm-premium">
                            <h4>Delete Project?</h4>
                            <p>This action cannot be undone. Choose to delete all associated tasks or keep them.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleDelete(false)}
                                    disabled={deleting}
                                    className="flex-1 py-3 px-4 text-sm font-semibold bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-xl transition disabled:opacity-50"
                                >
                                    {deleting ? "Deleting..." : "Keep Tasks"}
                                </button>
                                <button
                                    onClick={() => handleDelete(true)}
                                    disabled={deleting}
                                    className="flex-1 py-3 px-4 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl transition disabled:opacity-50"
                                >
                                    {deleting ? "Deleting..." : "Delete Everything"}
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-3 text-sm text-gray-600 hover:text-gray-900 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error Alert */}
                    {error && (
                        <div className="alert-premium-error">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {!showDeleteConfirm && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Project Details Section */}
                            <div className="section-divider-premium">
                                <h3>Project Details</h3>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="form-label-premium">
                                        Project Name <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="input-stunning"
                                    />
                                </div>

                                <div>
                                    <label className="form-label-premium">
                                        Description
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="textarea-stunning"
                                    />
                                </div>
                            </div>

                            {/* Status Section */}
                            <div className="section-divider-premium">
                                <h3>Status</h3>
                            </div>

                            <div className="flex gap-3 flex-wrap">
                                {STATUS_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setStatus(opt.value)}
                                        className={`px-5 py-3 text-sm rounded-xl border-2 transition-all flex items-center gap-2.5 font-medium ${status === opt.value
                                            ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300 text-orange-700 shadow-md"
                                            : "bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:shadow"
                                            }`}
                                    >
                                        <span className={`w-3 h-3 rounded-full ${opt.color}`} />
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Timeline Section */}
                            <div className="section-divider-premium">
                                <h3>Timeline</h3>
                            </div>

                            <div className="form-field-group">
                                <div>
                                    <label className="form-label-premium">
                                        Start Date <span className="required">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        className="input-stunning opacity-60 cursor-not-allowed"
                                        disabled
                                    />
                                    <p className="form-help-text">Start date cannot be changed</p>
                                </div>
                                <div>
                                    <label className="form-label-premium">
                                        Target End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={targetEndDate}
                                        onChange={(e) => setTargetEndDate(e.target.value)}
                                        className="input-stunning"
                                    />
                                </div>
                            </div>

                            {/* Visual Identity Section */}
                            <div className="section-divider-premium">
                                <h3>Visual Identity</h3>
                            </div>

                            <div>
                                <label className="form-label-premium">
                                    Project Color
                                </label>
                                <div className="color-picker-premium">
                                    {PROJECT_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setSelectedColor(color)}
                                            className={selectedColor === color ? "selected" : ""}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Team Section */}
                            <div className="section-divider-premium">
                                <h3>Team</h3>
                            </div>

                            <div>
                                <label className="form-label-premium">
                                    Team Members
                                </label>
                                {loadingDevelopers ? (
                                    <div className="team-chips-premium animate-pulse">
                                        <div className="h-10 w-32 skeleton rounded-xl" />
                                        <div className="h-10 w-28 skeleton rounded-xl" />
                                    </div>
                                ) : (
                                    <div className="team-chips-premium">
                                        {allDevelopers.length === 0 ? (
                                            <p className="text-gray-500 text-sm">No developers available</p>
                                        ) : (
                                            allDevelopers.map((dev) => (
                                                <button
                                                    key={dev._id}
                                                    type="button"
                                                    onClick={() => toggleDeveloper(dev._id)}
                                                    className={`team-chip-premium ${selectedDevs.includes(dev._id) ? "selected" : ""}`}
                                                >
                                                    <div className="avatar">
                                                        {dev.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span>{dev.name}</span>
                                                    {selectedDevs.includes(dev._id) && (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                                {selectedDevs.length > 0 && (
                                    <p className="form-help-text mt-3">
                                        <svg className="!text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-green-600 font-medium">{selectedDevs.length} developer{selectedDevs.length !== 1 ? 's' : ''} selected</span>
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="form-actions-premium">
                                <Link
                                    href="/dashboard/pm?tab=projects"
                                    className="btn-stunning-ghost"
                                >
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
