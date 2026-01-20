"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTeamStats, getDevelopers } from "@/app/actions/taskActions";
import { deleteDeveloper } from "@/app/actions/userActions";
import TeamMemberCard from "./TeamMemberCard";
import ConfirmationModal from "@/components/ConfirmationModal";

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

export default function TeamPageClient() {
    const router = useRouter();
    const [teamStats, setTeamStats] = useState<DeveloperStats[]>([]);
    const [developers, setDevelopers] = useState<{ _id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingDevId, setDeletingDevId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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
        const [teamRes, devsRes] = await Promise.all([
            getTeamStats(),
            getDevelopers(),
        ]);

        if (teamRes.success) setTeamStats(teamRes.stats || []);
        if (devsRes.success) setDevelopers(devsRes.developers || []);

        setLoading(false);
    }

    function showToast(message: string, type: "success" | "error") {
        setToast({ message, type });
    }

    async function handleDeleteDeveloper(developerId: string) {
        setConfirmDeleteId(developerId);
    }

    async function executeDeleteDeveloper() {
        if (!confirmDeleteId) return;

        const developerId = confirmDeleteId;
        setConfirmDeleteId(null); // Close modal
        setDeletingDevId(developerId); // Show loading state

        const result = await deleteDeveloper(developerId);
        if (result.success) {
            showToast("Developer deleted successfully", "success");
        } else {
            showToast(result.error || "Failed to delete developer", "error");
        }
        await loadData();
        setDeletingDevId(null);
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
                    <p className="text-gray-600">{teamStats.length} developer{teamStats.length !== 1 ? "s" : ""}</p>
                </div>
            </div>

            {/* Team Content */}
            {teamStats.length === 0 ? (
                <div className="text-center py-16 bg-orange-50 rounded-xl border border-orange-100 animate-slide-up">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white border border-orange-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-600 text-lg mb-2">No team members with assigned tasks</p>
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



            <ConfirmationModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={executeDeleteDeveloper}
                title="Delete Developer?"
                message="Are you sure you want to delete this developer? All their tasks and data will be permanently removed. This action cannot be undone."
                confirmText="Delete Developer"
            />
        </main>
    );
}
