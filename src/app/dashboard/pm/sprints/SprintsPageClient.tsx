"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSprints, deleteSprint, startSprint, completeSprint } from "@/app/actions/sprintActions";
import { getProjects } from "@/app/actions/projectActions";

interface Sprint {
    _id: string;
    name: string;
    goal: string;
    status: "Planning" | "Active" | "Completed" | "Cancelled";
    startDate: string;
    endDate: string;
    capacity: number;
    velocity: number;
    order: number;
    project: {
        _id: string;
        name: string;
        key: string;
        color: string;
    };
    taskStats: {
        total: number;
        completed: number;
        inProgress: number;
        todo: number;
        blocked: number;
        totalPoints: number;
        completedPoints: number;
    };
}

interface Project {
    _id: string;
    name: string;
    key: string;
    color: string;
}

export default function SprintsPageClient() {
    const router = useRouter();
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [sprintsResult, projectsResult] = await Promise.all([
                getSprints(selectedProject === "all" ? undefined : selectedProject),
                getProjects(),
            ]);

            if (sprintsResult.success) {
                setSprints(sprintsResult.sprints || []);
            }
            if (projectsResult.success) {
                setProjects(projectsResult.projects || []);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedProject]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
    };

    const handleStartSprint = async (sprintId: string) => {
        const result = await startSprint(sprintId);
        if (result.success) {
            showToast("Sprint started successfully!", "success");
            loadData();
        } else {
            showToast(result.error || "Failed to start sprint", "error");
        }
    };

    const handleCompleteSprint = async (sprintId: string) => {
        const result = await completeSprint(sprintId);
        if (result.success) {
            showToast(`Sprint completed! Velocity: ${result.velocity} points`, "success");
            loadData();
        } else {
            showToast(result.error || "Failed to complete sprint", "error");
        }
    };

    const handleDeleteSprint = async (sprintId: string) => {
        if (!confirm("Are you sure you want to delete this sprint? Tasks will be moved to backlog.")) {
            return;
        }
        const result = await deleteSprint(sprintId);
        if (result.success) {
            showToast("Sprint deleted successfully", "success");
            loadData();
        } else {
            showToast(result.error || "Failed to delete sprint", "error");
        }
    };

    const filteredSprints = sprints.filter((sprint) => {
        if (statusFilter !== "all" && sprint.status !== statusFilter) return false;
        return true;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Planning":
                return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            case "Active":
                return "bg-green-500/20 text-green-400 border-green-500/30";
            case "Completed":
                return "bg-purple-500/20 text-purple-400 border-purple-500/30";
            case "Cancelled":
                return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
            default:
                return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const getDaysRemaining = (endDate: string) => {
        const end = new Date(endDate);
        const now = new Date();
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link
                            href="/dashboard/pm"
                            className="text-neutral-400 hover:text-white transition flex items-center gap-1"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Dashboard
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold gradient-text-orange">Sprint Management</h1>
                    <p className="text-neutral-400 mt-1">Plan and track your project sprints</p>
                </div>

                <Link
                    href="/dashboard/pm/sprints/new"
                    className="btn-primary flex items-center gap-2 w-fit"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Sprint
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <label className="text-sm text-neutral-400">Project:</label>
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="px-4 py-2 bg-black/30 border border-neutral-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                        <option value="all">All Projects</option>
                        {projects.map((project) => (
                            <option key={project._id} value={project._id}>
                                [{project.key}] {project.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm text-neutral-400">Status:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-black/30 border border-neutral-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                        <option value="all">All</option>
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>

                <button
                    onClick={loadData}
                    className="ml-auto px-4 py-2 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-xl transition flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Sprint Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="glass-card p-4 rounded-xl">
                    <div className="text-2xl font-bold text-white">{sprints.length}</div>
                    <div className="text-sm text-neutral-400">Total Sprints</div>
                </div>
                <div className="glass-card p-4 rounded-xl">
                    <div className="text-2xl font-bold text-green-400">
                        {sprints.filter((s) => s.status === "Active").length}
                    </div>
                    <div className="text-sm text-neutral-400">Active</div>
                </div>
                <div className="glass-card p-4 rounded-xl">
                    <div className="text-2xl font-bold text-blue-400">
                        {sprints.filter((s) => s.status === "Planning").length}
                    </div>
                    <div className="text-sm text-neutral-400">Planning</div>
                </div>
                <div className="glass-card p-4 rounded-xl">
                    <div className="text-2xl font-bold text-purple-400">
                        {sprints.filter((s) => s.status === "Completed").length}
                    </div>
                    <div className="text-sm text-neutral-400">Completed</div>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
                            <div className="h-6 w-1/2 skeleton rounded mb-4" />
                            <div className="h-4 w-3/4 skeleton rounded mb-2" />
                            <div className="h-4 w-1/2 skeleton rounded" />
                        </div>
                    ))}
                </div>
            ) : filteredSprints.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neutral-800/50 flex items-center justify-center">
                        <svg className="w-10 h-10 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-medium text-neutral-300 mb-2">No sprints found</h3>
                    <p className="text-neutral-500 mb-6">Create your first sprint to get started</p>
                    <Link href="/dashboard/pm/sprints/new" className="btn-primary inline-flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Sprint
                    </Link>
                </div>
            ) : (
                /* Sprint Cards Grid */
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSprints.map((sprint) => (
                        <div
                            key={sprint._id}
                            className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden group"
                        >
                            {/* Project badge */}
                            <div
                                className="absolute top-0 left-0 w-full h-1"
                                style={{ backgroundColor: sprint.project?.color || "#f97316" }}
                            />

                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span
                                            className="text-xs font-medium px-2 py-0.5 rounded"
                                            style={{
                                                backgroundColor: `${sprint.project?.color}20`,
                                                color: sprint.project?.color,
                                            }}
                                        >
                                            {sprint.project?.key}
                                        </span>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded border ${getStatusColor(sprint.status)}`}>
                                            {sprint.status}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">{sprint.name}</h3>
                                </div>

                                {/* Actions dropdown */}
                                <div className="relative group/menu">
                                    <button className="p-2 hover:bg-neutral-700/50 rounded-lg transition opacity-0 group-hover:opacity-100">
                                        <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>
                                    <div className="absolute right-0 top-full mt-1 w-48 py-2 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                                        <Link
                                            href={`/dashboard/pm/sprints/${sprint._id}`}
                                            className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"
                                        >
                                            View Board
                                        </Link>
                                        <Link
                                            href={`/dashboard/pm/sprints/${sprint._id}/edit`}
                                            className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"
                                        >
                                            Edit Sprint
                                        </Link>
                                        {sprint.status === "Planning" && (
                                            <button
                                                onClick={() => handleStartSprint(sprint._id)}
                                                className="block w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-neutral-800"
                                            >
                                                Start Sprint
                                            </button>
                                        )}
                                        {sprint.status === "Active" && (
                                            <button
                                                onClick={() => handleCompleteSprint(sprint._id)}
                                                className="block w-full text-left px-4 py-2 text-sm text-purple-400 hover:bg-neutral-800"
                                            >
                                                Complete Sprint
                                            </button>
                                        )}
                                        <hr className="my-2 border-neutral-700" />
                                        <button
                                            onClick={() => handleDeleteSprint(sprint._id)}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-neutral-800"
                                        >
                                            Delete Sprint
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Goal */}
                            {sprint.goal && (
                                <p className="text-sm text-neutral-400 mb-4 line-clamp-2">{sprint.goal}</p>
                            )}

                            {/* Dates */}
                            <div className="flex items-center gap-4 mb-4 text-sm text-neutral-400">
                                <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                                </div>
                                {sprint.status === "Active" && (
                                    <span className="text-orange-400">
                                        {getDaysRemaining(sprint.endDate)} days left
                                    </span>
                                )}
                            </div>

                            {/* Progress bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-neutral-400">Progress</span>
                                    <span className="text-white">
                                        {sprint.taskStats.completedPoints}/{sprint.taskStats.totalPoints} pts
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-bar-fill"
                                        style={{
                                            width: `${sprint.taskStats.totalPoints > 0
                                                ? (sprint.taskStats.completedPoints / sprint.taskStats.totalPoints) * 100
                                                : 0
                                                }%`,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Task stats */}
                            <div className="flex items-center gap-3 text-xs">
                                <span className="text-neutral-400">
                                    {sprint.taskStats.total} tasks
                                </span>
                                <span className="text-green-400">
                                    {sprint.taskStats.completed} done
                                </span>
                                <span className="text-blue-400">
                                    {sprint.taskStats.inProgress} in progress
                                </span>
                                {sprint.taskStats.blocked > 0 && (
                                    <span className="text-red-400">
                                        {sprint.taskStats.blocked} blocked
                                    </span>
                                )}
                            </div>

                            {/* Click to open */}
                            <Link
                                href={`/dashboard/pm/sprints/${sprint._id}`}
                                className="absolute inset-0"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
