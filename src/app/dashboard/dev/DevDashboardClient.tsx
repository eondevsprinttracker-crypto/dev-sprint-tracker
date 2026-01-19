"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getMyTasks, getLeaderboard, toggleBlocker, changeTaskStatus } from "@/app/actions/taskActions";
import TaskCard from "@/components/TaskCard";
import UploadModal from "@/components/UploadModal";
import TaskDetailModal from "@/components/TaskDetailModal";
import BlockerModal from "@/components/BlockerModal";
import Leaderboard from "@/components/Leaderboard";

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
    startedAt?: string;
    createdBy?: { name: string };
    isTimerRunning?: boolean;
    timerStartTime?: string;
    totalSecondsSpent?: number;
}

interface LeaderboardEntry {
    _id: string;
    name: string;
    email: string;
    totalPoints: number;
    completedTasks: number;
}

export default function DevDashboardClient({ userRole = "Developer" }: { userRole?: string }) {
    const searchParams = useSearchParams();
    const [activeView, setActiveView] = useState<"tasks" | "leaderboard">("tasks");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [uploadTaskId, setUploadTaskId] = useState<string | null>(null);
    const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [weekNumber, setWeekNumber] = useState(0);
    const [leaderboardLoading, setLeaderboardLoading] = useState(true);

    const [blockerModal, setBlockerModal] = useState<{
        isOpen: boolean;
        taskId: string | null;
        isRemoving: boolean;
    }>({ isOpen: false, taskId: null, isRemoving: false });

    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        loadAllData();
    }, []);

    // Sync view with URL
    useEffect(() => {
        const view = searchParams.get("view");
        if (view === "leaderboard") {
            setActiveView("leaderboard");
        } else {
            setActiveView("tasks");
        }
    }, [searchParams]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    async function loadAllData() {
        await Promise.all([loadTasks(), loadLeaderboard()]);
    }

    async function loadTasks() {
        const result = await getMyTasks();
        if (result.success) {
            setTasks(result.tasks || []);
        }
        setLoading(false);
    }

    async function loadLeaderboard() {
        setLeaderboardLoading(true);
        const result = await getLeaderboard();
        if (result.success) {
            setLeaderboard(result.leaderboard || []);
            setWeekNumber(result.weekNumber || 0);
        }
        setLeaderboardLoading(false);
    }

    async function handleRefresh() {
        setRefreshing(true);
        await loadAllData();
        setRefreshing(false);
        showToast("Dashboard refreshed", "success");
    }

    function showToast(message: string, type: "success" | "error") {
        setToast({ message, type });
    }

    function handleUploadModalClose() {
        setUploadTaskId(null);
        loadTasks();
        showToast("Proof uploaded successfully", "success");
    }

    function handleDetailModalClose() {
        setDetailTaskId(null);
        loadTasks();
    }

    function handleBlockerClick(taskId: string, isBlocked: boolean) {
        setBlockerModal({ isOpen: true, taskId, isRemoving: isBlocked });
    }

    async function handleBlockerConfirm(blockerNote: string) {
        if (!blockerModal.taskId) return;

        const result = await toggleBlocker(blockerModal.taskId, blockerNote);

        if (result.success) {
            await loadTasks();
            showToast(
                blockerModal.isRemoving ? "Blocker removed" : "Task marked as blocked",
                "success"
            );
        } else {
            showToast(result.error || "Failed to update blocker", "error");
        }
    }

    const filteredTasks = tasks.filter((task) => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === "all") return true;
        if (filter === "active") return !["Completed"].includes(task.status);
        if (filter === "blocked") return task.isBlocked;
        return task.status === filter;
    });

    const stats = {
        total: tasks.length,
        completed: tasks.filter((t) => t.status === "Completed").length,
        inProgress: tasks.filter((t) => t.status === "In Progress").length,
        blocked: tasks.filter((t) => t.isBlocked).length,
        totalPoints: tasks
            .filter((t) => t.status === "Completed")
            .reduce((sum, t) => sum + t.points, 0),
        avgEfficiency: (() => {
            const completedWithHours = tasks.filter(t => t.status === "Completed" && t.actualHours > 0);
            if (completedWithHours.length === 0) return 100;
            const totalEff = completedWithHours.reduce((sum, t) => {
                const eff = (t.estimatedHours / t.actualHours) * 100;
                return sum + Math.min(eff, 999);
            }, 0);
            return Math.round(totalEff / completedWithHours.length);
        })(),
    };

    if (loading) {
        return (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="skeleton h-10 w-48 mb-2"></div>
                    <div className="skeleton h-5 w-72"></div>
                </div>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton-card h-24 rounded-2xl"></div>
                    ))}
                </div>

                {/* Content Skeleton */}
                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="skeleton h-12 w-full rounded-xl"></div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="skeleton-card h-56 rounded-2xl"></div>
                            ))}
                        </div>
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
                <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl animate-slide-up flex items-center gap-3 ${toast.type === "success"
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-emerald-500/25"
                    : "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-500/25"
                    }`}>
                    {toast.type === "success" ? (
                        <div className="p-1 bg-white/20 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    ) : (
                        <div className="p-1 bg-white/20 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-slide-down">
                <div>
                    <h1 className="text-4xl font-black mb-2">
                        <span className="text-white">My </span>
                        <span className="gradient-text-fire">Tasks</span>
                    </h1>
                    <p className="text-neutral-400">Track your assigned tasks and progress</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-neutral-500 group-focus-within:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-premium pl-10 pr-4 py-2.5 max-w-xs w-full text-sm"
                        />
                    </div>

                    {/* Refresh Button */}
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
                        <span className="text-sm font-medium">{refreshing ? "Refreshing..." : "Refresh"}</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                <div className="stat-card group">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-neutral-700/50 rounded-lg group-hover:bg-neutral-700 transition">
                            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Total</span>
                    </div>
                    <p className="text-3xl font-black text-white">{stats.total}</p>
                </div>

                <div className="stat-card group hover:border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/25">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-orange-500/20 rounded-lg">
                            <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-xs text-orange-300/70 font-medium uppercase tracking-wider">In Progress</span>
                    </div>
                    <p className="text-3xl font-black text-orange-400">{stats.inProgress}</p>
                </div>

                <div className="stat-card group hover:border-emerald-500/30">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-emerald-500/15 rounded-lg">
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Completed</span>
                    </div>
                    <p className="text-3xl font-black text-emerald-400">{stats.completed}</p>
                </div>

                <div className="stat-card group hover:border-red-500/30">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-red-500/15 rounded-lg">
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </div>
                        <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Blocked</span>
                    </div>
                    <p className="text-3xl font-black text-red-400">{stats.blocked}</p>
                </div>

                <div className="stat-card relative overflow-hidden group hover:border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/25">
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-orange-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-orange-500/20 rounded-lg">
                                <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </div>
                            <span className="text-xs text-orange-300/70 font-medium uppercase tracking-wider">Points</span>
                        </div>
                        <p className="text-3xl font-black gradient-text-fire">{stats.totalPoints}</p>
                    </div>
                </div>

                <div className="stat-card group">
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg ${stats.avgEfficiency >= 100 ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
                            <svg className={`w-4 h-4 ${stats.avgEfficiency >= 100 ? 'text-emerald-400' : 'text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Efficiency</span>
                    </div>
                    <p className={`text-3xl font-black ${stats.avgEfficiency >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {stats.avgEfficiency}%
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-3">
                    {activeView === "tasks" ? (
                        <>
                            {/* Main Content - Tasks */}
                            <div className="space-y-6">
                                {/* Filters */}
                                <div className="flex flex-wrap gap-1.5 bg-black/30 p-1.5 rounded-xl border border-white/5 backdrop-blur">
                                    {[
                                        { key: "all", label: "All", icon: "○" },
                                        { key: "active", label: "Active", icon: "◐" },
                                        { key: "Todo", label: "Todo", icon: "○" },
                                        { key: "In Progress", label: "In Progress", icon: "●" },
                                        { key: "Pending Review", label: "Review", icon: "◐" },
                                        { key: "Completed", label: "Done", icon: "✓" },
                                        { key: "blocked", label: "Blocked", icon: "!" },
                                    ].map((f) => (
                                        <button
                                            key={f.key}
                                            onClick={() => setFilter(f.key)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${filter === f.key
                                                ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/20"
                                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                                                }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Tasks Grid */}
                                {filteredTasks.length === 0 ? (
                                    <div className="text-center py-16 glass-card rounded-2xl">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-800/50 flex items-center justify-center">
                                            <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                        <p className="text-neutral-300 text-lg font-medium mb-2">No tasks found</p>
                                        <p className="text-neutral-500 text-sm">
                                            {filter !== "all" ? "Try changing the filter or check back later" : "Wait for new task assignments"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {filteredTasks.map((task, index) => (
                                            <div key={task._id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                                <TaskCard
                                                    task={task}
                                                    onUploadProof={setUploadTaskId}
                                                    onViewDetails={setDetailTaskId}
                                                    onToggleBlocker={handleBlockerClick}
                                                    onRefresh={loadTasks}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Leaderboard View */
                        <div className="animate-slide-up">
                            <Leaderboard
                                entries={leaderboard}
                                weekNumber={weekNumber}
                                loading={leaderboardLoading}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <UploadModal taskId={uploadTaskId} onClose={handleUploadModalClose} />
            <TaskDetailModal taskId={detailTaskId} onClose={handleDetailModalClose} userRole={userRole} />
            <BlockerModal
                isOpen={blockerModal.isOpen}
                isRemoving={blockerModal.isRemoving}
                onClose={() => setBlockerModal({ isOpen: false, taskId: null, isRemoving: false })}
                onConfirm={handleBlockerConfirm}
            />
        </main>
    );
}
