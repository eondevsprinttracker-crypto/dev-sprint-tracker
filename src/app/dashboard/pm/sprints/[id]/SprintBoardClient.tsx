"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    getSprintById,
    startSprint,
    completeSprint,
    updateTaskStatus,
    addTaskToSprint,
    removeTaskFromSprint,
    reorderSprintTasks,
    getSprintBurndown,
} from "@/app/actions/sprintActions";

interface Task {
    _id: string;
    title: string;
    description: string;
    status: string;
    priority: "Critical" | "High" | "Medium" | "Low";
    complexity: string;
    points: number;
    storyPoints?: number;
    estimatedHours: number;
    isBlocked: boolean;
    blockerNote: string;
    order: number;
    assignedTo?: {
        _id: string;
        name: string;
        email: string;
        image?: string;
    };
}

interface Sprint {
    _id: string;
    name: string;
    goal: string;
    status: "Planning" | "Active" | "Completed" | "Cancelled";
    startDate: string;
    endDate: string;
    capacity: number;
    velocity: number;
    retrospective: string;
    project: {
        _id: string;
        name: string;
        key: string;
        color: string;
    };
}

interface TaskStats {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    pendingReview: number;
    blocked: number;
    totalPoints: number;
    completedPoints: number;
}

const STATUS_COLUMNS = [
    { id: "Todo", label: "To Do", color: "border-neutral-500" },
    { id: "In Progress", label: "In Progress", color: "border-blue-500" },
    { id: "Pending Review", label: "Review", color: "border-yellow-500" },
    { id: "Completed", label: "Done", color: "border-green-500" },
];

const PRIORITY_COLORS: Record<string, string> = {
    Critical: "bg-red-500",
    High: "bg-orange-500",
    Medium: "bg-yellow-500",
    Low: "bg-green-500",
};

interface SprintBoardClientProps {
    sprintId: string;
}

