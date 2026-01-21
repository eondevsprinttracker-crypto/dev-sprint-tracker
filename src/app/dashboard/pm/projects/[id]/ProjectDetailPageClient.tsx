"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProjectById, getTasksByProject } from "@/app/actions/projectActions";
import { updateStatus } from "@/app/actions/taskActions";
// We might need to replace TaskDetailModal with a page link or keep it for now if inside a sub-view
import TaskDetailModal from "@/components/TaskDetailModal"; // Consider removing/replacing later
import { formatDuration } from "@/lib/utils";

interface ProjectDetailPageClientProps {
    projectId: string;
    // We can fetch data client side or pass initial data. 
    // Given the previous component fetched data, we can keep fetching or pass from server.
    // Let's stick to fetching to reuse logic for now, or pass initial data if server component fetched it.
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
    category?: string;
    priority?: string;
    visibility?: string;
    riskLevel?: string;
    budget?: number;
    client?: string;
    repository?: string;
    tags?: string[];
    notes?: string;
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

type TabType = "details" | "kanban" | "list" | "team";

const CATEGORY_ICONS: Record<string, string> = {
    Web: "🌐",
    Mobile: "📱",
    Desktop: "🖥️",
    API: "⚡",
    Data: "📊",
    DevOps: "🔧",
    Other: "📦",
};

const PRIORITY_COLORS: Record<string, string> = {
    Low: "bg-gray-100 text-gray-700",
    Medium: "bg-blue-100 text-blue-700",
    High: "bg-amber-100 text-amber-700",
    Critical: "bg-red-100 text-red-700",
};

const RISK_COLORS: Record<string, string> = {
    Low: "bg-emerald-100 text-emerald-700",
    Medium: "bg-amber-100 text-amber-700",
    High: "bg-red-100 text-red-700",
};

const KANBAN_COLUMNS = [
    { key: "Todo", label: "To Do", color: "border-neutral-500", bgColor: "bg-neutral-500/10" },
    { key: "In Progress", label: "In Progress", color: "border-orange-500", bgColor: "bg-orange-500/10" },
    { key: "Pending Review", label: "Review", color: "border-amber-500", bgColor: "bg-amber-500/10" },
    { key: "Completed", label: "Completed", color: "border-emerald-500", bgColor: "bg-emerald-500/10" },
];

export default function ProjectDetailPageClient({ projectId }: ProjectDetailPageClientProps) {
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("details");

    // Instead of modal, we should probably link to task detail page, but for quick actions in kanban, 
    // maybe we keep modal or just simple navigation.
    // Let's keep modal for now to minimize friction, or switch to link. 
    // The objective is to make sidebar visible. A modal ON TOP of a page with sidebar is fine? 
    // The user said "ensure sidebar remains visible when accessing forms... integrating forms SEAMLESSLY AS STANDARD PAGES".
    // Task Detail is a "view", not strictly a "form". 
    // But earlier I created Task Detail Page. So I should use it.

    // const [viewTaskId, setViewTaskId] = useState<string | null>(null); // Replaced with Link
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const loadData = useCallback(async () => {
        // setLoading(true); // Don't full reload UI on refresh
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

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    function showToast(message: string, type: "success" | "error") {
        setToast({ message, type });
    }

    // Keyboard shortcuts
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            // if (e.key === "Escape") router.back(); // Standard browser back is better
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

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
            return tasks.filter(t => t.status === "Todo" || t.status === "Changes Requested");
        }
        return tasks.filter((t) => t.status === status);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <p className="text-red-400 mb-4">Project not found</p>
                    <Link href="/dashboard/pm/projects" className="btn-primary px-6 py-2">
                        Back to Projects
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-80px)]">
            {/* Header - No longer fixed, just part of layout */}
            <header className="flex-shrink-0 mb-6">
                {/* Toast Notification */}
                {toast && (
                    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl animate-slide-up flex items-center gap-3 ${toast.type === "success"
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-emerald-500/25"
                        : "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-500/25"
                        }`}>
                        <span className="text-sm font-medium">{toast.message}</span>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard/pm/projects"
                            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-orange-50 rounded-lg transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: project.color }}
                            >
                                {project.key}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                                <p className="text-sm text-gray-600">
                                    {project.taskStats.total} tasks • {project.taskStats.progress}% complete
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex gap-1 p-1 bg-orange-50 border border-orange-100 rounded-lg">
                            {(["details", "kanban", "list", "team"] as TabType[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === tab
                                        ? "bg-orange-100 text-orange-700"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-orange-100"
                                        }`}
                                >
                                    {tab === "details" && "Details"}
                                    {tab === "kanban" && "Board"}
                                    {tab === "list" && "List"}
                                    {tab === "team" && "Team"}
                                </button>
                            ))}
                        </div>

                        <Link
                            href={`/dashboard/pm/tasks/new?projectId=${projectId}`}
                            className="btn-primary flex items-center gap-2 px-4 py-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Task
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 overflow-hidden flex flex-col">
                {/* Progress bar */}
                <div className="h-1 bg-orange-100 rounded-full overflow-hidden mb-6 flex-shrink-0">
                    <div
                        className="h-full transition-all duration-500"
                        style={{
                            width: `${project.taskStats.progress}%`,
                            backgroundColor: project.color,
                        }}
                    />
                </div>

                <div className="flex-1 overflow-auto min-h-0">
                    {activeTab === "details" && (
                        <div className="bg-white rounded-xl border border-orange-100 p-6 space-y-6">
                            {/* Project Info Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {project.category && (
                                    <div className="p-4 bg-orange-50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Category</p>
                                        <p className="font-medium text-gray-900 flex items-center gap-2">
                                            <span>{CATEGORY_ICONS[project.category] || "📦"}</span>
                                            {project.category}
                                        </p>
                                    </div>
                                )}
                                {project.priority && (
                                    <div className="p-4 bg-orange-50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Priority</p>
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-sm font-medium ${PRIORITY_COLORS[project.priority] || "bg-gray-100 text-gray-700"}`}>
                                            {project.priority}
                                        </span>
                                    </div>
                                )}
                                {project.riskLevel && (
                                    <div className="p-4 bg-orange-50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Risk Level</p>
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-sm font-medium ${RISK_COLORS[project.riskLevel] || "bg-gray-100 text-gray-700"}`}>
                                            {project.riskLevel} Risk
                                        </span>
                                    </div>
                                )}
                                {project.visibility && (
                                    <div className="p-4 bg-orange-50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Visibility</p>
                                        <p className="font-medium text-gray-900">
                                            {project.visibility === "Private" && "🔒 "}
                                            {project.visibility === "Team" && "👥 "}
                                            {project.visibility === "Public" && "🌍 "}
                                            {project.visibility}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Budget, Client, Repository */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {project.budget !== undefined && project.budget > 0 && (
                                    <div className="p-4 border border-orange-200 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Budget</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            ${project.budget.toLocaleString()}
                                        </p>
                                    </div>
                                )}
                                {project.client && (
                                    <div className="p-4 border border-orange-200 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Client</p>
                                        <p className="font-medium text-gray-900">{project.client}</p>
                                    </div>
                                )}
                                {project.repository && (
                                    <div className="p-4 border border-orange-200 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Repository</p>
                                        <a
                                            href={project.repository}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            Open Repository
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Tags */}
                            {project.tags && project.tags.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tags</p>
                                    <div className="flex flex-wrap gap-2">
                                        {project.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 text-sm font-medium"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {project.description && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Description</p>
                                    <div
                                        className="prose prose-sm max-w-none text-gray-700 bg-orange-50/50 rounded-xl p-4"
                                        dangerouslySetInnerHTML={{ __html: project.description }}
                                    />
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 border border-orange-200 rounded-xl">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Start Date</p>
                                    <p className="font-medium text-gray-900">
                                        {new Date(project.startDate).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                                {project.targetEndDate && (
                                    <div className="p-4 border border-orange-200 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Target End Date</p>
                                        <p className="font-medium text-gray-900">
                                            {new Date(project.targetEndDate).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Edit Button */}
                            <div className="pt-4 border-t border-orange-100">
                                <Link
                                    href={`/dashboard/pm/projects/${projectId}/edit`}
                                    className="btn-primary inline-flex items-center gap-2 px-4 py-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit Project
                                </Link>
                            </div>
                        </div>
                    )}

                    {activeTab === "kanban" && (
                        <div className="grid grid-cols-4 gap-4 h-full min-w-[1000px] pr-2">
                            {KANBAN_COLUMNS.map((column) => (
                                <div
                                    key={column.key}
                                    className={`flex flex-col rounded-xl border-t-2 ${column.color} ${column.bgColor} backdrop-blur h-full`}
                                >
                                    <div className="flex items-center justify-between p-4 border-b border-orange-100">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">{column.label}</span>
                                            <span className="px-2 py-0.5 text-xs font-medium bg-white border border-orange-100 text-gray-600 rounded-full">
                                                {getTasksByStatus(column.key).length}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                        {getTasksByStatus(column.key).length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 text-sm">
                                                No tasks
                                            </div>
                                        ) : (
                                            getTasksByStatus(column.key).map((task) => (
                                                <Link
                                                    href={`/dashboard/pm/tasks/${task._id}`}
                                                    key={task._id}
                                                    className={`block bg-white rounded-xl border border-orange-100 p-4 hover:border-orange-200 transition-all cursor-pointer group ${task.isBlocked ? "border-l-4 border-l-red-500" : ""
                                                        }`}
                                                >
                                                    {task.isBlocked && (
                                                        <div className="flex items-center gap-1.5 text-xs text-red-400 mb-2">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Blocked
                                                        </div>
                                                    )}

                                                    {task.status === "Changes Requested" && (
                                                        <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-2">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                            </svg>
                                                            Changes Requested
                                                        </div>
                                                    )}

                                                    <h4 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 mb-2">
                                                        {task.title}
                                                    </h4>

                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                                        <span
                                                            className={`px-2 py-0.5 rounded font-medium ${task.complexity === "Hard"
                                                                ? "bg-red-50 text-red-600"
                                                                : task.complexity === "Medium"
                                                                    ? "bg-amber-50 text-amber-600"
                                                                    : "bg-emerald-50 text-emerald-600"
                                                                }`}
                                                        >
                                                            {task.complexity}
                                                        </span>
                                                        <span>{task.points} pts</span>
                                                    </div>

                                                    {task.assignedTo && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-xs font-medium">
                                                                {task.assignedTo.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-xs text-gray-600 truncate">
                                                                {task.assignedTo.name}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {column.key === "Pending Review" && (
                                                        <div
                                                            className="flex gap-2 mt-3 pt-3 border-t border-orange-100"
                                                            onClick={(e) => e.preventDefault()} // Prevent Link navigation when clicking buttons
                                                        >
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    handleApprove(task._id);
                                                                }}
                                                                disabled={actionLoading === task._id}
                                                                className="flex-1 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition disabled:opacity-50"
                                                            >
                                                                {actionLoading === task._id ? "..." : "Approve"}
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    handleReject(task._id);
                                                                }}
                                                                disabled={actionLoading === task._id}
                                                                className="flex-1 py-1.5 text-xs font-medium bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition disabled:opacity-50"
                                                            >
                                                                {actionLoading === task._id ? "..." : "Changes"}
                                                            </button>
                                                        </div>
                                                    )}
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "list" && (
                        <div className="bg-white rounded-xl border border-orange-100 overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-orange-100">
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Task</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Assignee</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Complexity</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Est. Hours</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map((task) => (
                                        <tr
                                            key={task._id}
                                            className="border-b border-orange-100 hover:bg-orange-50 cursor-pointer transition"
                                            onClick={() => router.push(`/dashboard/pm/tasks/${task._id}`)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {task.isBlocked && (
                                                        <span className="w-2 h-2 bg-red-500 rounded-full" title="Blocked" />
                                                    )}
                                                    <span className="text-gray-900 font-medium">{task.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {task.assignedTo?.name || "Unassigned"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-2 py-1 text-xs rounded-full ${task.status === "Completed"
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : task.status === "In Progress"
                                                            ? "bg-orange-50 text-orange-700"
                                                            : task.status === "Pending Review"
                                                                ? "bg-amber-50 text-amber-700"
                                                                : "bg-gray-50 text-gray-600"
                                                        }`}
                                                >
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{task.complexity}</td>
                                            <td className="px-4 py-3 text-gray-600">{task.estimatedHours}h</td>
                                        </tr>
                                    ))}
                                    {tasks.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                                                No tasks in this project yet
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === "team" && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {project.developers.map((dev) => {
                                const devTasks = tasks.filter((t) => t.assignedTo?._id === dev._id);
                                const completed = devTasks.filter((t) => t.status === "Completed").length;
                                const inProgress = devTasks.filter((t) => t.status === "In Progress").length;
                                const blocked = devTasks.filter((t) => t.isBlocked).length;

                                return (
                                    <div
                                        key={dev._id}
                                        className="bg-white rounded-xl border border-orange-100 p-5"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-lg">
                                                {dev.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{dev.name}</h3>
                                                <p className="text-sm text-gray-600">{dev.email}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="text-center p-2 bg-orange-50 rounded-lg">
                                                <p className="text-lg font-bold text-gray-900">{devTasks.length}</p>
                                                <p className="text-[10px] text-gray-500 uppercase">Total</p>
                                            </div>
                                            <div className="text-center p-2 bg-orange-50 rounded-lg">
                                                <p className="text-lg font-bold text-orange-600">{inProgress}</p>
                                                <p className="text-[10px] text-gray-500 uppercase">Active</p>
                                            </div>
                                            <div className="text-center p-2 bg-emerald-50 rounded-lg">
                                                <p className="text-lg font-bold text-emerald-600">{completed}</p>
                                                <p className="text-[10px] text-gray-500 uppercase">Done</p>
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
                                <div className="col-span-full text-center py-12 text-gray-500">
                                    No team members assigned to this project
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>


        </div>
    );
}
