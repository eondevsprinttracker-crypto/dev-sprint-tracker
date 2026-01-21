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
    { value: "Web", label: "Web Application", icon: "globe" },
    { value: "Mobile", label: "Mobile App", icon: "mobile" },
    { value: "Desktop", label: "Desktop Software", icon: "desktop" },
    { value: "API", label: "API / Backend", icon: "api" },
    { value: "Data", label: "Data / Analytics", icon: "data" },
    { value: "DevOps", label: "DevOps / Infrastructure", icon: "devops" },
    { value: "Other", label: "Other", icon: "other" },
];

const PRIORITY_OPTIONS = [
    { value: "Low", label: "Low", color: "bg-gray-400" },
    { value: "Medium", label: "Medium", color: "bg-blue-500" },
    { value: "High", label: "High", color: "bg-amber-500" },
    { value: "Critical", label: "Critical", color: "bg-red-500" },
];

const VISIBILITY_OPTIONS = [
    { value: "Private", label: "Private", icon: "lock", desc: "Only you can see" },
    { value: "Team", label: "Team", icon: "team", desc: "Team members only" },
    { value: "Public", label: "Public", icon: "globe", desc: "Visible to all" },
];

const RISK_LEVEL_OPTIONS = [
    { value: "Low", label: "Low Risk", color: "bg-emerald-500" },
    { value: "Medium", label: "Medium Risk", color: "bg-amber-500" },
    { value: "High", label: "High Risk", color: "bg-red-500" },
];

// Category icon component
function CategoryIcon({ type, className = "w-5 h-5" }: { type: string; className?: string }) {
    const icons: Record<string, React.ReactNode> = {
        globe: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
        mobile: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
        desktop: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
        api: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
        data: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
        devops: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
        other: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
        lock: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
        team: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    };
    return <>{icons[type] || icons.other}</>;
}

// Section icon component
function SectionIcon({ type, className = "w-5 h-5" }: { type: string; className?: string }) {
    const icons: Record<string, React.ReactNode> = {
        basics: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        classification: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
        timeline: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
        links: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
        tags: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
        visual: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
        team: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
        notes: <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    };
    return <>{icons[type] || icons.basics}</>;
}

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
    const [client, setClient] = useState("");
    const [repository, setRepository] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [notes, setNotes] = useState("");

    // Attachments
    const [attachments, setAttachments] = useState<{
        name: string;
        url: string;
        publicId: string;
        type: 'image' | 'video' | 'pdf' | 'document' | 'other';
        size: number;
    }[]>([]);
    const [uploading, setUploading] = useState(false);

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

    // File upload handlers
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        await uploadFiles(Array.from(files));
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (files.length === 0) return;
        await uploadFiles(Array.from(files));
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const uploadFiles = async (files: File[]) => {
        setUploading(true);
        try {
            for (const file of files) {
                if (file.size > 10 * 1024 * 1024) {
                    setError(`File ${file.name} is too large. Max size is 10MB.`);
                    continue;
                }

                const base64 = await fileToBase64(file);
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file: base64, fileName: file.name }),
                });

                const result = await response.json();
                if (result.success) {
                    const fileType = getFileType(file.name);
                    setAttachments(prev => [...prev, {
                        name: file.name,
                        url: result.url,
                        publicId: result.publicId,
                        type: fileType,
                        size: file.size,
                    }]);
                } else {
                    setError(`Failed to upload ${file.name}: ${result.error}`);
                }
            }
        } catch (err) {
            setError('Upload failed. Please try again.');
        }
        setUploading(false);
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });
    };

    const getFileType = (fileName: string): 'image' | 'video' | 'pdf' | 'document' | 'other' => {
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
        if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video';
        if (ext === 'pdf') return 'pdf';
        if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(ext)) return 'document';
        return 'other';
    };

    const removeAttachment = (publicId: string) => {
        setAttachments(prev => prev.filter(a => a.publicId !== publicId));
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
            <div className="w-full max-w-6xl mx-auto px-6">
                {/* Premium Form Container */}
                <div className="form-container-premium form-container-full animate-fade-in w-full">
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
                            <h3 className="flex items-center gap-2"><SectionIcon type="basics" className="w-5 h-5 text-orange-500" /> Project Basics</h3>
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
                            <h3 className="flex items-center gap-2"><SectionIcon type="classification" className="w-5 h-5 text-orange-500" /> Classification</h3>
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
                                            <CategoryIcon type={opt.icon} className="w-5 h-5" />
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
                                                <CategoryIcon type={opt.icon} className="w-5 h-5" />
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

                        {/* ===== SECTION 3: Timeline ===== */}
                        <div className="section-divider-premium">
                            <h3 className="flex items-center gap-2"><SectionIcon type="timeline" className="w-5 h-5 text-orange-500" /> Timeline</h3>
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>

                        {/* ===== SECTION 4: Repository & Client ===== */}
                        <div className="section-divider-premium">
                            <h3 className="flex items-center gap-2"><SectionIcon type="links" className="w-5 h-5 text-orange-500" /> Repository & Client</h3>
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
                            <h3 className="flex items-center gap-2"><SectionIcon type="tags" className="w-5 h-5 text-orange-500" /> Tags</h3>
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
                            <h3 className="flex items-center gap-2"><SectionIcon type="visual" className="w-5 h-5 text-orange-500" /> Visual Identity</h3>
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

                        {/* ===== SECTION 7: Attachments ===== */}
                        <div className="section-divider-premium">
                            <h3 className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                Attachments
                            </h3>
                        </div>

                        <div>
                            {/* Upload Zone */}
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer hover:border-orange-400 hover:bg-orange-50 ${uploading ? 'border-orange-400 bg-orange-50' : 'border-gray-300'}`}
                            >
                                <input
                                    type="file"
                                    id="file-upload"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    {uploading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                            <p className="text-orange-600 font-medium">Uploading...</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                            </div>
                                            <p className="text-gray-700 font-medium">Drop files here or click to browse</p>
                                            <p className="text-xs text-gray-500">PDF, Images, Videos, Documents (max 10MB each)</p>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {/* Uploaded Files List */}
                            {attachments.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-sm font-medium text-gray-700">{attachments.length} file(s) attached</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {attachments.map((file) => (
                                            <div
                                                key={file.publicId}
                                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${file.type === 'image' ? 'bg-blue-100 text-blue-600' :
                                                    file.type === 'pdf' ? 'bg-red-100 text-red-600' :
                                                        file.type === 'video' ? 'bg-purple-100 text-purple-600' :
                                                            'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {file.type === 'image' && (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    )}
                                                    {file.type === 'pdf' && (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                    )}
                                                    {file.type === 'video' && (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                    )}
                                                    {(file.type === 'document' || file.type === 'other') && (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate text-sm">{file.name}</p>
                                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(file.publicId)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ===== SECTION 8: Team ===== */}
                        <div className="section-divider-premium">
                            <h3 className="flex items-center gap-2"><SectionIcon type="team" className="w-5 h-5 text-orange-500" /> Team</h3>
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
                            <h3 className="flex items-center gap-2"><SectionIcon type="notes" className="w-5 h-5 text-orange-500" /> Internal Notes</h3>
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
