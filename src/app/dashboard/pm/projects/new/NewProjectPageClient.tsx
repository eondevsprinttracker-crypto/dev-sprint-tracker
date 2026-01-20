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
    "#f97316", "#ef4444", "#22c55e", "#3b82f6",
    "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b",
    "#6366f1", "#84cc16",
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
        <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/30 to-white p-6 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Premium Form Container */}
                <div className="form-container-premium animate-fade-in">
                    {/* Premium Header */}
                    <div className="form-header-premium">
                        <div
                            className="form-header-icon"
                            style={{ background: `linear-gradient(135deg, ${selectedColor} 0%, ${selectedColor}cc 100%)` }}
                        >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div className="form-header-content">
                            <h1>Create New Project</h1>
                            <p>Start a new project to organize your work and team</p>
                        </div>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="alert-premium-error">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Project Details Section */}
                        <div className="section-divider-premium">
                            <h3>Project Details</h3>
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="form-label-premium">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                        Project Name <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="input-stunning"
                                        placeholder="e.g., Mobile App Development"
                                    />
                                </div>
                                <div>
                                    <label className="form-label-premium">
                                        Key <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={key}
                                        onChange={(e) => setKey(e.target.value.toUpperCase())}
                                        required
                                        maxLength={6}
                                        minLength={2}
                                        pattern="[A-Za-z]+"
                                        className="input-stunning uppercase font-mono tracking-wider"
                                        placeholder="MOB"
                                    />
                                    <p className="form-help-text">2-6 letters</p>
                                </div>
                            </div>

                            <div>
                                <label className="form-label-premium">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="textarea-stunning"
                                    placeholder="Brief description of the project..."
                                />
                                <p className="form-help-text">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Describe the project&apos;s purpose and goals
                                </p>
                            </div>
                        </div>

                        {/* Visual Identity Section */}
                        <div className="section-divider-premium">
                            <h3>Visual Identity</h3>
                        </div>

                        <div>
                            <label className="form-label-premium">
                                Project Color
                            </label>
                            <div className="color-picker-premium">
                                {PROJECT_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setSelectedColor(color)}
                                        className={selectedColor === color ? "selected" : ""}
                                        style={{ backgroundColor: color }}
                                        title={`Select ${color}`}
                                    />
                                ))}
                            </div>
                            <p className="form-help-text mt-3">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                This color will help identify the project across the system
                            </p>
                        </div>

                        {/* Timeline Section */}
                        <div className="section-divider-premium">
                            <h3>Timeline</h3>
                        </div>

                        <div className="form-field-group">
                            <div>
                                <label className="form-label-premium">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Start Date <span className="required">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                    className="input-stunning"
                                />
                            </div>
                            <div>
                                <label className="form-label-premium">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                    Target End Date
                                </label>
                                <input
                                    type="date"
                                    value={targetEndDate}
                                    onChange={(e) => setTargetEndDate(e.target.value)}
                                    min={startDate}
                                    className="input-stunning"
                                />
                            </div>
                        </div>

                        {/* Team Selection Section */}
                        <div className="section-divider-premium">
                            <h3>Team</h3>
                        </div>

                        <div>
                            <label className="form-label-premium">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Team Members
                            </label>
                            {loadingDevelopers ? (
                                <div className="team-chips-premium animate-pulse">
                                    <div className="h-10 w-32 skeleton rounded-xl" />
                                    <div className="h-10 w-28 skeleton rounded-xl" />
                                    <div className="h-10 w-36 skeleton rounded-xl" />
                                </div>
                            ) : developers.length === 0 ? (
                                <div className="info-card-premium">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <p>No developers available. They will be able to join once registered.</p>
                                </div>
                            ) : (
                                <div className="team-chips-premium">
                                    {developers.map((dev) => (
                                        <button
                                            key={dev._id}
                                            type="button"
                                            onClick={() => toggleDeveloper(dev._id)}
                                            className={`team-chip-premium ${selectedDevs.includes(dev._id) ? "selected" : ""}`}
                                        >
                                            <div className="avatar">
                                                {dev.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span>{dev.name}</span>
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
                                <p className="form-help-text mt-3">
                                    <svg className="!text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-green-600 font-medium">{selectedDevs.length} developer{selectedDevs.length !== 1 ? 's' : ''} selected</span>
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="form-actions-premium">
                            <Link href="/dashboard/pm" className="btn-stunning-ghost">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-stunning-primary"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
