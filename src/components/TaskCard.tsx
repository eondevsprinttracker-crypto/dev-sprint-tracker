"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { startTask, logHours, changeTaskStatus } from "@/app/actions/taskActions";
import TaskTimer from "@/components/TaskTimer";
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
    startedAt?: string;
    createdBy?: { name: string };
    isTimerRunning?: boolean;
    timerStartTime?: string;
    totalSecondsSpent?: number;
}

interface TaskCardProps {
    task: Task;
    onUploadProof: (taskId: string) => void;
    onViewDetails?: (taskId: string) => void;
    onToggleBlocker?: (taskId: string, isBlocked: boolean) => void;
    onRefresh?: () => void;
}

export default function TaskCard({ task, onUploadProof, onViewDetails, onToggleBlocker, onRefresh }: TaskCardProps) {
    const [loading, setLoading] = useState(false);
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (task.status === 'In Progress' && task.startedAt) {
            const start = new Date(task.startedAt).getTime();

            const updateElapsed = () => {
                const now = Date.now();
                setElapsed(Math.floor((now - start) / 1000));
            };

            updateElapsed();

            const interval = setInterval(updateElapsed, 1000);
            return () => clearInterval(interval);
        } else {
            setElapsed(0);
        }
    }, [task.status, task.startedAt]);

    const formatTime = (seconds: number) => {
        if (seconds < 0) return "0h 0m";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    };

    const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
        Todo: { bg: "bg-slate-500/15", text: "text-slate-600", icon: "○" },
        "In Progress": { bg: "bg-orange-500/15", text: "text-orange-600", icon: "●" },
        "Pending Review": { bg: "bg-amber-500/15", text: "text-amber-600", icon: "◐" },
        Completed: { bg: "bg-emerald-500/15", text: "text-emerald-600", icon: "✓" },
        "Changes Requested": { bg: "bg-red-500/15", text: "text-red-600", icon: "!" },
    };

    const complexityConfig: Record<string, { bg: string; text: string; glow: string }> = {
        Easy: { bg: "bg-emerald-100", text: "text-emerald-700", glow: "shadow-emerald-500/20" },
        Medium: { bg: "bg-amber-100", text: "text-amber-700", glow: "shadow-amber-500/20" },
        Hard: { bg: "bg-red-100", text: "text-red-700", glow: "shadow-red-500/20" },
    };

    const statusStrip: Record<string, string> = {
        Todo: "bg-slate-500",
        "In Progress": "bg-gradient-to-b from-orange-500 to-orange-600",
        "Pending Review": "bg-gradient-to-b from-amber-500 to-amber-600",
        Completed: "bg-gradient-to-b from-emerald-500 to-emerald-600",
        "Changes Requested": "bg-gradient-to-b from-red-500 to-red-600",
    };

    const isOvertime = task.actualHours > task.estimatedHours;

    async function handleStatusChange(newStatus: string) {
        if (task.status === newStatus) return;
        setLoading(true);
        await changeTaskStatus(task._id, newStatus as any);
        if (onRefresh) onRefresh();
        setLoading(false);
    }

    async function handleStartTask() {
        setLoading(true);
        await startTask(task._id);
        if (onRefresh) onRefresh();
        setLoading(false);
    }

    function handleToggleBlocker() {
        if (onToggleBlocker) {
            onToggleBlocker(task._id, task.isBlocked);
        }
    }

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl transition-all duration-400 card-shine
                ${task.isBlocked
                    ? "bg-gradient-to-br from-red-50 to-red-100 border border-red-300 shadow-lg shadow-red-500/10"
                    : "glass-card glass-card-hover"
                }`}
        >
            {/* Status Strip with Glow */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${task.isBlocked ? 'bg-red-500' : statusStrip[task.status]}`} />
            {task.status === "In Progress" && !task.isBlocked && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500 animate-pulse-orange" />
            )}

            <div className="p-5 pl-7">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            {/* Status Dropdown */}
                            <div className="relative">
                                <select
                                    value={task.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    disabled={loading}
                                    className={`text-xs font-bold rounded-full px-3 py-1.5 border appearance-none cursor-pointer transition-all pr-6
                                        ${statusConfig[task.status]?.bg} ${statusConfig[task.status]?.text} border-current/20
                                        hover:border-current/40 focus:outline-none focus:ring-2 focus:ring-current/20`}
                                >
                                    <option value="Todo">○ Todo</option>
                                    <option value="In Progress">● In Progress</option>
                                    <option value="Pending Review">◐ Pending Review</option>
                                    <option value="Changes Requested">! Changes Requested</option>
                                    <option value="Completed">✓ Completed</option>
                                </select>
                                <svg className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${statusConfig[task.status]?.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>

                            {task.isBlocked && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    BLOCKED
                                </div>
                            )}
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-orange-600 transition-colors duration-300">
                            {task.title}
                        </h3>
                    </div>

                    {/* Complexity & Points Badge */}
                    <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${complexityConfig[task.complexity]?.bg} ${complexityConfig[task.complexity]?.text} shadow-lg ${complexityConfig[task.complexity]?.glow}`}>
                            {task.complexity}
                        </span>
                        <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs font-bold text-orange-600">{task.points} pts</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {task.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                        {task.description}
                    </p>
                )}

                {/* Metrics Section - Radical Minimalism */}
                <div className="grid grid-cols-[1fr,auto] gap-6 items-center mb-6 px-1">
                    {/* Integrated Time Tracking */}
                    <div className="flex items-center gap-4">
                        {(task.status === "In Progress" || task.status === "Todo" || task.status === "Changes Requested") ? (
                            <TaskTimer
                                taskId={task._id}
                                initialIsRunning={task.isTimerRunning || false}
                                initialStartTime={task.timerStartTime || null}
                                initialTotalSeconds={task.totalSecondsSpent || 0}
                                onUpdate={onRefresh}
                                showControls={task.status !== "Todo"}
                            />
                        ) : (
                            <div className="flex items-baseline gap-2">
                                <span className={`text-3xl font-mono font-bold tracking-tighter ${isOvertime ? 'text-red-600' : 'text-gray-900'}`}>
                                    {formatDuration(task.actualHours)}
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pb-1 border-b border-gray-200">
                                    / {task.estimatedHours}h
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Integrated Efficiency */}
                    <div className="flex flex-col items-end min-w-[100px]">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-sm font-bold tracking-tight ${isOvertime ? 'text-red-600' : 'text-emerald-600'}`}>
                                {task.actualHours > 0
                                    ? (() => {
                                        const eff = Math.round((task.estimatedHours / task.actualHours) * 100);
                                        return eff > 999 ? '>999%' : `${eff}%`;
                                    })()
                                    : '100%'}
                            </span>
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Efficiency</span>
                        </div>
                        <div className="w-full h-[3px] bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-in-out ${isOvertime
                                    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                                    : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`}
                                style={{
                                    width: `${Math.min(((task.estimatedHours / (task.actualHours || task.estimatedHours)) * 100), 100)}%`
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Blocker Note */}
                {task.isBlocked && task.blockerNote && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-xl">
                        <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-xs text-red-200 leading-relaxed">{task.blockerNote}</p>
                        </div>
                    </div>
                )}

                {/* Actions Footer */}
                <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-200">
                    <div className="flex gap-2">
                        {/* Start Action */}
                        {(task.status === "Todo" || task.status === "Changes Requested") && (
                            <button
                                onClick={handleStartTask}
                                disabled={loading}
                                className="btn-primary px-4 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Start
                                </span>
                            </button>
                        )}

                        {/* Upload Proof / Done */}
                        {task.status === "In Progress" && (
                            <button
                                onClick={() => onUploadProof(task._id)}
                                disabled={loading}
                                className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl transition-all shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/30 hover:-translate-y-0.5 disabled:opacity-50"
                            >
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Done
                                </span>
                            </button>
                        )}

                        {/* View Details */}
                        <Link
                            href={`/dashboard/dev/tasks/${task._id}`}
                            className="p-2.5 text-gray-400 hover:text-orange-600 hover:bg-orange-100 rounded-xl transition-all duration-200"
                            title="View Details"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Blocker Toggle */}
                        {onToggleBlocker && task.status !== "Completed" && (
                            <button
                                onClick={handleToggleBlocker}
                                className={`p-2.5 rounded-xl transition-all duration-200 ${task.isBlocked
                                    ? "text-red-600 bg-red-100 hover:bg-red-200"
                                    : "text-gray-400 hover:text-red-600 hover:bg-red-100"}`}
                                title={task.isBlocked ? "Remove Blocker" : "Mark as Blocked"}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Proof Link */}
                {task.proofUrl && (
                    <div className="mt-3 text-right">
                        <a
                            href={task.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors group/link"
                        >
                            <svg className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View Proof
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
