"use client";

import { useState } from "react";

interface Developer {
    _id: string;
    name: string;
}

interface AdvancedFiltersProps {
    developers: Developer[];
    filters: {
        status: string;
        developer: string;
        complexity: string;
        blocked: string;
        search: string;
        sortBy: string;
    };
    onFiltersChange: (filters: AdvancedFiltersProps["filters"]) => void;
}

export default function AdvancedFilters({
    developers,
    filters,
    onFiltersChange,
}: AdvancedFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasActiveFilters =
        filters.status !== "all" ||
        filters.developer !== "all" ||
        filters.complexity !== "all" ||
        filters.blocked !== "all" ||
        filters.search !== "";

    function clearFilters() {
        onFiltersChange({
            status: "all",
            developer: "all",
            complexity: "all",
            blocked: "all",
            search: "",
            sortBy: "newest",
        });
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 mb-6">
            {/* Search Bar & Toggle */}
            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                    <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                        placeholder="Search tasks..."
                        className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    />
                </div>

                {/* Sort */}
                <select
                    value={filters.sortBy}
                    onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value })}
                    className="px-3 py-2.5 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="priority">Priority (High→Low)</option>
                    <option value="hours">Hours Estimated</option>
                </select>

                {/* Filter Toggle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition ${isExpanded || hasActiveFilters
                        ? "bg-orange-600/20 border-orange-500/50 text-orange-300"
                        : "bg-black/20 border-white/10 text-slate-300 hover:border-white/20"
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                    {hasActiveFilters && (
                        <span className="px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">!</span>
                    )}
                </button>
            </div>

            {/* Expanded Filters */}
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
                                className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                            >
                                <option value="all">All Status</option>
                                <option value="Todo">Todo</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Pending Review">Pending Review</option>
                                <option value="Completed">Completed</option>
                                <option value="Changes Requested">Changes Requested</option>
                            </select>
                        </div>

                        {/* Developer Filter */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Developer</label>
                            <select
                                value={filters.developer}
                                onChange={(e) => onFiltersChange({ ...filters, developer: e.target.value })}
                                className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                            >
                                <option value="all">All Developers</option>
                                {developers.map((dev) => (
                                    <option key={dev._id} value={dev._id}>
                                        {dev.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Complexity Filter */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Complexity</label>
                            <select
                                value={filters.complexity}
                                onChange={(e) => onFiltersChange({ ...filters, complexity: e.target.value })}
                                className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                            >
                                <option value="all">All Complexity</option>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>

                        {/* Blocked Filter */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Blocked State</label>
                            <select
                                value={filters.blocked}
                                onChange={(e) => onFiltersChange({ ...filters, blocked: e.target.value })}
                                className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                            >
                                <option value="all">All Tasks</option>
                                <option value="blocked">Blocked Only</option>
                                <option value="not-blocked">Not Blocked</option>
                            </select>
                        </div>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={clearFilters}
                                className="text-sm text-slate-400 hover:text-white transition"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
