"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSprint } from "@/app/actions/sprintActions";
import { getProjects } from "@/app/actions/projectActions";

interface Project {
    _id: string;
    name: string;
    key: string;
    color: string;
}

export default function NewSprintPageClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [selectedProject, setSelectedProject] = useState("");

    // Form state
    const [name, setName] = useState("");
    const [goal, setGoal] = useState("");
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState("");
    const [capacity, setCapacity] = useState<number | "">(21);

    useEffect(() => {
        async function loadProjects() {
            const result = await getProjects();
            if (result.success) {
                setProjects(result.projects || []);
                if (result.projects?.length > 0) {
                    setSelectedProject(result.projects[0]._id);
                }
            }
            setLoadingProjects(false);
        }
        loadProjects();
    }, []);

    // Auto-set end date to 2 weeks from start
    useEffect(() => {
        if (startDate) {
            const start = new Date(startDate);
            start.setDate(start.getDate() + 14);
            setEndDate(start.toISOString().split("T")[0]);
        }
    }, [startDate]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!selectedProject) {
            setError("Please select a project");
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("projectId", selectedProject);
        formData.append("name", name);
        formData.append("goal", goal);
        formData.append("startDate", startDate);
        formData.append("endDate", endDate);
        formData.append("capacity", String(capacity || 0));

        const result = await createSprint(formData);

        if (result.success) {
            router.push(`/dashboard/pm/sprints/${result.sprint._id}`);
        } else {
            setError(result.error || "Failed to create sprint");
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6">
            {/* Header */}
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Link
                        href="/dashboard/pm/sprints"
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Create New Sprint</h1>
                            <p className="text-neutral-400">Set up a new sprint iteration for your project</p>
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

                    {loadingProjects ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800/50 flex items-center justify-center">
                                <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-neutral-300 mb-2">No projects found</h3>
                            <p className="text-neutral-500 mb-4">You need to create a project first</p>
                            <Link href="/dashboard/pm/projects/new" className="btn-primary inline-block">
                                Create Project
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Project Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Project *
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {projects.map((project) => (
                                        <button
                                            key={project._id}
                                            type="button"
                                            onClick={() => setSelectedProject(project._id)}
                                            className={`p-4 rounded-xl border text-left transition-all ${selectedProject === project._id
                                                    ? "border-orange-500 bg-orange-500/10"
                                                    : "border-neutral-700/50 bg-black/20 hover:border-neutral-600"
                                                }`}
                                        >
                                            <div
                                                className="w-3 h-3 rounded-full mb-2"
                                                style={{ backgroundColor: project.color }}
                                            />
                                            <div className="text-xs text-neutral-400 mb-1">{project.key}</div>
                                            <div className="text-sm font-medium text-white truncate">{project.name}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sprint Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Sprint Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="input-premium w-full"
                                    placeholder="e.g., Sprint 1 - Authentication"
                                />
                            </div>

                            {/* Sprint Goal */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Sprint Goal
                                </label>
                                <textarea
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    rows={3}
                                    className="input-premium w-full resize-none"
                                    placeholder="What do you want to achieve in this sprint?"
                                />
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

                            {/* Duration info */}
                            {startDate && endDate && (
                                <div className="text-sm text-neutral-400 bg-neutral-800/30 px-4 py-3 rounded-xl flex items-center gap-2">
                                    <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Sprint duration:{" "}
                                    {Math.ceil(
                                        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                                        (1000 * 60 * 60 * 24)
                                    )}{" "}
                                    days
                                </div>
                            )}

                            {/* Capacity */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Planned Capacity (Story Points)
                                </label>
                                <input
                                    type="number"
                                    value={capacity}
                                    onChange={(e) => setCapacity(parseInt(e.target.value) || "")}
                                    min={0}
                                    className="input-premium w-full"
                                    placeholder="How many story points to commit?"
                                />
                                <p className="text-xs text-neutral-500 mt-1">
                                    Typical team velocity is 15-30 points per sprint
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-4 pt-4 border-t border-neutral-800">
                                <Link
                                    href="/dashboard/pm/sprints"
                                    className="btn-ghost"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={loading || !selectedProject}
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
                                            Create Sprint
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
