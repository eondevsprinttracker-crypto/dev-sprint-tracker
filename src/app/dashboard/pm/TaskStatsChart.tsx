"use client";

interface TaskStats {
    total: number;
    todo: number;
    inProgress: number;
    pendingReview: number;
    completed: number;
    changesRequested: number;
    blocked: number;
    totalEstimatedHours: number;
    totalActualHours: number;
}

interface TaskStatsChartProps {
    stats: TaskStats;
}

export default function TaskStatsChart({ stats }: TaskStatsChartProps) {
    const statusData = [
        { label: "Todo", count: stats.todo, color: "bg-slate-400" },
        { label: "In Progress", count: stats.inProgress, color: "bg-orange-500" },
        { label: "Pending Review", count: stats.pendingReview, color: "bg-yellow-500" },
        { label: "Changes Requested", count: stats.changesRequested, color: "bg-red-500" },
        { label: "Completed", count: stats.completed, color: "bg-green-500" },
    ];

    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const hoursVariance = stats.totalActualHours - stats.totalEstimatedHours;
    const hoursAccuracy = stats.totalEstimatedHours > 0
        ? Math.round((1 - Math.abs(hoursVariance) / stats.totalEstimatedHours) * 100)
        : 100;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Overview</h3>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Task Distribution</span>
                    <span className="text-sm text-gray-700">{stats.total} total</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                    {statusData.map((status, index) => {
                        const width = stats.total > 0 ? (status.count / stats.total) * 100 : 0;
                        if (width === 0) return null;
                        return (
                            <div
                                key={index}
                                className={`${status.color} transition-all duration-500`}
                                style={{ width: `${width}%` }}
                                title={`${status.label}: ${status.count}`}
                            />
                        );
                    })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                    {statusData.map((status, index) => (
                        <div key={index} className="flex items-center gap-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${status.color}`} />
                            <span className="text-xs text-gray-500">{status.label}</span>
                            <span className="text-xs font-medium text-gray-900">({status.count})</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-3">
                {/* Completion Rate */}
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="relative inline-flex items-center justify-center w-16 h-16 mb-2">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="text-gray-200"
                                strokeWidth="3"
                                fill="none"
                                stroke="currentColor"
                                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                                className="text-green-500"
                                strokeWidth="3"
                                fill="none"
                                stroke="currentColor"
                                strokeDasharray={`${completionRate}, 100`}
                                strokeLinecap="round"
                                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                        </svg>
                        <span className="absolute text-lg font-bold text-gray-900">{completionRate}%</span>
                    </div>
                    <p className="text-xs text-gray-500">Completion</p>
                </div>

                {/* Hours Accuracy */}
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="relative inline-flex items-center justify-center w-16 h-16 mb-2">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="text-gray-200"
                                strokeWidth="3"
                                fill="none"
                                stroke="currentColor"
                                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                                className={hoursAccuracy >= 80 ? "text-green-500" : hoursAccuracy >= 50 ? "text-yellow-500" : "text-red-500"}
                                strokeWidth="3"
                                fill="none"
                                stroke="currentColor"
                                strokeDasharray={`${Math.max(0, hoursAccuracy)}, 100`}
                                strokeLinecap="round"
                                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                        </svg>
                        <span className="absolute text-lg font-bold text-gray-900">{Math.max(0, hoursAccuracy)}%</span>
                    </div>
                    <p className="text-xs text-gray-500">Hours Accuracy</p>
                </div>

                {/* Blocked */}
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="relative inline-flex items-center justify-center w-16 h-16 mb-2">
                        <div className={`w-full h-full rounded-full flex items-center justify-center ${stats.blocked > 0 ? "bg-red-100" : "bg-green-100"
                            }`}>
                            <span className={`text-2xl font-bold ${stats.blocked > 0 ? "text-red-600" : "text-green-600"
                                }`}>
                                {stats.blocked}
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">Blocked Tasks</p>
                </div>
            </div>

            {/* Hours Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Total Estimated:</span>
                    <span className="font-medium text-gray-900">{stats.totalEstimatedHours.toFixed(1)}h</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-500">Total Actual:</span>
                    <span className={`font-medium ${hoursVariance > 0 ? "text-red-600" : "text-green-600"}`}>
                        {stats.totalActualHours.toFixed(1)}h
                        {hoursVariance !== 0 && (
                            <span className="ml-1 text-xs">
                                ({hoursVariance > 0 ? "+" : ""}{hoursVariance.toFixed(1)}h)
                            </span>
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}
