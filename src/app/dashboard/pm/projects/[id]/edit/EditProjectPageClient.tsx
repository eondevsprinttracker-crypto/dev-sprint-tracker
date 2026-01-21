"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { updateProject, deleteProject } from "@/app/actions/projectActions";
import { getDevelopers } from "@/app/actions/taskActions";
import { ProjectStatus, ProjectCategory, ProjectPriority, ProjectVisibility, ProjectRiskLevel } from "@/models/Project";

// Dynamic import for RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
    ssr: false,
    loading: () => (
        <div className="h-[250px] rounded-xl bg-gray-100 animate-pulse flex items-center justify-center">
            <span className="text-gray-400">Loading editor...</span>
        </div>
    ),
});

interface EditProjectPageProps {
    project: {
        _id: string;
        name: string;
        key: string;
        description: string;
        status: ProjectStatus;
        color: string;
        category?: ProjectCategory;
        priority?: ProjectPriority;
        visibility?: ProjectVisibility;
        riskLevel?: ProjectRiskLevel;
        budget?: number;
        client?: string;
        repository?: string;
        tags?: string[];
        notes?: string;
        startDate: string;
        targetEndDate?: string;
        developers: { _id: string; name: string }[];
    };
}

const PROJECT_COLORS = [
    "#f97316", "#ef4444", "#22c55e", "#3b82f6",
    "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b",
    "#6366f1", "#84cc16",
];

const STATUS_OPTIONS: { value: ProjectStatus; label: string; color: string }[] = [
    { value: "Active", label: "Active", color: "bg-emerald-500" },
    { value: "On Hold", label: "On Hold", color: "bg-amber-500" },
    { value: "Completed", label: "Completed", color: "bg-blue-500" },
    { value: "Archived", label: "Archived", color: "bg-neutral-500" },
];

const CATEGORY_OPTIONS = [
    { value: "Web", label: "Web Application", icon: "🌐" },
    { value: "Mobile", label: "Mobile App", icon: "📱" },
    { value: "Desktop", label: "Desktop Software", icon: "🖥️" },
    { value: "API", label: "API / Backend", icon: "⚡" },
    { value: "Data", label: "Data / Analytics", icon: "📊" },
    { value: "DevOps", label: "DevOps / Infrastructure", icon: "🔧" },
    { value: "Other", label: "Other", icon: "📦" },
];

const PRIORITY_OPTIONS = [
    { value: "Low", label: "Low", color: "bg-gray-400" },
    { value: "Medium", label: "Medium", color: "bg-blue-500" },
    { value: "High", label: "High", color: "bg-amber-500" },
    { value: "Critical", label: "Critical", color: "bg-red-500" },
];

const VISIBILITY_OPTIONS = [
    { value: "Private", label: "Private", icon: "🔒", desc: "Only you can see" },
    { value: "Team", label: "Team", icon: "👥", desc: "Team members only" },
    { value: "Public", label: "Public", icon: "🌍", desc: "Visible to all" },
];

