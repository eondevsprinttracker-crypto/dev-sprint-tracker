"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    getAllTasks,
    getPendingReviewTasks,
    getLeaderboard,
    getDevelopers,
    getTeamStats,
    updateStatus,
    unblockTask,
} from "@/app/actions/taskActions";
import { getProjects } from "@/app/actions/projectActions";
import { deleteDeveloper } from "@/app/actions/userActions";
import CreateTaskModal from "./CreateTaskModal";
import EditTaskModal from "./EditTaskModal";
import PMTaskCard from "./PMTaskCard";
import TaskStatsChart from "./TaskStatsChart";
import { formatDuration } from "@/lib/utils";
import TeamMemberCard from "./TeamMemberCard";
import AdvancedFilters from "./AdvancedFilters";
import TaskDetailModal from "@/components/TaskDetailModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import ProjectCard from "./ProjectCard";
import CreateProjectModal from "./CreateProjectModal";
import EditProjectModal from "./EditProjectModal";
import ProjectDetailView from "./ProjectDetailView";

interface Task {
    _id: string;
    title: string;
    description: string;
    status: string;
    complexity: string;
    points: number;
    estimatedHours: number;
    actualHours: number;
    proofUrl: string;
    isBlocked: boolean;
    blockerNote: string;
    assignedTo?: { _id: string; name: string; email: string };
    createdAt: string;
}

interface LeaderboardEntry {
    _id: string;
    name: string;
    email: string;
    totalPoints: number;
    completedTasks: number;
}

interface DeveloperStats {
    _id: string;
    name: string;
    email: string;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    totalPoints: number;
}

interface Project {
    _id: string;
    name: string;
    key: string;
    description: string;
    status: "Active" | "On Hold" | "Completed" | "Archived";
    color: string;
    startDate: string;
    targetEndDate?: string;
    developers: { _id: string; name: string; email: string }[];
    taskStats: {
        total: number;
        completed: number;
        inProgress: number;
        blocked: number;
        progress: number;
    };
}

type TabType = "overview" | "projects" | "tasks" | "team";

