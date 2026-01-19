"use client";

import { useState } from "react";

interface ProjectCardProps {
    project: {
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
    };
    onView: (projectId: string) => void;
    onEdit: (project: ProjectCardProps["project"]) => void;
}

export default function ProjectCard({ project, onView, onEdit }: ProjectCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    const statusColors = {
        Active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        "On Hold": "bg-amber-500/20 text-amber-400 border-amber-500/30",
        Completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        Archived: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div
            className="group relative bg-gradient-to-br from-neutral-900/90 to-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700/50 hover:border-orange-500/40 transition-all duration-300 overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                boxShadow: isHovered ? `0 0 30px ${project.color}15` : "none",
            }}
        >
            {/* Color accent bar */}
            <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: project.color }}
            />

            <div className="p-5 pt-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: project.color + "30", color: project.color }}
                        >
                            {project.key}
                        </div>
                        <div>
                            <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                                {project.name}
                            </h3>
                            <span
                                className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${statusColors[project.status]}`}
                            >
                                {project.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {project.description && (
                    <p className="text-sm text-neutral-400 line-clamp-2 mb-4">
                        {project.description}
                    </p>
                )}

                {/* Progress bar */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-neutral-400">Progress</span>
                        <span className="text-white font-medium">{project.taskStats.progress}%</span>
                    </div>
                    <div className="h-2 bg-neutral-700/50 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${project.taskStats.progress}%`,
                                backgroundColor: project.color,
                            }}
                        />
                    </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="text-center p-2 bg-neutral-800/50 rounded-lg">
                        <p className="text-lg font-bold text-white">{project.taskStats.total}</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Total</p>
                    </div>
                    <div className="text-center p-2 bg-neutral-800/50 rounded-lg">
                        <p className="text-lg font-bold text-orange-400">{project.taskStats.inProgress}</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Active</p>
                    </div>
                    <div className="text-center p-2 bg-neutral-800/50 rounded-lg">
                        <p className="text-lg font-bold text-emerald-400">{project.taskStats.completed}</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Done</p>
                    </div>
                    <div className="text-center p-2 bg-neutral-800/50 rounded-lg">
                        <p className="text-lg font-bold text-red-400">{project.taskStats.blocked}</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Blocked</p>
                    </div>
                </div>

                {/* Team members */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex -space-x-2">
                        {project.developers.slice(0, 4).map((dev, i) => (
                            <div
                                key={dev._id}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-xs font-medium border-2 border-neutral-900"
                                title={dev.name}
                            >
                                {dev.name.charAt(0).toUpperCase()}
                            </div>
                        ))}
                        {project.developers.length > 4 && (
                            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-white text-xs font-medium border-2 border-neutral-900">
                                +{project.developers.length - 4}
                            </div>
                        )}
                        {project.developers.length === 0 && (
                            <span className="text-xs text-neutral-500">No team assigned</span>
                        )}
                    </div>
                    <div className="text-xs text-neutral-500">
                        {formatDate(project.startDate)}
                        {project.targetEndDate && ` - ${formatDate(project.targetEndDate)}`}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onView(project._id)}
                        className="flex-1 py-2.5 text-sm font-semibold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                        View Board
                    </button>
                    <button
                        onClick={() => onEdit(project)}
                        className="px-4 py-2.5 text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800/50 hover:bg-neutral-700/50 rounded-xl border border-neutral-700/50 hover:border-neutral-600 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
