"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSprint } from "@/app/actions/sprintActions";
import { getProjects } from "@/app/actions/projectActions";

interface Project {
    _id: string;
    name: string;
    key: string;
    color: string;
}

export default function NewSprintPageClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [selectedProject, setSelectedProject] = useState("");

    // Form state
    const [name, setName] = useState("");
    const [goal, setGoal] = useState("");
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState("");
    const [capacity, setCapacity] = useState<number | "">(21);

    useEffect(() => {
        async function loadProjects() {
            const result = await getProjects();
            if (result.success) {
                setProjects(result.projects || []);
                if (result.projects?.length > 0) {
                    setSelectedProject(result.projects[0]._id);
                }
            }
            setLoadingProjects(false);
        }
        loadProjects();
    }, []);

    // Auto-set end date to 2 weeks from start
    useEffect(() => {
        if (startDate) {
            const start = new Date(startDate);
            start.setDate(start.getDate() + 14);
            setEndDate(start.toISOString().split("T")[0]);
        }
    }, [startDate]);

    // Calculate sprint duration
    const sprintDuration = startDate && endDate
        ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!selectedProject) {
            setError("Please select a project");
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("projectId", selectedProject);
        formData.append("name", name);
        formData.append("goal", goal);
        formData.append("startDate", startDate);
        formData.append("endDate", endDate);
        formData.append("capacity", String(capacity || 0));

        const result = await createSprint(formData);

        if (result.success) {
            router.push(`/dashboard/pm/sprints/${result.sprint._id}`);
        } else {
            setError(result.error || "Failed to create sprint");
            setLoading(false);
        }
    }

    if (loadingProjects) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/30 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center animate-pulse">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-medium">Loading projects...</p>
                </div>
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/30 to-white p-6 md:p-8">
                <div className="max-w-md mx-auto">
                    <div className="form-container-premium text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 border border-orange-200 flex items-center justify-center">
                            <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Projects Found</h3>
                        <p className="text-gray-600 mb-6">You need to create a project before you can start a sprint.</p>
                        <Link href="/dashboard/pm/projects/new" className="btn-stunning-primary inline-flex">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Project
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const activeProject = projects.find(p => p._id === selectedProject);

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/30 to-white p-6 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Premium Form Container */}
                <div className="form-container-premium animate-fade-in">
                    {/* Premium Header */}
                    <div className="form-header-premium">
                        <div className="form-header-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div className="form-header-content">
                            <h1>Create New Sprint</h1>
                            <p>Set up a new sprint iteration for your project</p>
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
                        {/* Project Selection Section */}
                        <div className="section-divider-premium">
                            <h3>Project Selection</h3>
                        </div>

                        <div>
                            <label className="form-label-premium">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                Project <span className="required">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {projects.map((project) => (
                                    <button
                                        key={project._id}
                                        type="button"
                                        onClick={() => setSelectedProject(project._id)}
                                        className={`project-select-card text-left ${selectedProject === project._id ? "selected" : ""}`}
                                    >
                                        <div
                                            className="w-5 h-5 rounded-lg mb-3 shadow-sm"
                                            style={{ backgroundColor: project.color }}
                                        />
                                        <div className="text-xs text-gray-500 mb-1 font-semibold tracking-wide">{project.key}</div>
                                        <div className="text-sm font-bold text-gray-900 truncate">{project.name}</div>
                                        {selectedProject === project._id && (
                                            <div className="absolute top-3 right-3 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sprint Details Section */}
                        <div className="section-divider-premium">
                            <h3>Sprint Details</h3>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="form-label-premium">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Sprint Name <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="input-stunning"
                                    placeholder="e.g., Sprint 1 - Authentication"
                                />
                            </div>

                            <div>
                                <label className="form-label-premium">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Sprint Goal
                                </label>
                                <textarea
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    rows={3}
                                    className="textarea-stunning"
                                    placeholder="What do you want to achieve in this sprint?"
                                />
                                <p className="form-help-text">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Define the main objective for this sprint
                                </p>
                            </div>
                        </div>

                        {/* Planning Section */}
                        <div className="section-divider-premium">
                            <h3>Planning</h3>
                        </div>

                        <div className="space-y-5">
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
                                        End Date <span className="required">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        min={startDate}
                                        required
                                        className="input-stunning"
                                    />
                                </div>
                            </div>

                            {/* Duration Info */}
                            {sprintDuration > 0 && (
                                <div className="info-card-premium">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p>
                                        <span className="font-bold text-gray-900">Sprint duration: {sprintDuration} days</span>
                                        <br />
                                        <span className="text-sm">Standard sprints are typically 2 weeks (14 days)</span>
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="form-label-premium">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Planned Capacity (Story Points)
                                </label>
                                <input
                                    type="number"
                                    value={capacity}
                                    onChange={(e) => setCapacity(parseInt(e.target.value) || "")}
                                    min={0}
                                    className="input-stunning"
                                    placeholder="How many story points to commit?"
                                />
                                <p className="form-help-text">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Typical team velocity is 15-30 points per sprint
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="form-actions-premium">
                            <Link href="/dashboard/pm/sprints" className="btn-stunning-ghost">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading || !selectedProject}
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
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Create Sprint
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