export default function PMDashboardClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [teamStats, setTeamStats] = useState<DeveloperStats[]>([]);
    const [weekNumber, setWeekNumber] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [developers, setDevelopers] = useState<{ _id: string; name: string }[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [deletingDevId, setDeletingDevId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editTask, setEditTask] = useState<Task | null>(null);
    const [viewTaskId, setViewTaskId] = useState<string | null>(null);

    // Project states
    const [projects, setProjects] = useState<Project[]>([]);
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
    const [editProject, setEditProject] = useState<Project | null>(null);
    const [viewProjectId, setViewProjectId] = useState<string | null>(null);

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>("overview");

    // Sync tab with URL
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && ["overview", "projects", "tasks", "team"].includes(tab)) {
            setActiveTab(tab as TabType);
        }
    }, [searchParams]);

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        router.push(`/dashboard/pm?tab=${tab}`, { scroll: false });
    };

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Filter state
    const [filters, setFilters] = useState({
        status: "all",
        developer: "all",
        complexity: "all",
        blocked: "all",
        search: "",
        sortBy: "newest",
    });

    useEffect(() => {
        loadData();
    }, []);

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Keyboard shortcuts
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key.toLowerCase()) {
                case "n":
                    if (!showCreateModal && !editTask && !viewTaskId) {
                        setShowCreateModal(true);
                    }
                    break;
                case "r":
                    if (!refreshing) handleRefresh();
                    break;
                case "escape":
                    setShowCreateModal(false);
                    setEditTask(null);
                    setViewTaskId(null);
                    break;
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showCreateModal, editTask, viewTaskId, refreshing]);

    async function loadData() {
        const [tasksRes, pendingRes, leaderboardRes, devsRes, teamRes, projectsRes] = await Promise.all([
            getAllTasks(),
            getPendingReviewTasks(),
            getLeaderboard(),
            getDevelopers(),
            getTeamStats(),
            getProjects(),
        ]);

        if (tasksRes.success) setAllTasks(tasksRes.tasks || []);
        if (pendingRes.success) setPendingTasks(pendingRes.tasks || []);
        if (leaderboardRes.success) {
            setLeaderboard(leaderboardRes.leaderboard || []);
            setWeekNumber(leaderboardRes.weekNumber || 0);
        }
        if (devsRes.success) setDevelopers(devsRes.developers || []);
        if (teamRes.success) setTeamStats(teamRes.stats || []);
        if (projectsRes.success) setProjects(projectsRes.projects || []);

        setLoading(false);
    }

    async function handleRefresh() {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
        showToast("Dashboard refreshed", "success");
    }

    function showToast(message: string, type: "success" | "error") {
        setToast({ message, type });
    }

    async function handleApprove(taskId: string) {
        setActionLoading(taskId);
        const result = await updateStatus(taskId, "Completed");
        if (result.success) {
            showToast("Task approved successfully", "success");
        } else {
            showToast(result.error || "Failed to approve task", "error");
        }
        await loadData();
        setActionLoading(null);
    }

    async function handleReject(taskId: string) {
        setActionLoading(taskId);
        const result = await updateStatus(taskId, "Changes Requested");
        if (result.success) {
            showToast("Changes requested", "success");
        } else {
            showToast(result.error || "Failed to reject task", "error");
        }
        await loadData();
        setActionLoading(null);
    }

    async function handleUnblock(taskId: string) {
        setActionLoading(taskId);
        const result = await unblockTask(taskId);
        if (result.success) {
            showToast("Task unblocked", "success");
        } else {
            showToast(result.error || "Failed to unblock task", "error");
        }
        await loadData();
        setActionLoading(null);
    }

    async function handleDeleteDeveloper(developerId: string) {
        setConfirmDeleteId(developerId);
    }

    async function executeDeleteDeveloper() {
        if (!confirmDeleteId) return;

        const developerId = confirmDeleteId;
        setConfirmDeleteId(null); // Close modal
        setDeletingDevId(developerId); // Show loading state

        const result = await deleteDeveloper(developerId);
        if (result.success) {
            showToast("Developer deleted successfully", "success");
        } else {
            showToast(result.error || "Failed to delete developer", "error");
        }
        await loadData();
        setDeletingDevId(null);
    }

    // Calculate overall stats
    const stats = {
        total: allTasks.length,
        todo: allTasks.filter((t) => t.status === "Todo").length,
        inProgress: allTasks.filter((t) => t.status === "In Progress").length,
        pendingReview: pendingTasks.length,
        changesRequested: allTasks.filter((t) => t.status === "Changes Requested").length,
        completed: allTasks.filter((t) => t.status === "Completed").length,
        blocked: allTasks.filter((t) => t.isBlocked).length,
        totalEstimatedHours: allTasks.reduce((sum, t) => sum + t.estimatedHours, 0),
        totalActualHours: allTasks.reduce((sum, t) => sum + t.actualHours, 0),
    };

    // Filter tasks
    const filteredTasks = allTasks.filter((task) => {
        if (filters.status !== "all" && task.status !== filters.status) return false;
        if (filters.developer !== "all" && task.assignedTo?._id !== filters.developer) return false;
        if (filters.complexity !== "all" && task.complexity !== filters.complexity) return false;
        if (filters.blocked === "blocked" && !task.isBlocked) return false;
        if (filters.blocked === "not-blocked" && task.isBlocked) return false;
        if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
    }).sort((a, b) => {
        switch (filters.sortBy) {
            case "oldest":
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case "priority":
                const priority = { Hard: 3, Medium: 2, Easy: 1 };
                return (priority[b.complexity as keyof typeof priority] || 0) - (priority[a.complexity as keyof typeof priority] || 0);
            case "hours":
                return b.estimatedHours - a.estimatedHours;
            default: // newest
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    if (loading) {
        return (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <div className="skeleton h-10 w-64 mb-2"></div>
                    <div className="skeleton h-5 w-96"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="skeleton-card h-20 rounded-xl"></div>
                    ))}
                </div>
                <div className="skeleton h-12 w-80 rounded-xl mb-6"></div>
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="skeleton-card h-48 rounded-2xl"></div>
                        <div className="skeleton-card h-64 rounded-2xl"></div>
                    </div>
                    <div className="skeleton-card h-96 rounded-2xl"></div>
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl animate-slide-up flex items-center gap-3 ${toast.type === "success"
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-emerald-500/25"
                        : "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-500/25"
                        }`}
                >
                    <div className={`p-1 rounded-lg ${toast.type === "success" ? "bg-white/20" : "bg-white/20"}`}>
                        {toast.type === "success" ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </div>
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-slide-down">
                <div>
                    <h1 className="text-4xl font-black mb-2">
                        <span className="text-white">PM </span>
                        <span className="gradient-text-fire">Dashboard</span>
                    </h1>
                    <p className="text-neutral-400 flex items-center gap-2">
                        <span>Manage tasks and track team performance</span>
                        <span className="text-neutral-600">•</span>
                        <span className="text-xs text-neutral-500 bg-neutral-800/50 px-2 py-0.5 rounded-md">N: new task • R: refresh</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800/80 hover:bg-neutral-700 text-white rounded-xl border border-neutral-700/50 transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-orange-500/10"
                    >
                        <svg
                            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="hidden sm:inline text-sm font-medium">{refreshing ? "Refreshing..." : "Refresh"}</span>
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary flex items-center gap-2 px-6 py-2.5"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="font-semibold">Create Task</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <div className="stat-card group">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 bg-neutral-700/50 rounded group-hover:bg-neutral-700 transition">
                            <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <span className="text-xs text-neutral-500 font-medium">Total</span>
                    </div>
                    <p className="text-2xl font-black text-white">{stats.total}</p>
                </div>
                <div className="stat-card hover:border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/25">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 bg-amber-500/20 rounded">
                            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <span className="text-xs text-amber-400/70 font-medium">Pending</span>
                    </div>
                    <p className="text-2xl font-black text-amber-400">{stats.pendingReview}</p>
                </div>
                <div className="stat-card hover:border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/25">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 bg-orange-500/20 rounded">
                            <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-xs text-orange-300/70 font-medium">In Progress</span>
                    </div>
                    <p className="text-2xl font-black text-orange-400">{stats.inProgress}</p>
                </div>
                <div className="stat-card hover:border-red-500/40 bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/25">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 bg-red-500/20 rounded">
                            <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </div>
                        <span className="text-xs text-red-400/70 font-medium">Blocked</span>
                    </div>
                    <p className="text-2xl font-black text-red-400">{stats.blocked}</p>
                </div>
                <div className="stat-card hover:border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/25">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 bg-emerald-500/20 rounded">
                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-xs text-emerald-400/70 font-medium">Completed</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-400">{stats.completed}</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1.5 p-1.5 bg-black/30 backdrop-blur rounded-xl border border-white/5 mb-6 w-fit">
                {(["overview", "projects", "tasks", "team"] as TabType[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${activeTab === tab
                            ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/20"
                            : "text-neutral-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        {tab === "overview" && (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Overview
                            </>
                        )}
                        {tab === "projects" && (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                Projects
                                {projects.length > 0 && (
                                    <span className="px-1.5 py-0.5 text-xs bg-white/10 rounded-md">
                                        {projects.length}
                                    </span>
                                )}
                            </>
                        )}
                        {tab === "tasks" && (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                All Tasks
                            </>
                        )}
                        {tab === "team" && (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Team
                            </>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column - Stats & Pending Reviews */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stats Chart */}
                        <TaskStatsChart stats={stats} />

                        {/* Pending Reviews */}
                        <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse"></span>
                                Pending Reviews ({pendingTasks.length})
                            </h2>

                            {pendingTasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-400">All caught up! No tasks pending review.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingTasks.slice(0, 5).map((task) => (
                                        <div
                                            key={task._id}
                                            className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-4 hover:border-yellow-500/30 transition"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-white truncate">{task.title}</h3>
                                                    <p className="text-sm text-slate-400">
                                                        {task.assignedTo?.name || "Unknown"} • {task.complexity} ({task.points} pts)
                                                    </p>
                                                </div>
                                                {task.proofUrl && (
                                                    <a
                                                        href={task.proofUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-orange-400 hover:text-orange-300 text-sm"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                        </svg>
                                                        Proof
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                                                <span>Est: {formatDuration(task.estimatedHours)}</span>
                                                <span className={task.actualHours > task.estimatedHours ? "text-red-400" : ""}>
                                                    Actual: {formatDuration(task.actualHours)}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApprove(task._id)}
                                                    disabled={actionLoading === task._id}
                                                    className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                                                >
                                                    {actionLoading === task._id ? "..." : (
                                                        <span className="flex items-center justify-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Approve
                                                        </span>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleReject(task._id)}
                                                    disabled={actionLoading === task._id}
                                                    className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                                                >
                                                    {actionLoading === task._id ? "..." : (
                                                        <span className="flex items-center justify-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                            </svg>
                                                            Changes
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {pendingTasks.length > 5 && (
                                        <button
                                            onClick={() => {
                                                setFilters({ ...filters, status: "Pending Review" });
                                                setActiveTab("tasks");
                                            }}
                                            className="w-full py-2 text-sm text-orange-400 hover:text-orange-300 transition"
                                        >
                                            View all {pendingTasks.length} pending tasks →
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Blocked Tasks Alert */}
                        {stats.blocked > 0 && (
                            <div className="bg-red-500/10 rounded-xl border border-red-500/30 p-6">
                                <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Blocked Tasks ({stats.blocked})
                                </h2>
                                <div className="space-y-3">
                                    {allTasks.filter((t) => t.isBlocked).slice(0, 3).map((task) => (
                                        <div
                                            key={task._id}
                                            className="bg-red-500/5 rounded-lg border border-red-500/20 p-3 flex items-center justify-between"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-white truncate">{task.title}</h3>
                                                <p className="text-sm text-red-400 truncate">
                                                    {task.blockerNote || "No blocker note provided"}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleUnblock(task._id)}
                                                disabled={actionLoading === task._id}
                                                className="ml-3 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition disabled:opacity-50"
                                            >
                                                {actionLoading === task._id ? "..." : "Unblock"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Leaderboard */}
                    <div>
                        <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur rounded-xl border border-orange-500/30 p-6 sticky top-6">
                            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                </svg>
                                Weekly Leaderboard
                            </h2>
                            <p className="text-sm text-slate-400 mb-6">Week {weekNumber}</p>

                            {leaderboard.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-slate-400">No completed tasks this week</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {leaderboard.map((entry, index) => (
                                        <div
                                            key={entry._id}
                                            className={`flex items-center gap-4 p-3 rounded-lg transition ${index === 0
                                                ? "bg-yellow-500/10 border border-yellow-500/30"
                                                : index === 1
                                                    ? "bg-slate-400/10 border border-slate-400/30"
                                                    : index === 2
                                                        ? "bg-orange-500/10 border border-orange-500/30"
                                                        : "bg-slate-800/50 border border-slate-700/50"
                                                }`}
                                        >
                                            <span
                                                className={`text-2xl font-bold ${index === 0
                                                    ? "text-yellow-400"
                                                    : index === 1
                                                        ? "text-slate-300"
                                                        : index === 2
                                                            ? "text-orange-400"
                                                            : "text-slate-500"
                                                    }`}
                                            >
                                                #{index + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-white truncate">{entry.name}</p>
                                                <p className="text-xs text-slate-400">{entry.completedTasks} tasks</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-orange-400">{entry.totalPoints}</p>
                                                <p className="text-xs text-slate-400">points</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Projects Tab */}
            {activeTab === "projects" && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Projects</h2>
                            <p className="text-sm text-slate-400">
                                {projects.length} project{projects.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateProjectModal(true)}
                            className="btn-primary flex items-center gap-2 px-4 py-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Project
                        </button>
                    </div>

                    {projects.length === 0 ? (
                        <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700/50">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <p className="text-slate-400 text-lg mb-2">No projects yet</p>
                            <p className="text-slate-500 text-sm mb-4">Create your first project to organize tasks</p>
                            <button
                                onClick={() => setShowCreateProjectModal(true)}
                                className="btn-primary px-6 py-2"
                            >
                                Create Project
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {projects.map((project) => (
                                <ProjectCard
                                    key={project._id}
                                    project={project}
                                    onView={setViewProjectId}
                                    onEdit={setEditProject}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "tasks" && (
                <div>
                    <AdvancedFilters
                        developers={developers}
                        filters={filters}
                        onFiltersChange={setFilters}
                    />

                    {filteredTasks.length === 0 ? (
                        <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700/50">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <p className="text-slate-400 text-lg mb-2">No tasks found</p>
                            <p className="text-slate-500 text-sm">Try adjusting your filters or create a new task</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-slate-400 mb-4">
                                Showing {filteredTasks.length} of {allTasks.length} tasks
                            </p>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredTasks.map((task) => (
                                    <PMTaskCard
                                        key={task._id}
                                        task={task}
                                        onView={setViewTaskId}
                                        onEdit={setEditTask}
                                        onApprove={task.status === "Pending Review" ? handleApprove : undefined}
                                        onReject={task.status === "Pending Review" ? handleReject : undefined}
                                        actionLoading={actionLoading}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === "team" && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Team Overview</h2>
                            <p className="text-sm text-slate-400">{teamStats.length} developers</p>
                        </div>
                    </div>

                    {teamStats.length === 0 ? (
                        <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700/50">
                            <p className="text-slate-400">No team members with assigned tasks</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {teamStats.map((dev) => (
                                <TeamMemberCard
                                    key={dev._id}
                                    developer={dev}
                                    onAssignTask={() => {
                                        setShowCreateModal(true);
                                    }}
                                    onDeleteDeveloper={handleDeleteDeveloper}
                                    isDeleting={deletingDevId === dev._id}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {showCreateModal && (
                <CreateTaskModal
                    developers={developers}
                    onClose={() => {
                        setShowCreateModal(false);
                        loadData();
                    }}
                />
            )}

            {editTask && (
                <EditTaskModal
                    task={editTask}
                    developers={developers}
                    onClose={() => {
                        setEditTask(null);
                        loadData();
                    }}
                    onSuccess={(msg) => showToast(msg, "success")}
                    onError={(msg) => showToast(msg, "error")}
                />
            )}

            <TaskDetailModal
                taskId={viewTaskId}
                onClose={() => {
                    setViewTaskId(null);
                    loadData();
                }}
            />

            <ConfirmationModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={executeDeleteDeveloper}
                title="Delete Developer?"
                message="Are you sure you want to delete this developer? All their tasks and data will be permanently removed. This action cannot be undone."
                confirmText="Delete Developer"
                isDangerous={true}
            />

            {/* Project Modals */}
            {showCreateProjectModal && (
                <CreateProjectModal
                    developers={developers}
                    onClose={() => {
                        setShowCreateProjectModal(false);
                        loadData();
                    }}
                    onSuccess={(msg) => showToast(msg, "success")}
                    onError={(msg) => showToast(msg, "error")}
                />
            )}

            {editProject && (
                <EditProjectModal
                    project={editProject}
                    allDevelopers={developers}
                    onClose={() => {
                        setEditProject(null);
                        loadData();
                    }}
                    onSuccess={(msg) => showToast(msg, "success")}
                    onError={(msg) => showToast(msg, "error")}
                />
            )}

            {viewProjectId && (
                <ProjectDetailView
                    projectId={viewProjectId}
                    developers={developers}
                    onClose={() => {
                        setViewProjectId(null);
                        loadData();
                    }}
                    onRefresh={loadData}
                    showToast={showToast}
                />
            )}

        </main>
    );
}
