"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTeamStats, getDevelopers } from "@/app/actions/taskActions";
import { getQAStats, deleteQAMember } from "@/app/actions/qaActions";
import { deleteDeveloper } from "@/app/actions/userActions";
import TeamMemberCard from "./TeamMemberCard";
import QAMemberCard from "./QAMemberCard";
import AddMemberModal from "@/components/AddMemberModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import PerformanceComparisonChart from "@/components/PerformanceComparisonChart";

interface DeveloperStats {
    _id: string;
    name: string;
    email: string;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    totalPoints: number;
}

interface QAStats {
    _id: string;
    name: string;
    email: string;
    totalReviewed: number;
    approved: number;
    failed: number;
    pending: number;
    totalBugsFound: number;
    totalTimeSpent: number;
    totalPoints: number;
    passRate: number;
    avgReviewTime: number;
}

export default function TeamPageClient() {
    const router = useRouter();
    const [teamStats, setTeamStats] = useState<DeveloperStats[]>([]);
    const [qaStats, setQAStats] = useState<QAStats[]>([]);
    const [developers, setDevelopers] = useState<{ _id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"developers" | "qa" | "comparison">("developers");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [deletingDevId, setDeletingDevId] = useState<string | null>(null);
    const [deletingQAId, setDeletingQAId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [confirmDeleteType, setConfirmDeleteType] = useState<"developer" | "qa">("developer");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
        const [teamRes, devsRes, qaRes] = await Promise.all([
            getTeamStats(),
            getDevelopers(),
            getQAStats(),
        ]);

        if (teamRes.success) setTeamStats(teamRes.stats || []);
        if (devsRes.success) setDevelopers(devsRes.developers || []);
        if (qaRes.success) setQAStats(qaRes.stats || []);

        setLoading(false);
    }

    function showToast(message: string, type: "success" | "error") {
        setToast({ message, type });
    }

    function handleMemberCreated(message: string) {
        showToast(message, "success");
        loadData();
    }

    function handleDeleteDeveloper(developerId: string) {
        setConfirmDeleteId(developerId);
        setConfirmDeleteType("developer");
    }

    function handleDeleteQA(qaId: string) {
        setConfirmDeleteId(qaId);
        setConfirmDeleteType("qa");
    }

    async function executeDelete() {
        if (!confirmDeleteId) return;

        const id = confirmDeleteId;
        setConfirmDeleteId(null); // Close modal

        if (confirmDeleteType === "developer") {
            setDeletingDevId(id);
            const result = await deleteDeveloper(id);
            if (result.success) {
                showToast("Developer deleted successfully", "success");
            } else {
                showToast(result.error || "Failed to delete developer", "error");
            }
            setDeletingDevId(null);
        } else {
            setDeletingQAId(id);
            const result = await deleteQAMember(id);
            if (result.success) {
                showToast("QA member deleted successfully", "success");
            } else {
                showToast(result.error || "Failed to delete QA member", "error");
            }
            setDeletingQAId(null);
        }
        await loadData();
    }

    if (loading) {
        return (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <div className="skeleton h-10 w-64 mb-2"></div>
                    <div className="skeleton h-5 w-96"></div>
                </div>
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
                        <span className="gradient-text-fire">Team Overview</span>
                    </h1>
                    <p className="text-gray-600">
                        {teamStats.length} developer{teamStats.length !== 1 ? "s" : ""} · {qaStats.length} QA member{qaStats.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-orange-500/25 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Member
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab("developers")}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${activeTab === "developers"
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Developers ({teamStats.length})
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("qa")}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${activeTab === "qa"
                        ? "border-purple-500 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        QA Team ({qaStats.length})
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("comparison")}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${activeTab === "comparison"
                        ? "border-teal-500 text-teal-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Performance Comparison
                    </span>
                </button>
            </div>

            {/* Developers Tab */}
            {activeTab === "developers" && (
                <>
                    {teamStats.length === 0 ? (
                        <div className="text-center py-16 bg-orange-50 rounded-xl border border-orange-100 animate-slide-up">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white border border-orange-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-600 text-lg mb-2">No developers with assigned tasks</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-slide-up">
                            {teamStats.map((dev) => (
                                <TeamMemberCard
                                    key={dev._id}
                                    developer={dev}
                                    onAssignTask={(developerId) => {
                                        router.push(`/dashboard/pm/tasks/new?assignedTo=${developerId}`);
                                    }}
                                    onDeleteDeveloper={handleDeleteDeveloper}
                                    isDeleting={deletingDevId === dev._id}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* QA Tab */}
            {activeTab === "qa" && (
                <>
                    {qaStats.length === 0 ? (
                        <div className="text-center py-16 bg-purple-50 rounded-xl border border-purple-100 animate-slide-up">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white border border-purple-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-600 text-lg mb-2">No QA members with review activity</p>
                            <p className="text-gray-500 text-sm">QA members will appear here once they start reviewing tasks</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-slide-up">
                            {qaStats.map((qa) => (
                                <QAMemberCard
                                    key={qa._id}
                                    qa={qa}
                                    onDeleteQA={handleDeleteQA}
                                    isDeleting={deletingQAId === qa._id}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Comparison Tab */}
            {activeTab === "comparison" && (
                <div className="animate-slide-up">
                    <PerformanceComparisonChart
                        developerStats={teamStats}
                        qaStats={qaStats}
                    />
                </div>
            )}

            <AddMemberModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleMemberCreated}
            />

            <ConfirmationModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={executeDelete}
                title={confirmDeleteType === "developer" ? "Delete Developer?" : "Delete QA Member?"}
                message={confirmDeleteType === "developer"
                    ? "Are you sure you want to delete this developer? All their tasks and data will be permanently removed. This action cannot be undone."
                    : "Are you sure you want to delete this QA member? All their review data will be permanently removed. This action cannot be undone."
                }
                confirmText={confirmDeleteType === "developer" ? "Delete Developer" : "Delete QA Member"}
            />
        </main>

    );
}
