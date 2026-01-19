"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createProject } from "@/app/actions/projectActions";
import { getDevelopers } from "@/app/actions/taskActions";

interface Developer {
    _id: string;
    name: string;
    email: string;
}

const PROJECT_COLORS = [
    "#f97316", // Orange
    "#ef4444", // Red
    "#22c55e", // Green
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#14b8a6", // Teal
    "#f59e0b", // Amber
    "#6366f1", // Indigo
    "#84cc16", // Lime
];

export default function NewProjectPageClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [developers, setDevelopers] = useState<Developer[]>([]);
    const [loadingDevelopers, setLoadingDevelopers] = useState(true);

    // Form state
    const [name, setName] = useState("");
    const [key, setKey] = useState("");
    const [description, setDescription] = useState("");
    const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
    const [selectedDevs, setSelectedDevs] = useState<string[]>([]);
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [targetEndDate, setTargetEndDate] = useState("");

    useEffect(() => {
        async function loadDevelopers() {
            const result = await getDevelopers();
            if (result.success) {
                setDevelopers(result.developers || []);
            }
            setLoadingDevelopers(false);
        }
        loadDevelopers();
    }, []);

    // Auto-generate key from name
    useEffect(() => {
        if (name && !key) {
            const generatedKey = name
                .split(" ")
                .map((word) => word.charAt(0))
                .join("")
                .toUpperCase()
                .substring(0, 4);
            setKey(generatedKey);
        }
    }, [name, key]);

    const toggleDeveloper = (devId: string) => {
        setSelectedDevs((prev) =>
            prev.includes(devId) ? prev.filter((id) => id !== devId) : [...prev, devId]
        );
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("name", name);
        formData.append("key", key.toUpperCase());
        formData.append("description", description);
        formData.append("color", selectedColor);
        formData.append("startDate", startDate);
        if (targetEndDate) formData.append("targetEndDate", targetEndDate);
        selectedDevs.forEach((devId) => formData.append("developers", devId));

        const result = await createProject(formData);

        if (result.success) {
            router.push("/dashboard/pm?tab=projects");
        } else {
            setError(result.error || "Failed to create project");
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link
                        href="/dashboard/pm"
                        className="text-neutral-400 hover:text-white transition flex items-center gap-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </Link>
                </div>

                {/* Form Card */}
                <div className="glass-card rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: selectedColor }}
                        >
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Create New Project</h1>
                            <p className="text-neutral-400">Start a new project to organize your work</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name & Key */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Project Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="input-premium w-full"
                                    placeholder="e.g., Mobile App Development"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Key * <span className="text-neutral-500">(2-6 letters)</span>
                                </label>
                                <input
                                    type="text"
                                    value={key}
                                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                                    required
                                    maxLength={6}
                                    minLength={2}
                                    pattern="[A-Za-z]+"
                                    className="input-premium w-full uppercase"
                                    placeholder="MOB"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="input-premium w-full resize-none"
                                placeholder="Brief description of the project..."
                            />
                        </div>

                        {/* Color Picker */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Project Color
                            </label>
                            <div className="flex gap-3 flex-wrap">
                                {PROJECT_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-10 h-10 rounded-xl transition-all ${selectedColor === color
                                                ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110"
                                                : "hover:scale-105"
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Start Date *
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                    className="input-premium w-full [color-scheme:dark]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Target End Date
                                </label>
                                <input
                                    type="date"
                                    value={targetEndDate}
                                    onChange={(e) => setTargetEndDate(e.target.value)}
                                    min={startDate}
                                    className="input-premium w-full [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        {/* Team Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Team Members
                            </label>
                            {loadingDevelopers ? (
                                <div className="p-4 bg-black/20 border border-neutral-700/50 rounded-xl">
                                    <div className="animate-pulse flex gap-2">
                                        <div className="h-8 w-24 skeleton rounded-lg" />
                                        <div className="h-8 w-20 skeleton rounded-lg" />
                                        <div className="h-8 w-28 skeleton rounded-lg" />
                                    </div>
                                </div>
                            ) : developers.length === 0 ? (
                                <div className="p-4 bg-black/20 border border-neutral-700/50 rounded-xl text-neutral-500 text-sm">
                                    No developers available. They will be able to join once registered.
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2 p-4 bg-black/20 border border-neutral-700/50 rounded-xl max-h-48 overflow-y-auto">
                                    {developers.map((dev) => (
                                        <button
                                            key={dev._id}
                                            type="button"
                                            onClick={() => toggleDeveloper(dev._id)}
                                            className={`px-4 py-2 text-sm rounded-xl border transition-all flex items-center gap-2 ${selectedDevs.includes(dev._id)
                                                    ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                                                    : "bg-neutral-800/50 border-neutral-700/50 text-neutral-300 hover:border-neutral-600"
                                                }`}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-xs text-white font-medium">
                                                {dev.name.charAt(0).toUpperCase()}
                                            </div>
                                            {dev.name}
                                            {selectedDevs.includes(dev._id) && (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {selectedDevs.length > 0 && (
                                <p className="text-xs text-neutral-500 mt-2">
                                    {selectedDevs.length} developer(s) selected
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-4 pt-4 border-t border-neutral-800">
                            <Link href="/dashboard/pm" className="btn-ghost">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create Project
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
