"use client";

interface QAStats {
    _id: string;
    name: string;
    email: string;
    totalReviewed: number;
    approved: number;
    failed: number;
    pending: number;
    totalBugsFound: number;
    totalTimeSpent: number;
    totalPoints: number;
    passRate: number;
    avgReviewTime: number;
}

interface QAMemberCardProps {
    qa: QAStats;
    onDeleteQA: (qaId: string) => void;
    isDeleting?: boolean;
}

export default function QAMemberCard({ qa, onDeleteQA, isDeleting }: QAMemberCardProps) {
    const initials = qa.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    function formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }

    return (
        <div className="glass-card rounded-xl border border-purple-100 p-5 hover:border-purple-300 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg border border-purple-500/20">
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{qa.name}</h4>
                    <p className="text-sm text-gray-500 truncate">{qa.email}</p>
                </div>
                {/* Delete Button */}
                <button
                    onClick={() => onDeleteQA(qa._id)}
                    disabled={isDeleting}
                    title="Delete QA Member"
                    className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isDeleting ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{qa.totalReviewed}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Reviewed</p>
                </div>
                <div className="text-center p-2 bg-emerald-50 rounded-lg">
                    <p className="text-lg font-bold text-emerald-600">{qa.approved}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Approved</p>
                </div>
                <div className="text-center p-2 bg-red-50 rounded-lg">
                    <p className="text-lg font-bold text-red-600">{qa.failed}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Failed</p>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded-lg">
                    <p className="text-lg font-bold text-orange-600">{qa.pending}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Pending</p>
                </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-3 mb-4">
                {/* Pass Rate */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Pass Rate</span>
                        <span className="text-xs font-medium text-gray-900">{Math.round(qa.passRate)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${qa.passRate}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-sm text-gray-600">Bugs Found</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mt-1">{qa.totalBugsFound}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-gray-600">Avg Review</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mt-1">{formatTime(qa.avgReviewTime)}</p>
                </div>
            </div>

            {/* Points Badge */}
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                <span className="text-sm text-gray-600">Total Points</span>
                <span className="text-lg font-bold text-purple-600">{qa.totalPoints}</span>
            </div>
        </div>
    );
}
