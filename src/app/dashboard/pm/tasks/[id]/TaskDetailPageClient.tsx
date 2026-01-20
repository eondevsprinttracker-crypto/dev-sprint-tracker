"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { postComment } from "@/app/actions/taskActions";
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

interface TaskDetailPageProps {
    task: TaskDetail;
    userRole?: string;
}

export default function TaskDetailPageClient({ task: initialTask, userRole }: TaskDetailPageProps) {
    const router = useRouter();
    const [task, setTask] = useState<TaskDetail>(initialTask);
    const [commentText, setCommentText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

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

    async function handleSubmitComment(e: React.FormEvent) {
        e.preventDefault();
        if (!commentText.trim()) return;

        setSubmitting(true);
        setError("");

        const result = await postComment(task._id, commentText.trim());

        if (result.success) {
            setCommentText("");
            // In a real app we'd optimistically update or re-fetch. 
            // For now, refreshing the router to get fresh data is simplest but full re-load.
            // Better: update local state if we had the new comment. 
            router.refresh();
        } else {
            setError(result.error || "Failed to post comment");
        }
        setSubmitting(false);
    }

    // Handler for timer updates to refresh data
    const handleTimerUpdate = () => {
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 p-6">
            <div className="max-w-3xl mx-auto">
                {/* Back Link */}
                <div className="flex items-center gap-3 mb-6">
                    <Link
                        href={userRole === "PM" ? "/dashboard/pm" : "/dashboard/dev"}
                        className="text-gray-500 hover:text-gray-900 transition flex items-center gap-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </Link>
                </div>

                <div className="glass-card rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-orange-100 bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/15 rounded-xl">
                                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 leading-none">Task Details</h1>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">#{task._id.slice(-6)}</p>
                            </div>
                        </div>
                        {userRole === "PM" && (
                            <Link
                                href={`/dashboard/pm/tasks/${task._id}/edit`}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Task
                            </Link>
                        )}
                    </div>

                    <div className="p-8">
                        {/* Task Info */}
                        <div className="flex items-start justify-between gap-6 mb-8">
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <span className={`px-3 py-1 text-sm font-bold rounded-full ${statusConfig[task.status]?.bg} ${statusConfig[task.status]?.text} ${statusConfig[task.status]?.border} border shadow-sm`}>
                                        {task.status}
                                    </span>
                                    {task.isBlocked && (
                                        <span className="px-3 py-1 text-sm font-bold rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center gap-1.5 shadow-sm animate-pulse-red">
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                            BLOCKED
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">{task.title}</h2>
                                {task.description && (
                                    <div className="prose prose-orange max-w-none text-gray-600">
                                        <p>{task.description}</p>
                                    </div>
                                )}
                            </div>
                            <div className="text-right flex-shrink-0 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <span className={`block text-lg font-bold mb-1 ${complexityConfig[task.complexity]}`}>
                                    {task.complexity}
                                </span>
                                <div className="text-3xl font-bold text-gray-900 mb-1">{task.points}</div>
                                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Story Points</div>
                            </div>
                        </div>

                        {/* Blocker Note */}
                        {task.isBlocked && task.blockerNote && (
                            <div className="p-5 bg-red-50 border border-red-100 rounded-xl mb-8 flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-red-900 font-bold mb-1">Blocker Details</h4>
                                    <p className="text-red-700">{task.blockerNote}</p>
                                </div>
                            </div>
                        )}

                        {/* Timer Section */}
                        {(task.status === "In Progress" || task.status === "Todo" || task.status === "Changes Requested") && (
                            <div className="mb-8 p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl text-white shadow-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                            <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">Time Tracking</h3>
                                            <p className="text-sm text-gray-400">Track your active work time</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/10 rounded-xl px-4 py-2 border border-white/5 mx-auto">
                                        <TaskTimer
                                            taskId={task._id}
                                            initialIsRunning={task.isTimerRunning || false}
                                            initialStartTime={task.timerStartTime || null}
                                            initialTotalSeconds={task.totalSecondsSpent || 0}
                                            onUpdate={handleTimerUpdate}
                                            showControls={task.status !== "Todo"}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-4 gap-4 mb-8">
                            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Estimated</p>
                                <p className="text-xl font-bold text-gray-900">{formatDuration(task.estimatedHours)}</p>
                            </div>
                            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Actual</p>
                                <p className={`text-xl font-bold ${task.actualHours > task.estimatedHours ? "text-red-600" : "text-gray-900"}`}>
                                    {formatDuration(task.actualHours)}
                                </p>
                            </div>
                            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Sprint Week</p>
                                <p className="text-xl font-bold text-orange-600">Week {task.weekNumber}</p>
                            </div>
                            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Owner</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center text-xs font-bold text-orange-800">
                                        {task.createdBy?.name?.charAt(0) || "?"}
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 truncate">{task.createdBy?.name || "System"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Proof URL */}
                        {task.proofUrl && (
                            <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg border border-gray-200">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Proof of Work submitted</h4>
                                        <p className="text-xs text-gray-500">External link to resources</p>
                                    </div>
                                </div>
                                <a
                                    href={task.proofUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-white border border-gray-200 text-orange-600 font-medium rounded-lg hover:border-orange-300 hover:text-orange-700 transition flex items-center gap-2 text-sm"
                                >
                                    View Proof
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        )}

                        {/* Comments Section */}
                        <div className="border-t border-gray-100 pt-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                Discussion
                                <span className="px-2.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                                    {task.comments?.length || 0}
                                </span>
                            </h3>

                            {/* Comment List */}
                            <div className="space-y-6 mb-8">
                                {task.comments && task.comments.length > 0 ? (
                                    task.comments.map((comment, idx) => (
                                        <div key={comment._id} className="flex gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold shadow-md">
                                                    {comment.user?.name?.charAt(0) || "?"}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-bold text-gray-900 text-sm">
                                                            {comment.user?.name || "Unknown"}
                                                        </span>
                                                        <span className="text-xs text-gray-400 font-medium">
                                                            {formatDate(comment.timestamp)}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 text-sm leading-relaxed">{comment.text}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-gray-500 font-medium">No comments yet. Start the discussion!</p>
                                    </div>
                                )}
                            </div>

                            {/* Add Comment Form */}
                            <form onSubmit={handleSubmitComment} className="relative">
                                <div className="absolute top-3 left-4 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="w-full pl-12 pr-32 py-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={submitting || !commentText.trim()}
                                    className="absolute right-2 top-2 bottom-2 px-6 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {submitting ? "Posting..." : "Post"}
                                </button>
                            </form>
                            {error && <p className="text-red-500 text-sm mt-2 ml-1">{error}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
