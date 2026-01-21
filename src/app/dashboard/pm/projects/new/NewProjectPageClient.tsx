"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createProject } from "@/app/actions/projectActions";
import { getDevelopers } from "@/app/actions/taskActions";

// Dynamic import for RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
    ssr: false,
    loading: () => (
        <div className="h-[300px] rounded-xl bg-gray-100 animate-pulse flex items-center justify-center">
            <span className="text-gray-400">Loading editor...</span>
        </div>
    ),
});

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

const CATEGORY_OPTIONS = [
    { value: "Web", label: "Web Application", icon: "🌐" },
    { value: "Mobile", label: "Mobile App", icon: "📱" },
    { value: "Desktop", label: "Desktop Software", icon: "🖥️" },
    { value: "API", label: "API / Backend", icon: "⚡" },
    { value: "Data", label: "Data / Analytics", icon: "📊" },
    { value: "DevOps", label: "DevOps / Infrastructure", icon: "🔧" },
    { value: "Other", label: "Other", icon: "📦" },
];

const PRIORITY_OPTIONS = [
    { value: "Low", label: "Low", color: "bg-gray-400" },
    { value: "Medium", label: "Medium", color: "bg-blue-500" },
    { value: "High", label: "High", color: "bg-amber-500" },
    { value: "Critical", label: "Critical", color: "bg-red-500" },
];

const VISIBILITY_OPTIONS = [
    { value: "Private", label: "Private", icon: "🔒", desc: "Only you can see" },
    { value: "Team", label: "Team", icon: "👥", desc: "Team members only" },
    { value: "Public", label: "Public", icon: "🌍", desc: "Visible to all" },
];

const RISK_LEVEL_OPTIONS = [
    { value: "Low", label: "Low Risk", color: "bg-emerald-500" },
    { value: "Medium", label: "Medium Risk", color: "bg-amber-500" },
    { value: "High", label: "High Risk", color: "bg-red-500" },
];

