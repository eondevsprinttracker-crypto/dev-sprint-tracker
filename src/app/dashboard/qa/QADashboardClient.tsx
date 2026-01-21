"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
    getTasksForQAReview,
    getMyQATasks,
    getQALeaderboard,
    approveQAReview,
    failQAReview,
    startQATimer,
    stopQATimer,
} from "@/app/actions/qaActions";

interface Task {
    _id: string;
    title: string;
    description: string;
    status: string;
    complexity: string;
    points: number;
    estimatedHours: number;
    proofUrl: string;
    assignedTo?: { _id: string; name: string; email: string };
    createdBy?: { _id: string; name: string };
    qaReviewStatus?: string;
    qaReviewNotes?: string;
    bugsFound: number;
    qaTimeSpent: number;
    isQATimerRunning?: boolean;
    qaTimerStartTime?: string;
}

interface LeaderboardEntry {
    _id: string;
    name: string;
    email: string;
    reviewedTasks: number;
    approved: number;
    totalPoints: number;
    bugsFound: number;
}

export default function QADashboardClient() {
    const searchParams = useSearchParams();
    const view = searchParams.get("view") || "queue";

    const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [weekNumber, setWeekNumber] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [reviewModal, setReviewModal] = useState<{ task: Task; action: "approve" | "fail" } | null>(null);
    const [reviewNotes, setReviewNotes] = useState("");
    const [bugsCount, setBugsCount] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, [view]);

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    async function loadData() {
        setLoading(true);
        const [pendingRes, allRes, leaderRes] = await Promise.all([
            getTasksForQAReview(),
            getMyQATasks(),
            getQALeaderboard(),
        ]);

        if (pendingRes.success) setPendingTasks(pendingRes.tasks || []);
        if (allRes.success) setAllTasks(allRes.tasks || []);
        if (leaderRes.success) {
            setLeaderboard(leaderRes.leaderboard || []);
            setWeekNumber(leaderRes.weekNumber || 0);
        }
        setLoading(false);
    }

    function showToast(message: string, type: "success" | "error") {
        setToast({ message, type });
    }

    async function handleStartTimer(taskId: string) {
        const result = await startQATimer(taskId);
        if (result.success) {
            showToast("Timer started", "success");
            loadData();
        } else {
            showToast(result.error || "Failed to start timer", "error");
        }
    }

    async function handleStopTimer(taskId: string) {
        const result = await stopQATimer(taskId);
        if (result.success) {
            showToast("Timer stopped", "success");
            loadData();
        } else {
            showToast(result.error || "Failed to stop timer", "error");
        }
    }

    async function handleApprove() {
        if (!reviewModal || reviewModal.action !== "approve") return;
        setSubmitting(true);
        const result = await approveQAReview(reviewModal.task._id, reviewNotes);
        if (result.success) {
            showToast("Task approved and sent for PM review", "success");
            setReviewModal(null);
            setReviewNotes("");
            loadData();
        } else {
            showToast(result.error || "Failed to approve", "error");
        }
        setSubmitting(false);
    }

    async function handleFail() {
        if (!reviewModal || reviewModal.action !== "fail") return;
        if (!reviewNotes.trim()) {
            showToast("Please provide feedback notes", "error");
            return;
        }
        setSubmitting(true);
        const result = await failQAReview(reviewModal.task._id, reviewNotes, bugsCount);
        if (result.success) {
            showToast("Task returned to developer with feedback", "success");
            setReviewModal(null);
            setReviewNotes("");
            setBugsCount(1);
            loadData();
        } else {
            showToast(result.error || "Failed to reject", "error");
        }
        setSubmitting(false);
    }

    function formatTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    // Compute stats
    const reviewedCount = allTasks.filter(t => t.qaReviewStatus === "Approved" || t.qaReviewStatus === "Failed").length;
    const approvedCount = allTasks.filter(t => t.qaReviewStatus === "Approved").length;
    const pendingCount = pendingTasks.length;
    const bugsFoundTotal = allTasks.reduce((sum, t) => sum + (t.bugsFound || 0), 0);

    if (loading) {
        return (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <div className="skeleton h-10 w-64 mb-2"></div>
                    <div className="skeleton h-5 w-96"></div>
                </div>
                <div className="grid gap-4 md:grid-cols-4 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton-card h-24 rounded-xl"></div>
                    ))}
                </div>
                <div className="grid gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="skeleton-card h-32 rounded-xl"></div>
                    ))}
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
            <div className="flex items-center justify-between mb-8 animate-slide-down">
                <div>
                    <h1 className="text-4xl font-black mb-2">
                        <span className="gradient-text-fire">QA Dashboard</span>
                    </h1>
                    <p className="text-gray-600">Review and validate developer submissions</p>
                </div>
                <button
                    onClick={loadData}
                    className="btn-secondary px-4 py-2 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-slide-up">
                <div className="glass-card rounded-xl p-5 border border-orange-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-xl p-5 border border-emerald-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Approved</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-xl p-5 border border-blue-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{reviewedCount}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Reviewed</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-xl p-5 border border-red-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{bugsFoundTotal}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Bugs Found</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Content */}
            {view === "queue" && (
                <div className="space-y-4 animate-slide-up">
                    <h2 className="text-lg font-bold text-gray-900">Review Queue</h2>
                    {pendingTasks.length === 0 ? (
                        <div className="text-center py-16 bg-orange-50 rounded-xl border border-orange-100">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white border border-orange-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-600 text-lg mb-2">No tasks pending review</p>
                            <p className="text-gray-500 text-sm">You&apos;re all caught up!</p>
                        </div>
                    ) : (
                        pendingTasks.map((task) => (
                            <div key={task._id} className="glass-card rounded-xl border border-orange-100 p-5 hover:border-orange-300 transition-all duration-300">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">{task.title}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${task.complexity === "Hard" ? "bg-red-100 text-red-700" :
                                        task.complexity === "Medium" ? "bg-orange-100 text-orange-700" :
                                            "bg-green-100 text-green-700"
                                        }`}>
                                        {task.complexity}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        {task.assignedTo?.name || "Unknown"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Est: {task.estimatedHours}h
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                        {task.points} pts
                                    </span>
                                </div>

                                {task.proofUrl && (
                                    <div className="mb-4">
                                        <a
                                            href={task.proofUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            View Proof/Demo
                                        </a>
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    {/* Timer Controls */}
                                    {task.isQATimerRunning ? (
                                        <button
                                            onClick={() => handleStopTimer(task._id)}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                            </svg>
                                            Stop Timer
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleStartTimer(task._id)}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Start Timer
                                        </button>
                                    )}
                                    {task.qaTimeSpent > 0 && (
                                        <span className="text-sm text-gray-500">
                                            Time: {formatTime(task.qaTimeSpent)}
                                        </span>
                                    )}

                                    <div className="flex-1"></div>

                                    {/* Action Buttons */}
                                    <button
                                        onClick={() => {
                                            setReviewModal({ task, action: "fail" });
                                            setReviewNotes("");
                                            setBugsCount(1);
                                        }}
                                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Fail
                                    </button>
                                    <button
                                        onClick={() => {
                                            setReviewModal({ task, action: "approve" });
                                            setReviewNotes("");
                                        }}
                                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Approve
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {view === "history" && (
                <div className="space-y-4 animate-slide-up">
                    <h2 className="text-lg font-bold text-gray-900">My Reviews</h2>
                    {allTasks.length === 0 ? (
                        <div className="text-center py-16 bg-orange-50 rounded-xl border border-orange-100">
                            <p className="text-gray-600">No reviews yet</p>
                        </div>
                    ) : (
                        allTasks.map((task) => (
                            <div key={task._id} className="glass-card rounded-xl border border-gray-200 p-5">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${task.qaReviewStatus === "Approved" ? "bg-emerald-100 text-emerald-700" :
                                            task.qaReviewStatus === "Failed" ? "bg-red-100 text-red-700" :
                                                "bg-orange-100 text-orange-700"
                                            }`}>
                                            {task.qaReviewStatus || "Pending"}
                                        </span>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700`}>
                                            {task.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span>Developer: {task.assignedTo?.name || "Unknown"}</span>
                                    <span>Points: {task.points}</span>
                                    {task.bugsFound > 0 && <span className="text-red-600">Bugs: {task.bugsFound}</span>}
                                    {task.qaTimeSpent > 0 && <span>Review Time: {formatTime(task.qaTimeSpent)}</span>}
                                </div>
                                {task.qaReviewNotes && (
                                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">{task.qaReviewNotes}</p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {view === "leaderboard" && (
                <div className="space-y-4 animate-slide-up">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">QA Leaderboard</h2>
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                            Week {weekNumber}
                        </span>
                    </div>
                    {leaderboard.length === 0 ? (
                        <div className="text-center py-16 bg-orange-50 rounded-xl border border-orange-100">
                            <p className="text-gray-600">No QA activity this week</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {leaderboard.map((entry, index) => (
                                <div key={entry._id} className="glass-card rounded-xl border border-orange-100 p-5 flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${index === 0 ? "bg-yellow-400 text-yellow-900" :
                                        index === 1 ? "bg-gray-300 text-gray-700" :
                                            index === 2 ? "bg-amber-600 text-amber-100" :
                                                "bg-gray-100 text-gray-700"
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">{entry.name}</h4>
                                        <p className="text-sm text-gray-500">{entry.email}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-6 text-center">
                                        <div>
                                            <p className="text-lg font-bold text-gray-900">{entry.reviewedTasks}</p>
                                            <p className="text-xs text-gray-500">Reviewed</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-emerald-600">{entry.approved}</p>
                                            <p className="text-xs text-gray-500">Approved</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-orange-600">{entry.totalPoints}</p>
                                            <p className="text-xs text-gray-500">Points</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Review Modal */}
            {reviewModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            {reviewModal.action === "approve" ? "Approve Task" : "Fail Task"}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Task: <strong>{reviewModal.task.title}</strong>
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {reviewModal.action === "approve" ? "Notes (optional)" : "Feedback Notes (required)"}
                            </label>
                            <textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder={reviewModal.action === "approve" ? "Add any notes for PM..." : "Describe the issues found..."}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                rows={4}
                            />
                        </div>

                        {reviewModal.action === "fail" && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bugs/Issues Found
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={bugsCount}
                                    onChange={(e) => setBugsCount(parseInt(e.target.value) || 1)}
                                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setReviewModal(null)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={reviewModal.action === "approve" ? handleApprove : handleFail}
                                disabled={submitting}
                                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${reviewModal.action === "approve"
                                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                    : "bg-red-500 text-white hover:bg-red-600"
                                    } disabled:opacity-50`}
                            >
                                {submitting && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                )}
                                {reviewModal.action === "approve" ? "Approve" : "Fail Task"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