const RISK_LEVEL_OPTIONS = [
    { value: "Low", label: "Low Risk", color: "bg-emerald-500" },
    { value: "Medium", label: "Medium Risk", color: "bg-amber-500" },
    { value: "High", label: "High Risk", color: "bg-red-500" },
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

    // Form state
    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description);
    const [status, setStatus] = useState(project.status);
    const [selectedColor, setSelectedColor] = useState(project.color);
    const [category, setCategory] = useState<string>(project.category || "Web");
    const [priority, setPriority] = useState<string>(project.priority || "Medium");
    const [visibility, setVisibility] = useState<string>(project.visibility || "Team");
    const [riskLevel, setRiskLevel] = useState<string>(project.riskLevel || "Low");
    const [budget, setBudget] = useState(project.budget?.toString() || "");
    const [client, setClient] = useState(project.client || "");
    const [repository, setRepository] = useState(project.repository || "");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>(project.tags || []);
    const [notes, setNotes] = useState(project.notes || "");
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

    const addTag = () => {
        const trimmed = tagInput.trim();
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTag();
        }
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
            category,
            priority,
            visibility,
            riskLevel,
            budget: budget ? parseFloat(budget) : null,
            client: client || null,
            repository: repository || null,
            tags,
            notes: notes || null,
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
            <div className="max-w-4xl mx-auto">
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
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* ===== SECTION 1: Project Basics ===== */}
                            <div className="section-divider-premium">
                                <h3>📋 Project Basics</h3>
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
                                    <RichTextEditor
                                        value={description}
                                        onChange={setDescription}
                                        placeholder="Describe the project goals, scope, and key deliverables..."
                                        height={250}
                                    />
                                </div>
                            </div>

                            {/* ===== SECTION 2: Status ===== */}
                            <div className="section-divider-premium">
                                <h3>📊 Status</h3>
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

                            {/* ===== SECTION 3: Classification ===== */}
                            <div className="section-divider-premium">
                                <h3>🏷️ Classification</h3>
                            </div>

                            <div className="space-y-6">
                                {/* Category */}
                                <div>
                                    <label className="form-label-premium">Category</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {CATEGORY_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setCategory(opt.value)}
                                                className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 text-sm font-medium ${category === opt.value
                                                    ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300 text-orange-700 shadow-md"
                                                    : "bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:shadow"
                                                    }`}
                                            >
                                                <span className="text-lg">{opt.icon}</span>
                                                <span className="truncate">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Priority & Risk Level */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="form-label-premium">Priority</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {PRIORITY_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setPriority(opt.value)}
                                                    className={`px-4 py-2.5 rounded-xl border-2 transition-all flex items-center gap-2 text-sm font-medium ${priority === opt.value
                                                        ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300 text-orange-700 shadow-md"
                                                        : "bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:shadow"
                                                        }`}
                                                >
                                                    <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`} />
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="form-label-premium">Risk Level</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {RISK_LEVEL_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setRiskLevel(opt.value)}
                                                    className={`px-4 py-2.5 rounded-xl border-2 transition-all flex items-center gap-2 text-sm font-medium ${riskLevel === opt.value
                                                        ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300 text-orange-700 shadow-md"
                                                        : "bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:shadow"
                                                        }`}
                                                >
                                                    <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`} />
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Visibility */}
                                <div>
                                    <label className="form-label-premium">Visibility</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {VISIBILITY_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setVisibility(opt.value)}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${visibility === opt.value
                                                    ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300 shadow-md"
                                                    : "bg-white border-gray-200 hover:border-orange-200 hover:shadow"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-lg">{opt.icon}</span>
                                                    <span className={`font-medium ${visibility === opt.value ? "text-orange-700" : "text-gray-700"}`}>
                                                        {opt.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500">{opt.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ===== SECTION 4: Timeline & Budget ===== */}
                            <div className="section-divider-premium">
                                <h3>📅 Timeline & Budget</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <div>
                                    <label className="form-label-premium">Budget</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                                        <input
                                            type="number"
                                            value={budget}
                                            onChange={(e) => setBudget(e.target.value)}
                                            min="0"
                                            step="100"
                                            className="input-stunning pl-7"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ===== SECTION 5: Repository & Client ===== */}
                            <div className="section-divider-premium">
                                <h3>🔗 Repository & Client</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label-premium">Repository URL</label>
                                    <input
                                        type="url"
                                        value={repository}
                                        onChange={(e) => setRepository(e.target.value)}
                                        className="input-stunning"
                                        placeholder="https://github.com/org/repo"
                                    />
                                </div>
                                <div>
                                    <label className="form-label-premium">Client / Stakeholder</label>
                                    <input
                                        type="text"
                                        value={client}
                                        onChange={(e) => setClient(e.target.value)}
                                        className="input-stunning"
                                        placeholder="e.g., Acme Corporation"
                                    />
                                </div>
                            </div>

                            {/* ===== SECTION 6: Tags ===== */}
                            <div className="section-divider-premium">
                                <h3>🏷️ Tags</h3>
                            </div>

                            <div>
                                <label className="form-label-premium">Project Tags</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        className="input-stunning flex-1"
                                        placeholder="Type a tag and press Enter"
                                    />
                                    <button
                                        type="button"
                                        onClick={addTag}
                                        className="px-4 py-2 rounded-xl bg-orange-100 text-orange-700 font-medium hover:bg-orange-200 transition"
                                    >
                                        Add
                                    </button>
                                </div>
                                {tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 text-sm font-medium"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    className="w-4 h-4 rounded-full hover:bg-orange-200 flex items-center justify-center"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ===== SECTION 7: Visual Identity ===== */}
                            <div className="section-divider-premium">
                                <h3>🎨 Visual Identity</h3>
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

                            {/* ===== SECTION 8: Team ===== */}
                            <div className="section-divider-premium">
                                <h3>👥 Team</h3>
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

                            {/* ===== SECTION 9: Internal Notes ===== */}
                            <div className="section-divider-premium">
                                <h3>📝 Internal Notes</h3>
                            </div>

                            <div>
                                <label className="form-label-premium">
                                    PM Notes (Private)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="textarea-stunning"
                                    placeholder="Internal notes, reminders, or context for this project..."
                                />
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