export default function SprintBoardClient({ sprintId }: SprintBoardClientProps) {
    const router = useRouter();
    const [sprint, setSprint] = useState<Sprint | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [backlog, setBacklog] = useState<Task[]>([]);
    const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [showBacklog, setShowBacklog] = useState(false);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getSprintById(sprintId);
            if (result.success) {
                setSprint(result.sprint);
                setTasks(result.tasks || []);
                setBacklog(result.backlog || []);
                setTaskStats(result.taskStats || null);
            } else {
                showToast(result.error || "Failed to load sprint", "error");
            }
        } catch (error) {
            console.error("Error loading sprint:", error);
        } finally {
            setLoading(false);
        }
    }, [sprintId]);

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

    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent, task: Task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        setDragOverColumn(columnId);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        setDragOverColumn(null);

        if (!draggedTask) return;

        // Optimistic update
        const previousTasks = [...tasks];
        setTasks((prev) =>
            prev.map((t) => (t._id === draggedTask._id ? { ...t, status: newStatus } : t))
        );

        const result = await updateTaskStatus(draggedTask._id, newStatus);
        if (!result.success) {
            setTasks(previousTasks);
            showToast(result.error || "Failed to update task", "error");
        }

        setDraggedTask(null);
    };

    const handleAddToSprint = async (taskId: string) => {
        const result = await addTaskToSprint(taskId, sprintId);
        if (result.success) {
            loadData();
            showToast("Task added to sprint", "success");
        } else {
            showToast(result.error || "Failed to add task", "error");
        }
    };

    const handleRemoveFromSprint = async (taskId: string) => {
        const result = await removeTaskFromSprint(taskId);
        if (result.success) {
            loadData();
            showToast("Task moved to backlog", "success");
        } else {
            showToast(result.error || "Failed to remove task", "error");
        }
    };

    const handleStartSprint = async () => {
        const result = await startSprint(sprintId);
        if (result.success) {
            loadData();
            showToast("Sprint started!", "success");
        } else {
            showToast(result.error || "Failed to start sprint", "error");
        }
    };

    const handleCompleteSprint = async () => {
        const result = await completeSprint(sprintId);
        if (result.success) {
            loadData();
            showToast(`Sprint completed! Velocity: ${result.velocity} points`, "success");
        } else {
            showToast(result.error || "Failed to complete sprint", "error");
        }
    };

    const getTasksByStatus = (status: string) => {
        return tasks.filter((task) => task.status === status).sort((a, b) => a.order - b.order);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const getDaysRemaining = () => {
        if (!sprint) return 0;
        const end = new Date(sprint.endDate);
        const now = new Date();
        return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    };

    const getProgress = () => {
        if (!taskStats || taskStats.totalPoints === 0) return 0;
        return Math.round((taskStats.completedPoints / taskStats.totalPoints) * 100);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!sprint) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center text-gray-900">
                <div className="text-center">
                    <h2 className="text-xl font-medium mb-2">Sprint not found</h2>
                    <Link href="/dashboard/pm/sprints" className="text-orange-400 hover:underline">
                        Back to Sprints
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-gray-900">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-orange-100">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/dashboard/pm/sprints"
                                className="p-2 hover:bg-orange-50 rounded-lg transition"
                            >
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className="text-xs font-medium px-2 py-0.5 rounded"
                                        style={{
                                            backgroundColor: `${sprint.project?.color}20`,
                                            color: sprint.project?.color,
                                        }}
                                    >
                                        {sprint.project?.key}
                                    </span>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${sprint.status === "Active"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : sprint.status === "Planning"
                                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                                : sprint.status === "Completed"
                                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                                    : "bg-gray-50 text-gray-600 border-gray-200"
                                        }`}>
                                        {sprint.status}
                                    </span>
                                </div>
                                <h1 className="text-xl font-bold text-gray-900">{sprint.name}</h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Sprint Stats */}
                            <div className="hidden md:flex items-center gap-6 mr-4">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-gray-900">{taskStats?.completedPoints || 0}/{taskStats?.totalPoints || 0}</div>
                                    <div className="text-xs text-gray-500">Points</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-gray-900">{getDaysRemaining()}</div>
                                    <div className="text-xs text-gray-500">Days Left</div>
                                </div>
                                <div className="w-32">
                                    <div className="text-xs text-gray-500 mb-1">{getProgress()}% Complete</div>
                                    <div className="progress-bar">
                                        <div className="progress-bar-fill" style={{ width: `${getProgress()}%` }} />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            {sprint.status === "Planning" && (
                                <button onClick={handleStartSprint} className="btn-primary text-sm">
                                    Start Sprint
                                </button>
                            )}
                            {sprint.status === "Active" && (
                                <button onClick={handleCompleteSprint} className="btn-secondary text-sm">
                                    Complete Sprint
                                </button>
                            )}
                            <button
                                onClick={() => setShowBacklog(!showBacklog)}
                                className={`px-4 py-2 text-sm rounded-xl border transition ${showBacklog
                                        ? "bg-orange-100 border-orange-300 text-orange-700"
                                        : "border-orange-100 text-gray-600 hover:border-orange-200"
                                    }`}
                            >
                                Backlog ({backlog.length})
                            </button>
                        </div>
                    </div>

                    {/* Sprint Goal */}
                    {sprint.goal && (
                        <p className="text-sm text-gray-600 mt-2 max-w-3xl">
                            <span className="text-gray-500">Goal:</span> {sprint.goal}
                        </p>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex h-[calc(100vh-120px)]">
                {/* Kanban Board */}
                <div className={`flex-1 p-6 overflow-x-auto ${showBacklog ? "pr-0" : ""}`}>
                    <div className="flex gap-4 h-full min-w-max">
                        {STATUS_COLUMNS.map((column) => {
                            const columnTasks = getTasksByStatus(column.id);
                            const isDropTarget = dragOverColumn === column.id;

                            return (
                                <div
                                    key={column.id}
                                    className={`w-80 flex-shrink-0 flex flex-col rounded-2xl border transition-all ${isDropTarget
                                            ? "border-orange-300 bg-orange-50"
                                            : "border-orange-100 bg-white"
                                        }`}
                                    onDragOver={(e) => handleDragOver(e, column.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, column.id)}
                                >
                                    {/* Column Header */}
                                        <div className={`p-4 border-b border-orange-100 border-l-4 rounded-t-2xl ${column.color}`}>
                                        <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-gray-900">{column.label}</h3>
                                                <span className="text-sm text-gray-500">{columnTasks.length}</span>
                                        </div>
                                    </div>

                                    {/* Tasks */}
                                    <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                                        {columnTasks.map((task) => (
                                            <div
                                                key={task._id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, task)}
                                                className={`glass-card rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all hover:border-neutral-700 ${draggedTask?._id === task._id ? "opacity-50" : ""
                                                    } ${task.isBlocked ? "border-red-500/30" : ""}`}
                                            >
                                                {/* Priority & Blocked */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div
                                                        className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium}`}
                                                    />
                                                    <span className="text-xs text-gray-500">{task.priority}</span>
                                                    {task.isBlocked && (
                                                        <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
                                                            Blocked
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                                                    {task.title}
                                                </h4>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {/* Story Points */}
                                                        <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded">
                                                            {task.storyPoints || task.points} pts
                                                        </span>
                                                        {/* Hours */}
                                                        <span className="text-xs text-gray-500">
                                                            {task.estimatedHours}h
                                                        </span>
                                                    </div>

                                                    {/* Assignee */}
                                                    {task.assignedTo && (
                                                        <div
                                                            className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-xs text-white font-medium"
                                                            title={task.assignedTo.name}
                                                        >
                                                            {task.assignedTo.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Quick actions on hover */}
                                                <div className="mt-3 pt-3 border-t border-orange-100 opacity-0 hover:opacity-100 transition">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveFromSprint(task._id);
                                                        }}
                                                        className="text-xs text-red-600 hover:text-red-500"
                                                    >
                                                        Remove from sprint
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {columnTasks.length === 0 && (
                                            <div className="text-center py-8 text-gray-500 text-sm">
                                                Drop tasks here
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Backlog Panel */}
                {showBacklog && (
                    <div className="w-80 flex-shrink-0 border-l border-orange-100 bg-orange-50 p-4 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Backlog</h3>
                            <button
                                onClick={() => setShowBacklog(false)}
                                className="p-1 hover:bg-orange-100 rounded"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {backlog.map((task) => (
                                <div
                                    key={task._id}
                                    className="glass-card rounded-xl p-4 hover:border-neutral-700 transition"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium}`}
                                        />
                                        <span className="text-xs text-gray-500">{task.priority}</span>
                                    </div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                                        {task.title}
                                    </h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded">
                                            {task.storyPoints || task.points} pts
                                        </span>
                                        <button
                                            onClick={() => handleAddToSprint(task._id)}
                                            className="text-xs text-orange-600 hover:text-orange-500 flex items-center gap-1"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {backlog.length === 0 && (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    No tasks in backlog
                                </div>
                            )}
                        </div>

                        {/* Add new task link */}
                        <Link
                            href={`/dashboard/pm/tasks/new?projectId=${sprint.project?._id}&sprintId=${sprintId}`}
                            className="mt-4 w-full py-3 border border-dashed border-orange-200 rounded-xl text-sm text-gray-600 hover:text-gray-900 hover:border-orange-300 transition flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Task
                        </Link>
                    </div>
                )}
            </div>

            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
