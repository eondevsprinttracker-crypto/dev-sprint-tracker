"use client";

import { useState, useEffect, useCallback } from "react";
import { getProjectById, getTasksByProject } from "@/app/actions/projectActions";
import { updateStatus, updateTask, deleteTask } from "@/app/actions/taskActions";
import CreateTaskModal from "./CreateTaskModal";
import TaskDetailModal from "@/components/TaskDetailModal";
import { formatDuration } from "@/lib/utils";

interface ProjectDetailViewProps {
    projectId: string;
    developers: { _id: string; name: string }[];
    onClose: () => void;
    onRefresh: () => void;
    showToast: (message: string, type: "success" | "error") => void;
}

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

interface Project {
    _id: string;
    name: string;
    key: string;
    description: string;
    status: string;
    color: string;
    startDate: string;
    targetEndDate?: string;
    developers: { _id: string; name: string; email: string }[];
    taskStats: {
        total: number;
        completed: number;
        inProgress: number;
        todo: number;
        pendingReview: number;
        changesRequested: number;
        blocked: number;
        progress: number;
        totalEstimatedHours: number;
        totalActualHours: number;
    };
}

type TabType = "kanban" | "list" | "team";

const KANBAN_COLUMNS = [
    { key: "Todo", label: "To Do", color: "border-neutral-500", bgColor: "bg-neutral-500/10" },
    { key: "In Progress", label: "In Progress", color: "border-orange-500", bgColor: "bg-orange-500/10" },
    { key: "Pending Review", label: "Review", color: "border-amber-500", bgColor: "bg-amber-500/10" },
    { key: "Completed", label: "Completed", color: "border-emerald-500", bgColor: "bg-emerald-500/10" },
];

