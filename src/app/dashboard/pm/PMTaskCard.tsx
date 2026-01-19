"use client";

import { useState } from "react";
import { formatDuration } from "@/lib/utils";

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

interface PMTaskCardProps {
    task: Task;
    onView: (taskId: string) => void;
    onEdit: (task: Task) => void;
    onApprove?: (taskId: string) => void;
    onReject?: (taskId: string) => void;
    actionLoading?: string | null;
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    Todo: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
    "In Progress": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
    "Pending Review": { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
    Completed: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
    "Changes Requested": { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
};

const complexityColors: Record<string, string> = {
    Easy: "text-green-400",
    Medium: "text-yellow-400",
    Hard: "text-red-400",
};

export default function PMTaskCard({
    task,
    onView,
    onEdit,
    onApprove,
    onReject,
    actionLoading,
}: PMTaskCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const statusStyle = statusColors[task.status] || statusColors.Todo;
    const hoursVariance = task.actualHours - task.estimatedHours;
    const isOvertime = hoursVariance > 0;

    return (
        <div
            className={`group relative bg-[#1e1e1e]/60 backdrop-blur-sm rounded-xl border transition-all duration-300 
                ${task.isBlocked ? "border-red-500/30" : "border-white/5"} 
                hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/10`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Blocked Badge */}
            {task.isBlocked && (
                <div className="absolute -top-2 -right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    BLOCKED
                </div>
            )}

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                {task.status}
                            </span>
                            <span className={`text-xs font-medium ${complexityColors[task.complexity]}`}>
                                {task.complexity}
                            </span>
                        </div>
                        <h3 className="font-semibold text-white truncate group-hover:text-orange-300 transition-colors">
                            {task.title}
                        </h3>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-orange-400">{task.points}</div>
                        <div className="text-xs text-slate-500">pts</div>
                    </div>
                </div>

                {/* Description Preview */}
                {task.description && (
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                        {task.description}
                    </p>
                )}

                {/* Assigned To */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-semibold">
                        {task.assignedTo?.name?.charAt(0) || "?"}
                    </div>
                    <div>
                        <p className="text-sm text-white">{task.assignedTo?.name || "Unassigned"}</p>
                        <p className="text-xs text-slate-500">{task.assignedTo?.email || ""}</p>
                    </div>
                </div>

                {/* Hours Tracking */}
                <div className="flex items-center gap-4 mb-4 p-3 bg-slate-900/50 rounded-lg">
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1">Estimated</p>
                        <p className="text-sm font-medium text-slate-300">{task.estimatedHours}h</p>
                    </div>
                    <div className="w-px h-8 bg-slate-700" />
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1">Actual</p>
                        <p className={`text-sm font-medium ${isOvertime ? "text-red-400" : "text-green-400"}`}>
                            {formatDuration(task.actualHours)}
                            {isOvertime && (
                                <svg className="w-4 h-4 text-red-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            )}
                        </p>
                    </div>
                    {task.actualHours > 0 && (
                        <>
                            <div className="w-px h-8 bg-slate-700" />
                            <div className="flex-1">
                                <p className="text-xs text-slate-500 mb-1">Variance</p>
                                <p className={`text-sm font-medium ${isOvertime ? "text-red-400" : "text-green-400"}`}>
                                    {isOvertime ? "+" : ""}{formatDuration(hoursVariance)}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Blocker Note */}
                {task.isBlocked && task.blockerNote && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            <p className="text-xs text-red-300 font-medium">Blocker:</p>
                        </div>
                        <p className="text-sm text-red-400">{task.blockerNote}</p>
                    </div>
                )}

                {/* Proof Link */}
                {task.proofUrl && (
                    <a
                        href={task.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-300 mb-4 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        View Proof
                    </a>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-700/50">
                    <button
                        onClick={() => onView(task._id)}
                        className="flex-1 py-2 px-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition"
                    >
                        View Details
                    </button>
                    <button
                        onClick={() => onEdit(task)}
                        className="flex-1 py-2 px-3 text-sm font-medium text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition"
                    >
                        Edit
                    </button>
                </div>

                {/* Review Actions - Only for Pending Review status */}
                {task.status === "Pending Review" && onApprove && onReject && (
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={() => onApprove(task._id)}
                            disabled={actionLoading === task._id}
                            className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                        >
                            {actionLoading === task._id ? "..." : "✓ Approve"}
                        </button>
                        <button
                            onClick={() => onReject(task._id)}
                            disabled={actionLoading === task._id}
                            className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                        >
                            {actionLoading === task._id ? "..." : "↩ Reject"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
