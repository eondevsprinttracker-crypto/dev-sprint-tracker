"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
import PMTaskCard from "./PMTaskCard";
import TaskStatsChart from "./TaskStatsChart";
import { formatDuration } from "@/lib/utils";
import TeamMemberCard from "./TeamMemberCard";
import TaskDetailModal from "@/components/TaskDetailModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import ProjectCard from "./ProjectCard";

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

export default function PMDashboardClient() {
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
    const [viewTaskId, setViewTaskId] = useState<string | null>(null);

    // Project states
    const [projects, setProjects] = useState<Project[]>([]);

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
                case "r":
                    if (!refreshing) handleRefresh();
                    break;
                case "escape":
                    setViewTaskId(null);
                    break;
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [viewTaskId, refreshing]);

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
                        <span className="text-gray-900">PM </span>
                        <span className="gradient-text-fire">Dashboard</span>
                    </h1>
                    <p className="text-gray-500 flex items-center gap-2">
                        <span>Manage tasks and track team performance</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">N: new task • R: refresh</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl border border-gray-200 transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-orange-500/10"
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
                    <Link
                        href="/dashboard/pm/tasks/new"
                        className="btn-primary flex items-center gap-2 px-5 py-2.5"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="font-semibold">Create Task</span>
                    </Link>
                </div>
            </div>

            {/* Status Monitor Strip */}
            <div className="status-monitor mb-6 animate-slide-up">
                {/* Total */}
                <div className="status-monitor-segment min-w-[90px]">
                    <span className="status-monitor-label">Total</span>
                    <span className="status-monitor-value">{stats.total}</span>
                </div>

                {/* Pipeline */}
                <div className="status-monitor-pipeline">
                    <div className="status-monitor-pipeline-item">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase">Pending</span>
                        <span className="text-lg font-bold text-gray-600">{stats.todo}</span>
                    </div>
                    <span className="status-monitor-pipeline-arrow">→</span>
                    <div className="status-monitor-pipeline-item">
                        <span className="text-[10px] font-semibold text-orange-600/80 uppercase">Active</span>
                        <span className="text-lg font-bold text-orange-600">{stats.inProgress}</span>
                    </div>
                    <span className="status-monitor-pipeline-arrow">→</span>
                    <div className="status-monitor-pipeline-item">
                        <span className="text-[10px] font-semibold text-amber-600/80 uppercase">Review</span>
                        <span className="text-lg font-bold text-amber-600">{stats.pendingReview}</span>
                    </div>
                    <span className="status-monitor-pipeline-arrow">→</span>
                    <div className="status-monitor-pipeline-item">
                        <span className="text-[10px] font-semibold text-emerald-600/80 uppercase">Done</span>
                        <span className="text-lg font-bold text-emerald-600">{stats.completed}</span>
                    </div>
                </div>

                {/* Blocked Alert */}
                <div className={`status-monitor-segment min-w-[90px] ${stats.blocked > 0 ? 'bg-red-500/10' : ''}`}>
                    <span className="status-monitor-label text-red-400/70">Blocked</span>
                    <span className={`status-monitor-value ${stats.blocked > 0 ? 'text-red-400' : 'text-neutral-600'}`}>
                        {stats.blocked}
                    </span>
                </div>
            </div>

            {/* Main 2:1 Bento Grid Layout */}
            <div className="grid gap-5 lg:grid-cols-3">
                {/* Left Column - Main Content (66%) */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Stats Chart & Progress in one row */}
                    <TaskStatsChart stats={stats} />

                    {/* Active Projects Section */}
                    <div className="glass-card rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                Active Projects
                                <span className="text-xs text-gray-500">({projects.filter(p => p.status === 'Active').length})</span>
                            </h2>
                            <Link
                                href="/dashboard/pm/projects/new"
                                className="text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition"
                            >
                                + New Project
                            </Link>
                        </div>
                        {projects.filter(p => p.status === 'Active').length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 text-sm">No active projects</p>
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                                {projects.filter(p => p.status === 'Active').slice(0, 4).map((project) => (
                                    <ProjectCard
                                        key={project._id}
                                        project={project}
                                        onView={() => { }}
                                        onEdit={() => { }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Blocked Tasks Alert */}
                    {stats.blocked > 0 && (
                        <div className="bg-red-50 rounded-xl border border-red-200 p-5">
                            <h2 className="text-base font-semibold text-red-700 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Blocked Tasks ({stats.blocked})
                            </h2>
                            <div className="space-y-2">
                                {allTasks.filter((t) => t.isBlocked).slice(0, 3).map((task) => (
                                    <div
                                        key={task._id}
                                        className="bg-white rounded-lg border border-red-200 p-3 flex items-center justify-between shadow-sm"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 text-sm truncate">{task.title}</h3>
                                            <p className="text-xs text-red-600 truncate">
                                                {task.blockerNote || "No blocker note"}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleUnblock(task._id)}
                                            disabled={actionLoading === task._id}
                                            className="ml-3 px-2.5 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-md transition disabled:opacity-50"
                                        >
                                            {actionLoading === task._id ? "..." : "Unblock"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Action Center (33%) */}
                <div className="space-y-5">
                    {/* Priority 1: Pending Reviews */}
                    <div className="glass-card rounded-xl p-5 border-l-4 border-l-amber-500">
                        <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                            Pending Reviews
                            <span className="ml-auto text-lg font-bold text-amber-600">{pendingTasks.length}</span>
                        </h2>

                        {pendingTasks.length === 0 ? (
                            <div className="text-center py-6">
                                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-gray-500 text-sm">All caught up!</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {pendingTasks.slice(0, 4).map((task) => (
                                    <div
                                        key={task._id}
                                        className="bg-white rounded-lg border border-gray-200 p-3 hover:border-amber-300 transition shadow-sm"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-gray-900 text-sm truncate">{task.title}</h3>
                                                <p className="text-xs text-gray-500">
                                                    {task.assignedTo?.name || "Unknown"} • {task.points} pts
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(task._id)}
                                                disabled={actionLoading === task._id}
                                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-md transition disabled:opacity-50"
                                            >
                                                {actionLoading === task._id ? "..." : "✓ Approve"}
                                            </button>
                                            <button
                                                onClick={() => handleReject(task._id)}
                                                disabled={actionLoading === task._id}
                                                className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium rounded-md transition disabled:opacity-50"
                                            >
                                                {actionLoading === task._id ? "..." : "↩ Changes"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {pendingTasks.length > 4 && (
                                    <Link
                                        href="/dashboard/pm/tasks"
                                        className="w-full py-2 text-xs text-orange-400 hover:text-orange-300 transition text-center block"
                                    >
                                        View all {pendingTasks.length} pending →
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Priority 2: Weekly Leaderboard */}
                    <div className="glass-card rounded-xl p-5 bg-gradient-to-br from-orange-50 to-amber-50">
                        <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                            Leaderboard
                        </h2>
                        <p className="text-xs text-gray-500 mb-4">Week {weekNumber}</p>

                        {leaderboard.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-gray-500 text-sm">No completed tasks this week</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {leaderboard.slice(0, 5).map((entry, index) => (
                                    <div
                                        key={entry._id}
                                        className={`flex items-center gap-3 p-2.5 rounded-lg transition ${index === 0
                                            ? "bg-yellow-100 border border-yellow-300"
                                            : index === 1
                                                ? "bg-gray-100 border border-gray-300"
                                                : index === 2
                                                    ? "bg-orange-100 border border-orange-300"
                                                    : "bg-white border border-gray-200 shadow-sm"
                                            }`}
                                    >
                                        <span
                                            className={`text-lg font-bold w-6 ${index === 0
                                                ? "text-yellow-600"
                                                : index === 1
                                                    ? "text-gray-500"
                                                    : index === 2
                                                        ? "text-orange-600"
                                                        : "text-gray-400"
                                                }`}
                                        >
                                            #{index + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm truncate">{entry.name}</p>
                                            <p className="text-[10px] text-gray-500">{entry.completedTasks} tasks</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-bold text-orange-600">{entry.totalPoints}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}




            <ConfirmationModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={executeDeleteDeveloper}
                title="Delete Developer?"
                message="Are you sure you want to delete this developer? All their tasks and data will be permanently removed. This action cannot be undone."
                confirmText="Delete Developer"
                isDangerous={true}
            />

        </main>
    );
}