export default function NewProjectPageClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [developers, setDevelopers] = useState<Developer[]>([]);
    const [loadingDevelopers, setLoadingDevelopers] = useState(true);

    // Form state - Basic info
    const [name, setName] = useState("");
    const [key, setKey] = useState("");
    const [description, setDescription] = useState("");
    const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);

    // Enhanced fields
    const [category, setCategory] = useState("Web");
    const [priority, setPriority] = useState("Medium");
    const [visibility, setVisibility] = useState("Team");
    const [riskLevel, setRiskLevel] = useState("Low");
    const [budget, setBudget] = useState("");
    const [client, setClient] = useState("");
    const [repository, setRepository] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [notes, setNotes] = useState("");

    // Timeline & Team
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

    const addTag = () => {
        const trimmed = tagInput.trim();
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTag();
        }
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
        formData.append("category", category);
        formData.append("priority", priority);
        formData.append("visibility", visibility);
        formData.append("riskLevel", riskLevel);
        if (budget) formData.append("budget", budget);
        if (client) formData.append("client", client);
        if (repository) formData.append("repository", repository);
        if (tags.length > 0) formData.append("tags", tags.join(","));
        if (notes) formData.append("notes", notes);
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
        <div className="bg-gradient-to-br from-white via-orange-50/30 to-white p-6 md:p-8">
            <div className="w-full max-w-4xl mx-auto">
                {/* Premium Form Container */}
                <div className="form-container-premium form-container-full animate-fade-in">
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
                            <p>Set up a comprehensive project with all the details your team needs</p>
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

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* ===== SECTION 1: Project Basics ===== */}
                        <div className="section-divider-premium">
                            <h3>📋 Project Basics</h3>
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-3">
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
                                <RichTextEditor
                                    value={description}
                                    onChange={setDescription}
                                    placeholder="Describe the project goals, scope, and key deliverables..."
                                    height={250}
                                />
                                <p className="form-help-text mt-2">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Use rich formatting to make the description clear and organized
                                </p>
                            </div>
                        </div>

                        {/* ===== SECTION 2: Classification ===== */}
                        <div className="section-divider-premium">
                            <h3>🏷️ Classification</h3>
                        </div>

                        <div className="space-y-6">
                            {/* Category Selection */}
                            <div>
                                <label className="form-label-premium">Category</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {CATEGORY_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setCategory(opt.value)}
                                            className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 text-sm font-medium ${category === opt.value
                                                    ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300 text-orange-700 shadow-md"
                                                    : "bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:shadow"
                                                }`}
                                        >
                                            <span className="text-lg">{opt.icon}</span>
                                            <span className="truncate">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Priority & Risk Level */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="form-label-premium">Priority</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {PRIORITY_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setPriority(opt.value)}
                                                className={`px-4 py-2.5 rounded-xl border-2 transition-all flex items-center gap-2 text-sm font-medium ${priority === opt.value
                                                        ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300 text-orange-700 shadow-md"
                                                        : "bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:shadow"
                                                    }`}
                                            >
                                                <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`} />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label-premium">Risk Level</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {RISK_LEVEL_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setRiskLevel(opt.value)}
                                                className={`px-4 py-2.5 rounded-xl border-2 transition-all flex items-center gap-2 text-sm font-medium ${riskLevel === opt.value
                                                        ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300 text-orange-700 shadow-md"
                                                        : "bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:shadow"
                                                    }`}
                                            >
                                                <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`} />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Visibility */}
                            <div>
                                <label className="form-label-premium">Visibility</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {VISIBILITY_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setVisibility(opt.value)}
                                            className={`p-4 rounded-xl border-2 transition-all text-left ${visibility === opt.value
                                                    ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300 shadow-md"
                                                    : "bg-white border-gray-200 hover:border-orange-200 hover:shadow"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">{opt.icon}</span>
                                                <span className={`font-medium ${visibility === opt.value ? "text-orange-700" : "text-gray-700"}`}>
                                                    {opt.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">{opt.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ===== SECTION 3: Timeline & Budget ===== */}
                        <div className="section-divider-premium">
                            <h3>📅 Timeline & Budget</h3>
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <div>
                                    <label className="form-label-premium">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Budget
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                                        <input
                                            type="number"
                                            value={budget}
                                            onChange={(e) => setBudget(e.target.value)}
                                            min="0"
                                            step="100"
                                            className="input-stunning pl-7"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===== SECTION 4: Repository & Client ===== */}
                        <div className="section-divider-premium">
                            <h3>🔗 Repository & Client</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label-premium">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                    </svg>
                                    Repository URL
                                </label>
                                <input
                                    type="url"
                                    value={repository}
                                    onChange={(e) => setRepository(e.target.value)}
                                    className="input-stunning"
                                    placeholder="https://github.com/org/repo"
                                />
                            </div>
                            <div>
                                <label className="form-label-premium">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Client / Stakeholder
                                </label>
                                <input
                                    type="text"
                                    value={client}
                                    onChange={(e) => setClient(e.target.value)}
                                    className="input-stunning"
                                    placeholder="e.g., Acme Corporation"
                                />
                            </div>
                        </div>

                        {/* ===== SECTION 5: Tags ===== */}
                        <div className="section-divider-premium">
                            <h3>🏷️ Tags</h3>
                        </div>

                        <div>
                            <label className="form-label-premium">Project Tags</label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    className="input-stunning flex-1"
                                    placeholder="Type a tag and press Enter"
                                />
                                <button
                                    type="button"
                                    onClick={addTag}
                                    className="px-4 py-2 rounded-xl bg-orange-100 text-orange-700 font-medium hover:bg-orange-200 transition"
                                >
                                    Add
                                </button>
                            </div>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 text-sm font-medium"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="w-4 h-4 rounded-full hover:bg-orange-200 flex items-center justify-center"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <p className="form-help-text mt-2">
                                Tags help with filtering and organizing projects
                            </p>
                        </div>

                        {/* ===== SECTION 6: Visual Identity ===== */}
                        <div className="section-divider-premium">
                            <h3>🎨 Visual Identity</h3>
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

                        {/* ===== SECTION 7: Team ===== */}
                        <div className="section-divider-premium">
                            <h3>👥 Team</h3>
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

                        {/* ===== SECTION 8: Internal Notes ===== */}
                        <div className="section-divider-premium">
                            <h3>📝 Internal Notes</h3>
                        </div>

                        <div>
                            <label className="form-label-premium">
                                PM Notes (Private)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="textarea-stunning"
                                placeholder="Internal notes, reminders, or context for this project..."
                            />
                            <p className="form-help-text">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                These notes are only visible to you and other PMs
                            </p>
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
