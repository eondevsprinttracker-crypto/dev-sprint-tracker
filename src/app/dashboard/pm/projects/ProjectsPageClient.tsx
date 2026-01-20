"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getProjects } from "@/app/actions/projectActions";
import { getDevelopers } from "@/app/actions/taskActions";
import ProjectCard from "../ProjectCard";

interface Project {
    _id: string;
    name: string;
    key: string;
    description: string;
    status: "Active" | "On Hold" | "Completed" | "Archived";
    color: string;
    startDate: string;
    targetEndDate?: string;
    developers: { _id: string; name: string; email: string }[];
    taskStats: {
        total: number;
        completed: number;
        inProgress: number;
        blocked: number;
        progress: number;
    };
}

export default function ProjectsPageClient() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [developers, setDevelopers] = useState<{ _id: string; name: string; email: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        loadProjects();
    }, []);

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    async function loadProjects() {
        setLoading(true);
        const [projectsRes, devsRes] = await Promise.all([
            getProjects(),
            getDevelopers(),
        ]);
        if (projectsRes.success) {
            setProjects(projectsRes.projects || []);
        }
        if (devsRes.success) {
            setDevelopers(devsRes.developers || []);
        }
        setLoading(false);
    }

    function showToast(message: string, type: "success" | "error") {
        setToast({ message, type });
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
                        <div key={i} className="skeleton-card h-48 rounded-xl"></div>
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
                        <span className="gradient-text-fire">Projects</span>
                    </h1>
                    <p className="text-gray-600">
                        {projects.length} project{projects.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <Link
                    href="/dashboard/pm/projects/new"
                    className="btn-primary flex items-center gap-2 px-5 py-2.5"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-semibold">New Project</span>
                </Link>
            </div>

            {/* Projects Content */}
            {projects.length === 0 ? (
                <div className="text-center py-16 bg-orange-50 rounded-xl border border-orange-100 animate-slide-up">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white border border-orange-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <p className="text-gray-700 text-lg mb-2">No projects yet</p>
                    <p className="text-gray-500 text-sm mb-4">Create your first project to organize tasks</p>
                    <Link
                        href="/dashboard/pm/projects/new"
                        className="btn-primary px-6 py-2 inline-flex items-center"
                    >
                        Create Project
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-slide-up">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project._id}
                            project={project}
                            onView={() => router.push(`/dashboard/pm/projects/${project._id}`)}
                            onEdit={() => { }} // Handled by Link in ProjectCard
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
