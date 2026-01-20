"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateSprint } from "@/app/actions/sprintActions";

interface Sprint {
    _id: string;
    name: string;
    goal: string;
    status: "Planning" | "Active" | "Completed" | "Cancelled";
    startDate: string;
    endDate: string;
    capacity: number;
    retrospective: string;
    project: {
        _id: string;
        name: string;
        key: string;
        color: string;
    };
}

interface EditSprintPageClientProps {
    sprint: Sprint;
}

export default function EditSprintPageClient({ sprint }: EditSprintPageClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Form state - pre-populated with existing sprint data
    const [name, setName] = useState(sprint.name);
    const [goal, setGoal] = useState(sprint.goal || "");
    const [startDate, setStartDate] = useState(
        new Date(sprint.startDate).toISOString().split("T")[0]
    );
    const [endDate, setEndDate] = useState(
        new Date(sprint.endDate).toISOString().split("T")[0]
    );
    const [capacity, setCapacity] = useState<number | "">(sprint.capacity || 0);
    const [retrospective, setRetrospective] = useState(sprint.retrospective || "");

    // Calculate sprint duration
    const sprintDuration = startDate && endDate
        ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await updateSprint(sprint._id, {
            name,
            goal,
            startDate,
            endDate,
            capacity: typeof capacity === "number" ? capacity : 0,
            retrospective,
        });

        if (result.success) {
            router.push(`/dashboard/pm/sprints/${sprint._id}`);
        } else {
            setError(result.error || "Failed to update sprint");
            setLoading(false);
        }
    }

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "Planning":
                return { class: "status-badge-premium planning", label: "Planning" };
            case "Active":
                return { class: "status-badge-premium active", label: "Active" };
            case "Completed":
                return { class: "status-badge-premium completed", label: "Completed" };
            default:
                return { class: "status-badge-premium", label: status };
        }
    };

    const statusConfig = getStatusConfig(sprint.status);

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/30 to-white p-6 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Premium Form Container */}
                <div className="form-container-premium animate-fade-in">
                    {/* Premium Header */}
                    <div className="form-header-premium">
                        <div className="form-header-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <div className="form-header-content">
                            <h1>Edit Sprint</h1>
                            <div className="flex items-center gap-2 mt-2">
                                <span
                                    className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                                    style={{
                                        backgroundColor: `${sprint.project?.color}15`,
                                        color: sprint.project?.color,
                                    }}
                                >
                                    {sprint.project?.key}
                                </span>
                                <span className="text-gray-600 text-sm">{sprint.project?.name}</span>
                            </div>
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
                        {/* Sprint Details Section */}
                        <div className="section-divider-premium">
                            <h3>Sprint Details</h3>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="form-label-premium">
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
                                    Sprint Goal
                                </label>
                                <textarea
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    rows={3}
                                    className="textarea-stunning"
                                    placeholder="What do you want to achieve in this sprint?"
                                />
                            </div>
                        </div>

                        {/* Timeline Section */}
                        <div className="section-divider-premium">
                            <h3>Timeline</h3>
                        </div>

                        <div className="space-y-5">
                            <div className="form-field-group">
                                <div>
                                    <label className="form-label-premium">
                                        Start Date <span className="required">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                        disabled={sprint.status !== "Planning"}
                                        className={`input-stunning ${sprint.status !== "Planning" ? "opacity-60 cursor-not-allowed" : ""}`}
                                    />
                                    {sprint.status !== "Planning" && (
                                        <p className="form-help-text">Cannot change for {sprint.status.toLowerCase()} sprints</p>
                                    )}
                                </div>
                                <div>
                                    <label className="form-label-premium">
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
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Planning Section */}
                        <div className="section-divider-premium">
                            <h3>Planning</h3>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="form-label-premium">
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

                            {/* Status Display */}
                            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                <span className="text-sm font-medium text-gray-700">Current Status</span>
                                <span className={statusConfig.class}>
                                    {statusConfig.label}
                                </span>
                            </div>
                        </div>

                        {/* Retrospective Section - Only for Active or Completed */}
                        {(sprint.status === "Active" || sprint.status === "Completed") && (
                            <>
                                <div className="section-divider-premium">
                                    <h3>Retrospective</h3>
                                </div>

                                <div>
                                    <label className="form-label-premium">
                                        Retrospective Notes
                                    </label>
                                    <textarea
                                        value={retrospective}
                                        onChange={(e) => setRetrospective(e.target.value)}
                                        rows={4}
                                        className="textarea-stunning"
                                        placeholder="What went well? What could be improved?"
                                    />
                                    <p className="form-help-text">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Document lessons learned for next sprint
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Actions */}
                        <div className="form-actions-premium">
                            <Link
                                href={`/dashboard/pm/sprints/${sprint._id}`}
                                className="btn-stunning-ghost"
                            >
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
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Update Sprint
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
