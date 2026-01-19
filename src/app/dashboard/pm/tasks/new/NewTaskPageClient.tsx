"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createTask } from "@/app/actions/taskActions";
import { getProjects } from "@/app/actions/projectActions";
import { getSprints } from "@/app/actions/sprintActions";
import { getDevelopers } from "@/app/actions/taskActions";
import { calculateBusinessHours } from "@/lib/business-logic";

interface Project {
    _id: string;
    name: string;
    key: string;
    color: string;
}

interface Sprint {
    _id: string;
    name: string;
    status: string;
    project: {
        _id: string;
        name: string;
    };
}

interface Developer {
    _id: string;
    name: string;
    email: string;
}

export default function NewTaskPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const presetProjectId = searchParams.get("projectId");
    const presetSprintId = searchParams.get("sprintId");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [projects, setProjects] = useState<Project[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [developers, setDevelopers] = useState<Developer[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedProject, setSelectedProject] = useState(presetProjectId || "");
    const [selectedSprint, setSelectedSprint] = useState(presetSprintId || "");
    const [assignedTo, setAssignedTo] = useState("");
    const [complexity, setComplexity] = useState<"Easy" | "Medium" | "Hard">("Medium");
    const [priority, setPriority] = useState<"Critical" | "High" | "Medium" | "Low">("Medium");
    const [storyPoints, setStoryPoints] = useState<number>(3);
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState("");
    const [estimatedHours, setEstimatedHours] = useState<number | "">(8);

    useEffect(() => {
        async function loadData() {
            try {
                const [projectsResult, developersResult, sprintsResult] = await Promise.all([
                    getProjects(),
                    getDevelopers(),
                    getSprints(),
                ]);

                if (projectsResult.success) {
                    setProjects(projectsResult.projects || []);
                }
                if (developersResult.success) {
                    setDevelopers(developersResult.developers || []);
                }
                if (sprintsResult.success) {
                    setSprints(sprintsResult.sprints?.filter((s: Sprint) => s.status !== "Completed" && s.status !== "Cancelled") || []);
                }
            } finally {
                setLoadingData(false);
            }
        }
        loadData();
    }, []);

    // Auto-calculate hours from dates
    useEffect(() => {
        if (startDate && endDate) {
            const hours = calculateBusinessHours(new Date(startDate), new Date(endDate));
            setEstimatedHours(hours);
        }
    }, [startDate, endDate]);

    // Filter sprints by selected project
    const filteredSprints = sprints.filter(
        (s) => !selectedProject || s.project?._id === selectedProject
    );

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        if (selectedProject) formData.append("projectId", selectedProject);
        if (selectedSprint) formData.append("sprintId", selectedSprint);
        formData.append("assignedTo", assignedTo);
        formData.append("complexity", complexity);
        formData.append("priority", priority);
        formData.append("storyPoints", String(storyPoints));
        formData.append("scheduledStartDate", startDate);
        formData.append("scheduledEndDate", endDate);
        formData.append("estimatedHours", String(estimatedHours || 8));

        const result = await createTask(formData);

        if (result.success) {
            // Navigate back to appropriate page
            if (selectedSprint) {
                router.push(`/dashboard/pm/sprints/${selectedSprint}`);
            } else if (selectedProject) {
                router.push(`/dashboard/pm?tab=projects`);
            } else {
                router.push("/dashboard/pm");
            }
        } else {
            setError(result.error || "Failed to create task");
            setLoading(false);
        }
    }

    if (loadingData) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link
                        href="/dashboard/pm"
                        className="text-neutral-400 hover:text-white transition flex items-center gap-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </Link>
                </div>

                {/* Form Card */}
                <div className="glass-card rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Create New Task</h1>
                            <p className="text-neutral-400">Assign work to your team members</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Task Title *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="input-premium w-full"
                                placeholder="What needs to be done?"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="input-premium w-full resize-none"
                                placeholder="Describe the task in detail..."
                            />
                        </div>

                        {/* Project & Sprint Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Project
                                </label>
                                <select
                                    value={selectedProject}
                                    onChange={(e) => {
                                        setSelectedProject(e.target.value);
                                        setSelectedSprint("");
                                    }}
                                    className="input-premium w-full"
                                >
                                    <option value="">No Project</option>
                                    {projects.map((project) => (
                                        <option key={project._id} value={project._id}>
                                            [{project.key}] {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Sprint
                                </label>
                                <select
                                    value={selectedSprint}
                                    onChange={(e) => setSelectedSprint(e.target.value)}
                                    className="input-premium w-full"
                                    disabled={!selectedProject && filteredSprints.length === 0}
                                >
                                    <option value="">Backlog (No Sprint)</option>
                                    {filteredSprints.map((sprint) => (
                                        <option key={sprint._id} value={sprint._id}>
                                            {sprint.name} ({sprint.status})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Assignee */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Assign To *
                            </label>
                            <select
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                required
                                className="input-premium w-full"
                            >
                                <option value="">Select a developer</option>
                                {developers.map((dev) => (
                                    <option key={dev._id} value={dev._id}>
                                        {dev.name} ({dev.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Complexity, Priority, Story Points */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Complexity *
                                </label>
                                <select
                                    value={complexity}
                                    onChange={(e) => setComplexity(e.target.value as "Easy" | "Medium" | "Hard")}
                                    className="input-premium w-full"
                                >
                                    <option value="Easy">Easy (1 pt)</option>
                                    <option value="Medium">Medium (3 pts)</option>
                                    <option value="Hard">Hard (5 pts)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Priority *
                                </label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as "Critical" | "High" | "Medium" | "Low")}
                                    className="input-premium w-full"
                                >
                                    <option value="Critical">🔴 Critical</option>
                                    <option value="High">🟠 High</option>
                                    <option value="Medium">🟡 Medium</option>
                                    <option value="Low">🟢 Low</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Story Points
                                </label>
                                <select
                                    value={storyPoints}
                                    onChange={(e) => setStoryPoints(parseInt(e.target.value))}
                                    className="input-premium w-full"
                                >
                                    {[1, 2, 3, 5, 8, 13, 21].map((pts) => (
                                        <option key={pts} value={pts}>
                                            {pts} points
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Start Date *
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                    className="input-premium w-full [color-scheme:dark]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    End Date *
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate}
                                    required
                                    className="input-premium w-full [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        {/* Estimated Hours */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Estimated Hours *
                            </label>
                            <input
                                type="number"
                                value={estimatedHours}
                                onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || "")}
                                step="0.5"
                                min="0.5"
                                required
                                className="input-premium w-full"
                                placeholder="Auto-calculated from dates"
                            />
                            <p className="text-xs text-neutral-500 mt-1">
                                Auto-calculated based on business hours between dates
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-4 pt-4 border-t border-neutral-800">
                            <Link href="/dashboard/pm" className="btn-ghost">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex items-center gap-2 disabled:opacity-50"
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
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create Task
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
