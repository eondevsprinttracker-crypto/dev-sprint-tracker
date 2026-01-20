"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createTask } from "@/app/actions/taskActions";
import { getProjects } from "@/app/actions/projectActions";
import { getSprints } from "@/app/actions/sprintActions";
import { getDevelopers } from "@/app/actions/taskActions";
import { calculateBusinessHours } from "@/lib/business-logic";

interface Project {
    _id: string;
    name: string;
    key: string;
    color: string;
}

interface Sprint {
    _id: string;
    name: string;
    status: string;
    project: {
        _id: string;
        name: string;
    };
}

interface Developer {
    _id: string;
    name: string;
    email: string;
}

export default function NewTaskPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const presetProjectId = searchParams.get("projectId");
    const presetSprintId = searchParams.get("sprintId");
    const presetAssignedTo = searchParams.get("assignedTo");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [projects, setProjects] = useState<Project[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [developers, setDevelopers] = useState<Developer[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedProject, setSelectedProject] = useState(presetProjectId || "");
    const [selectedSprint, setSelectedSprint] = useState(presetSprintId || "");
    const [assignedTo, setAssignedTo] = useState(presetAssignedTo || "");
    const [complexity, setComplexity] = useState<"Easy" | "Medium" | "Hard">("Medium");
    const [priority, setPriority] = useState<"Critical" | "High" | "Medium" | "Low">("Medium");
    const [storyPoints, setStoryPoints] = useState<number>(3);
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState("");
    const [estimatedHours, setEstimatedHours] = useState<number | "">(8);

    useEffect(() => {
        async function loadData() {
            try {
                const [projectsResult, developersResult, sprintsResult] = await Promise.all([
                    getProjects(),
                    getDevelopers(),
                    getSprints(),
                ]);

                if (projectsResult.success) {
                    setProjects(projectsResult.projects || []);
                }
                if (developersResult.success) {
                    setDevelopers(developersResult.developers || []);
                }
                if (sprintsResult.success) {
                    setSprints(sprintsResult.sprints?.filter((s: Sprint) => s.status !== "Completed" && s.status !== "Cancelled") || []);
                }
            } finally {
                setLoadingData(false);
            }
        }
        loadData();
    }, []);

    // Auto-calculate hours from dates
    useEffect(() => {
        if (startDate && endDate) {
            const hours = calculateBusinessHours(new Date(startDate), new Date(endDate));
            setEstimatedHours(hours);
        }
    }, [startDate, endDate]);

    // Filter sprints by selected project
    const filteredSprints = sprints.filter(
        (s) => !selectedProject || s.project?._id === selectedProject
    );

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        if (selectedProject) formData.append("projectId", selectedProject);
        if (selectedSprint) formData.append("sprintId", selectedSprint);
        formData.append("assignedTo", assignedTo);
        formData.append("complexity", complexity);
        formData.append("priority", priority);
        formData.append("storyPoints", String(storyPoints));
        formData.append("scheduledStartDate", startDate);
        formData.append("scheduledEndDate", endDate);
        formData.append("estimatedHours", String(estimatedHours || 8));

        const result = await createTask(formData);

        if (result.success) {
            // Navigate back to appropriate page
            if (selectedSprint) {
                router.push(`/dashboard/pm/sprints/${selectedSprint}`);
            } else if (selectedProject) {
                router.push(`/dashboard/pm?tab=projects`);
            } else {
                router.push("/dashboard/pm");
            }
        } else {
            setError(result.error || "Failed to create task");
            setLoading(false);
        }
    }

    if (loadingData) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center animate-pulse">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-medium">Loading form data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-white via-orange-50/30 to-white p-6 md:p-8">
            <div className="w-full">
                {/* Premium Form Container */}
                <div className="form-container-premium form-container-full animate-fade-in">
                    {/* Premium Header */}
                    <div className="form-header-premium">
                        <div className="form-header-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <div className="form-header-content">
                            <h1>Create New Task</h1>
                            <p>Assign work to your team members with clear requirements and deadlines</p>
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
                        {/* Basic Information Section */}
                        <div className="section-divider-premium">
                            <h3>Basic Information</h3>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="form-label-premium">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Task Title <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className="input-stunning"
                                    placeholder="What needs to be done?"
                                />
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
                                    rows={4}
                                    className="textarea-stunning"
                                    placeholder="Describe the task in detail..."
                                />
                                <p className="form-help-text">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Provide context, requirements, or acceptance criteria
                                </p>
                            </div>
                        </div>

                        {/* Assignment Section */}
                        <div className="section-divider-premium">
                            <h3>Assignment</h3>
                        </div>

                        <div className="space-y-5">
                            <div className="form-field-group">
                                <div>
                                    <label className="form-label-premium">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                        Project
                                    </label>
                                    <select
                                        value={selectedProject}
                                        onChange={(e) => {
                                            setSelectedProject(e.target.value);
                                            setSelectedSprint("");
                                        }}
                                        className="select-stunning"
                                    >
                                        <option value="">No Project</option>
                                        {projects.map((project) => (
                                            <option key={project._id} value={project._id}>
                                                [{project.key}] {project.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label-premium">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Sprint
                                    </label>
                                    <select
                                        value={selectedSprint}
                                        onChange={(e) => setSelectedSprint(e.target.value)}
                                        className="select-stunning"
                                        disabled={!selectedProject && filteredSprints.length === 0}
                                    >
                                        <option value="">Backlog (No Sprint)</option>
                                        {filteredSprints.map((sprint) => (
                                            <option key={sprint._id} value={sprint._id}>
                                                {sprint.name} ({sprint.status})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="form-label-premium">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Assign To <span className="required">*</span>
                                </label>
                                <select
                                    value={assignedTo}
                                    onChange={(e) => setAssignedTo(e.target.value)}
                                    required
                                    className="select-stunning"
                                >
                                    <option value="">Select a developer</option>
                                    {developers.map((dev) => (
                                        <option key={dev._id} value={dev._id}>
                                            {dev.name} ({dev.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Complexity & Planning Section */}
                        <div className="section-divider-premium">
                            <h3>Complexity & Planning</h3>
                        </div>

                        <div className="space-y-5">
                            <div className="form-field-group cols-3">
                                <div>
                                    <label className="form-label-premium">
                                        Complexity <span className="required">*</span>
                                    </label>
                                    <select
                                        value={complexity}
                                        onChange={(e) => setComplexity(e.target.value as "Easy" | "Medium" | "Hard")}
                                        className="select-stunning"
                                    >
                                        <option value="Easy">🟢 Easy (1 pt)</option>
                                        <option value="Medium">🟡 Medium (3 pts)</option>
                                        <option value="Hard">🔴 Hard (5 pts)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label-premium">
                                        Priority <span className="required">*</span>
                                    </label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as "Critical" | "High" | "Medium" | "Low")}
                                        className="select-stunning"
                                    >
                                        <option value="Critical">🔴 Critical</option>
                                        <option value="High">🟠 High</option>
                                        <option value="Medium">🟡 Medium</option>
                                        <option value="Low">🟢 Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label-premium">
                                        Story Points
                                    </label>
                                    <select
                                        value={storyPoints}
                                        onChange={(e) => setStoryPoints(parseInt(e.target.value))}
                                        className="select-stunning"
                                    >
                                        {[1, 2, 3, 5, 8, 13, 21].map((pts) => (
                                            <option key={pts} value={pts}>
                                                {pts} points
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="info-card-premium">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p>Complexity affects default story points. Use story points for sprint planning and velocity tracking.</p>
                            </div>
                        </div>

                        {/* Schedule Section */}
                        <div className="section-divider-premium">
                            <h3>Schedule</h3>
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

                            <div>
                                <label className="form-label-premium">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Estimated Hours <span className="required">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={estimatedHours}
                                    onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || "")}
                                    step="0.5"
                                    min="0.5"
                                    required
                                    className="input-stunning"
                                    placeholder="Auto-calculated from dates"
                                />
                                <p className="form-help-text">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Auto-calculated based on business hours between dates
                                </p>
                            </div>
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
                                        Create Task
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