export default function ProjectDetailView({
    projectId,
    developers,
    onClose,
    onRefresh,
    showToast,
}: ProjectDetailViewProps) {
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("kanban");
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [viewTaskId, setViewTaskId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        const [projectRes, tasksRes] = await Promise.all([
            getProjectById(projectId),
            getTasksByProject(projectId),
        ]);

        if (projectRes.success && projectRes.project) {
            setProject(projectRes.project);
        }
        if (tasksRes.success) {
            setTasks(tasksRes.tasks || []);
        }
        setLoading(false);
    }, [projectId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Keyboard shortcuts
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === "Escape") onClose();
            if (e.key.toLowerCase() === "n" && !showCreateTask) setShowCreateTask(true);
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, showCreateTask]);

    async function handleApprove(taskId: string) {
        setActionLoading(taskId);
        const result = await updateStatus(taskId, "Completed");
        if (result.success) {
            showToast("Task approved!", "success");
            await loadData();
        } else {
            showToast(result.error || "Failed to approve", "error");
        }
        setActionLoading(null);
    }

    async function handleReject(taskId: string) {
        setActionLoading(taskId);
        const result = await updateStatus(taskId, "Changes Requested");
        if (result.success) {
            showToast("Changes requested", "success");
            await loadData();
        } else {
            showToast(result.error || "Failed", "error");
        }
        setActionLoading(null);
    }

    const getTasksByStatus = (status: string) => {
        if (status === "Todo") {
            // Include both Todo and Changes Requested in the Todo column
            return tasks.filter(t => t.status === "Todo" || t.status === "Changes Requested");
        }
        return tasks.filter((t) => t.status === status);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">Project not found</p>
                    <button onClick={onClose} className="btn-primary px-6 py-2">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-neutral-950 z-[60] overflow-hidden flex flex-col">
            {/* Header */}
            <header className="flex-shrink-0 bg-neutral-900/80 backdrop-blur border-b border-neutral-800 px-6 py-4">
                <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: project.color }}
                            >
                                {project.key}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">{project.name}</h1>
                                <p className="text-sm text-neutral-400">
                                    {project.taskStats.total} tasks • {project.taskStats.progress}% complete
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Header actions */}
                    <div className="flex items-center gap-3">
                        {/* Tab navigation */}
                        <div className="flex gap-1 p-1 bg-neutral-800/50 rounded-lg">
                            {(["kanban", "list", "team"] as TabType[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === tab
                                        ? "bg-orange-600 text-white"
                                        : "text-neutral-400 hover:text-white hover:bg-neutral-700/50"
                                        }`}
                                >
                                    {tab === "kanban" && "Board"}
                                    {tab === "list" && "List"}
                                    {tab === "team" && "Team"}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowCreateTask(true)}
                            className="btn-primary flex items-center gap-2 px-4 py-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Task
                        </button>
                    </div>
                </div>
            </header>

            {/* Progress bar */}
            <div className="flex-shrink-0 h-1 bg-neutral-800">
                <div
                    className="h-full transition-all duration-500"
                    style={{
                        width: `${project.taskStats.progress}%`,
                        backgroundColor: project.color,
                    }}
                />
            </div>

            {/* Main content */}
            <main className="flex-1 overflow-auto p-6">
                {activeTab === "kanban" && (
                    <div className="grid grid-cols-4 gap-4 h-full max-w-screen-2xl mx-auto">
                        {KANBAN_COLUMNS.map((column) => (
                            <div
                                key={column.key}
                                className={`flex flex-col rounded-xl border-t-2 ${column.color} ${column.bgColor} backdrop-blur`}
                            >
                                {/* Column header */}
                                <div className="flex items-center justify-between p-4 border-b border-neutral-800/50">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-white">{column.label}</span>
                                        <span className="px-2 py-0.5 text-xs font-medium bg-neutral-800 text-neutral-400 rounded-full">
                                            {getTasksByStatus(column.key).length}
                                        </span>
                                    </div>
                                </div>

                                {/* Tasks */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                    {getTasksByStatus(column.key).length === 0 ? (
                                        <div className="text-center py-8 text-neutral-500 text-sm">
                                            No tasks
                                        </div>
                                    ) : (
                                        getTasksByStatus(column.key).map((task) => (
                                            <div
                                                key={task._id}
                                                className={`bg-neutral-900/80 rounded-xl border border-neutral-700/50 p-4 hover:border-neutral-600 transition-all cursor-pointer group ${task.isBlocked ? "border-l-4 border-l-red-500" : ""
                                                    }`}
                                                onClick={() => setViewTaskId(task._id)}
                                            >
                                                {/* Task blocked indicator */}
                                                {task.isBlocked && (
                                                    <div className="flex items-center gap-1.5 text-xs text-red-400 mb-2">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Blocked
                                                    </div>
                                                )}

                                                {/* Changes Requested indicator */}
                                                {task.status === "Changes Requested" && (
                                                    <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-2">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                        </svg>
                                                        Changes Requested
                                                    </div>
                                                )}

                                                {/* Title */}
                                                <h4 className="font-medium text-white group-hover:text-orange-400 transition-colors line-clamp-2 mb-2">
                                                    {task.title}
                                                </h4>

                                                {/* Meta */}
                                                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
                                                    <span
                                                        className={`px-2 py-0.5 rounded font-medium ${task.complexity === "Hard"
                                                            ? "bg-red-500/20 text-red-400"
                                                            : task.complexity === "Medium"
                                                                ? "bg-amber-500/20 text-amber-400"
                                                                : "bg-emerald-500/20 text-emerald-400"
                                                            }`}
                                                    >
                                                        {task.complexity}
                                                    </span>
                                                    <span>{task.points} pts</span>
                                                </div>

                                                {/* Assignee */}
                                                {task.assignedTo && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-xs font-medium">
                                                            {task.assignedTo.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-xs text-neutral-400 truncate">
                                                            {task.assignedTo.name}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Review actions */}
                                                {column.key === "Pending Review" && (
                                                    <div
                                                        className="flex gap-2 mt-3 pt-3 border-t border-neutral-800"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            onClick={() => handleApprove(task._id)}
                                                            disabled={actionLoading === task._id}
                                                            className="flex-1 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition disabled:opacity-50"
                                                        >
                                                            {actionLoading === task._id ? "..." : "Approve"}
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(task._id)}
                                                            disabled={actionLoading === task._id}
                                                            className="flex-1 py-1.5 text-xs font-medium bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition disabled:opacity-50"
                                                        >
                                                            {actionLoading === task._id ? "..." : "Changes"}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "list" && (
                    <div className="max-w-screen-xl mx-auto">
                        <div className="bg-neutral-900/50 rounded-xl border border-neutral-800 overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-neutral-800">
                                        <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Task</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Assignee</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Status</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Complexity</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-neutral-400">Est. Hours</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map((task) => (
                                        <tr
                                            key={task._id}
                                            className="border-b border-neutral-800/50 hover:bg-neutral-800/30 cursor-pointer transition"
                                            onClick={() => setViewTaskId(task._id)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {task.isBlocked && (
                                                        <span className="w-2 h-2 bg-red-500 rounded-full" title="Blocked" />
                                                    )}
                                                    <span className="text-white font-medium">{task.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-400">
                                                {task.assignedTo?.name || "Unassigned"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-2 py-1 text-xs rounded-full ${task.status === "Completed"
                                                        ? "bg-emerald-500/20 text-emerald-400"
                                                        : task.status === "In Progress"
                                                            ? "bg-orange-500/20 text-orange-400"
                                                            : task.status === "Pending Review"
                                                                ? "bg-amber-500/20 text-amber-400"
                                                                : "bg-neutral-500/20 text-neutral-400"
                                                        }`}
                                                >
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-400">{task.complexity}</td>
                                            <td className="px-4 py-3 text-neutral-400">{task.estimatedHours}h</td>
                                        </tr>
                                    ))}
                                    {tasks.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center text-neutral-500">
                                                No tasks in this project yet
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "team" && (
                    <div className="max-w-screen-xl mx-auto">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {project.developers.map((dev) => {
                                const devTasks = tasks.filter((t) => t.assignedTo?._id === dev._id);
                                const completed = devTasks.filter((t) => t.status === "Completed").length;
                                const inProgress = devTasks.filter((t) => t.status === "In Progress").length;
                                const blocked = devTasks.filter((t) => t.isBlocked).length;

                                return (
                                    <div
                                        key={dev._id}
                                        className="bg-neutral-900/50 rounded-xl border border-neutral-800 p-5"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-lg">
                                                {dev.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white">{dev.name}</h3>
                                                <p className="text-sm text-neutral-400">{dev.email}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="text-center p-2 bg-neutral-800/50 rounded-lg">
                                                <p className="text-lg font-bold text-white">{devTasks.length}</p>
                                                <p className="text-[10px] text-neutral-500 uppercase">Total</p>
                                            </div>
                                            <div className="text-center p-2 bg-neutral-800/50 rounded-lg">
                                                <p className="text-lg font-bold text-orange-400">{inProgress}</p>
                                                <p className="text-[10px] text-neutral-500 uppercase">Active</p>
                                            </div>
                                            <div className="text-center p-2 bg-neutral-800/50 rounded-lg">
                                                <p className="text-lg font-bold text-emerald-400">{completed}</p>
                                                <p className="text-[10px] text-neutral-500 uppercase">Done</p>
                                            </div>
                                        </div>

                                        {blocked > 0 && (
                                            <div className="mt-3 flex items-center gap-2 text-xs text-red-400">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {blocked} blocked task(s)
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {project.developers.length === 0 && (
                                <div className="col-span-full text-center py-12 text-neutral-500">
                                    No team members assigned to this project
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Create Task Modal - Pre-fill with project */}
            {showCreateTask && (
                <CreateTaskModal
                    developers={project.developers.length > 0 ? project.developers : developers}
                    onClose={() => {
                        setShowCreateTask(false);
                        loadData();
                        onRefresh();
                    }}
                    projectId={projectId}
                />
            )}

            {/* Task Detail Modal */}
            <TaskDetailModal
                taskId={viewTaskId}
                onClose={() => {
                    setViewTaskId(null);
                    loadData();
                }}
            />
        </div>
    );
}
