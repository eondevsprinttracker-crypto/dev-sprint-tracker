"use client";

import { useState, useEffect } from "react";
import { getTaskById, postComment } from "@/app/actions/taskActions";
import TaskTimer from "@/components/TaskTimer";
import { formatDuration } from "@/lib/utils";

interface Comment {
    _id: string;
    user: { _id: string; name: string; email: string };
    text: string;
    timestamp: string;
}

interface TaskDetail {
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
    weekNumber: number;
    createdBy: { _id: string; name: string; email: string; role: string };
    assignedTo: { _id: string; name: string; email: string };
    comments: Comment[];
    createdAt: string;
    updatedAt: string;
    isTimerRunning?: boolean;
    timerStartTime?: string;
    totalSecondsSpent?: number;
}

interface TaskDetailModalProps {
    taskId: string | null;
    onClose: () => void;
    userRole?: string;
}

export default function TaskDetailModal({ taskId, onClose, userRole }: TaskDetailModalProps) {
    const [task, setTask] = useState<TaskDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (taskId) {
            loadTask();
        }
    }, [taskId]);

    async function loadTask() {
        if (!taskId) return;
        setLoading(true);
        const result = await getTaskById(taskId);
        if (result.success && result.task) {
            setTask(result.task);
        }
        setLoading(false);
    }

    async function handleSubmitComment(e: React.FormEvent) {
        e.preventDefault();
        if (!commentText.trim() || !taskId) return;

        setSubmitting(true);
        setError("");

        const result = await postComment(taskId, commentText.trim());

        if (result.success) {
            setCommentText("");
            await loadTask();
        } else {
            setError(result.error || "Failed to post comment");
        }
        setSubmitting(false);
    }

    if (!taskId) return null;

    const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
        Todo: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
        "In Progress": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
        "Pending Review": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
        Completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
        "Changes Requested": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    };

    const complexityConfig: Record<string, string> = {
        Easy: "text-emerald-600",
        Medium: "text-amber-600",
        Hard: "text-red-600",
    };

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="glass-modal rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-scale-in-bounce">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-orange-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/15 rounded-xl">
                            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Task Details</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-orange-50 rounded-xl transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin"></div>
                                <div className="absolute inset-0 w-12 h-12 rounded-full animate-pulse-orange bg-orange-500/10"></div>
                            </div>
                            <p className="text-gray-500 mt-4 text-sm">Loading task details...</p>
                        </div>
                    ) : task ? (
                        <div className="space-y-6">
                            {/* Task Info */}
                            <div>
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${statusConfig[task.status]?.bg} ${statusConfig[task.status]?.text} ${statusConfig[task.status]?.border} border`}>
                                                {task.status}
                                            </span>
                                            {task.isBlocked && (
                                                <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                                    BLOCKED
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">{task.title}</h3>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-sm font-bold ${complexityConfig[task.complexity]}`}>
                                            {task.complexity}
                                        </span>
                                        <p className="text-xs text-gray-500 mt-1">{task.points} pts</p>
                                    </div>
                                </div>

                                {task.description && (
                                    <p className="text-gray-600 text-sm mb-5 leading-relaxed">{task.description}</p>
                                )}

                                {/* Blocker Note */}
                                {task.isBlocked && task.blockerNote && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-xl mb-5">
                                        <div className="flex items-start gap-3">
                                            <div className="p-1.5 bg-red-500/20 rounded-lg mt-0.5">
                                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-red-400 mb-1">Blocker Note</p>
                                                <p className="text-sm text-red-600">{task.blockerNote}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Timer Section */}
                                {(task.status === "In Progress" || task.status === "Todo" || task.status === "Changes Requested") && (
                                    <div className="mb-5 p-4 bg-gradient-to-r from-orange-500/10 to-orange-600/5 rounded-xl border border-orange-500/20">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700">Time Tracking</span>
                                            </div>
                                            <TaskTimer
                                                taskId={task._id}
                                                initialIsRunning={task.isTimerRunning || false}
                                                initialStartTime={task.timerStartTime || null}
                                                initialTotalSeconds={task.totalSecondsSpent || 0}
                                                onUpdate={loadTask}
                                                showControls={task.status !== "Todo"}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Hours & Week Grid */}
                                <div className="grid grid-cols-4 gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Estimated</p>
                                        <p className="text-sm font-bold text-gray-900">{formatDuration(task.estimatedHours)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Actual</p>
                                        <p className={`text-sm font-bold ${task.actualHours > task.estimatedHours ? "text-red-600" : "text-gray-900"}`}>
                                            {formatDuration(task.actualHours)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Week</p>
                                        <p className="text-sm font-bold text-orange-600">#{task.weekNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Created by</p>
                                        <p className="text-sm font-medium text-gray-900 truncate">{task.createdBy?.name || "Unknown"}</p>
                                    </div>
                                </div>

                                {/* Proof URL */}
                                {task.proofUrl && (
                                    <div className="mt-4">
                                        <a
                                            href={task.proofUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-medium transition-colors group"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                            View Proof
                                            <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Comments Section */}
                            <div className="border-t border-orange-100 pt-6">
                                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    Comments
                                    <span className="px-2 py-0.5 text-xs bg-orange-50 text-gray-600 border border-orange-100 rounded-full">
                                        {task.comments?.length || 0}
                                    </span>
                                </h4>

                                {/* Comment List */}
                                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                    {task.comments && task.comments.length > 0 ? (
                                        task.comments.map((comment) => (
                                            <div
                                                key={comment._id}
                                                className="p-4 bg-white rounded-xl border border-orange-100 hover:border-orange-200 transition-colors"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                                                            {comment.user?.name?.charAt(0) || "?"}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {comment.user?.name || "Unknown"}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(comment.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 pl-9">{comment.text}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                No comments yet. Be the first to comment!
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Add Comment Form */}
                                <form onSubmit={handleSubmitComment} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Write a comment..."
                                        className="input-premium flex-1 text-sm"
                                    />
                                    <button
                                        type="submit"
                                        disabled={submitting || !commentText.trim()}
                                        className="btn-primary px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        )}
                                    </button>
                                </form>
                                {error && (
                                    <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {error}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                            <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-600 font-medium">Task not found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
