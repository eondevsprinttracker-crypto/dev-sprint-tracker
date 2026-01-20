"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllTasks, getDevelopers, updateStatus } from "@/app/actions/taskActions";
import PMTaskCard from "./PMTaskCard";
import AdvancedFilters from "./AdvancedFilters";
import TaskDetailModal from "@/components/TaskDetailModal";

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

export default function AllTasksPageClient() {
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [developers, setDevelopers] = useState<{ _id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewTaskId, setViewTaskId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Filter state
    const [filters, setFilters] = useState({
        status: "all",
        developer: "all",
        complexity: "all",
        blocked: "all",
        search: "",
        sortBy: "newest",
    });

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

    async function loadData() {
        setLoading(true);
        const [tasksRes, devsRes] = await Promise.all([
            getAllTasks(),
            getDevelopers(),
        ]);

        if (tasksRes.success) setAllTasks(tasksRes.tasks || []);
        if (devsRes.success) setDevelopers(devsRes.developers || []);

        setLoading(false);
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

    // Filter tasks
    const filteredTasks = allTasks.filter((task) => {
        if (filters.status !== "all" && task.status !== filters.status) return false;
        if (filters.developer !== "all" && task.assignedTo?._id !== filters.developer) return false;
        if (filters.complexity !== "all" && task.complexity !== filters.complexity) return false;
        if (filters.blocked === "blocked" && !task.isBlocked) return false;
        if (filters.blocked === "not-blocked" && task.isBlocked) return false;
        if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
    }).sort((a, b) => {
        switch (filters.sortBy) {
            case "oldest":
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case "priority":
                const priority = { Hard: 3, Medium: 2, Easy: 1 };
                return (priority[b.complexity as keyof typeof priority] || 0) - (priority[a.complexity as keyof typeof priority] || 0);
            case "hours":
                return b.estimatedHours - a.estimatedHours;
            default: // newest
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    if (loading) {
        return (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <div className="skeleton h-10 w-64 mb-2"></div>
                    <div className="skeleton h-5 w-96"></div>
                </div>
                <div className="skeleton h-20 w-full rounded-xl mb-6"></div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton-card h-64 rounded-xl"></div>
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
                        <span className="gradient-text-fire">All Tasks</span>
                    </h1>
                    <p className="text-gray-600">
                        Showing {filteredTasks.length} of {allTasks.length} tasks
                    </p>
                </div>
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

            {/* Filters */}
            <div className="mb-6 animate-slide-up">
                <AdvancedFilters
                    developers={developers}
                    filters={filters}
                    onFiltersChange={setFilters}
                />
            </div>

            {/* Tasks Content */}
            {filteredTasks.length === 0 ? (
                <div className="text-center py-16 bg-orange-50 rounded-xl border border-orange-100 animate-slide-up">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white border border-orange-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <p className="text-gray-700 text-lg mb-2">No tasks found</p>
                    <p className="text-gray-500 text-sm">Try adjusting your filters or create a new task</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-slide-up">
                    {filteredTasks.map((task) => (
                        <PMTaskCard
                            key={task._id}
                            task={task}
                            onView={setViewTaskId}
                            onApprove={task.status === "Pending Review" ? handleApprove : undefined}
                            onReject={task.status === "Pending Review" ? handleReject : undefined}
                            actionLoading={actionLoading}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}


            <TaskDetailModal
                taskId={viewTaskId}
                onClose={() => {
                    setViewTaskId(null);
                    loadData();
                }}
            />
        </main>
    );
}
