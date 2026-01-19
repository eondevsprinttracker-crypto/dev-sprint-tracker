"use client";

interface DeveloperStats {
    _id: string;
    name: string;
    email: string;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    totalPoints: number;
}

interface TeamMemberCardProps {
    developer: DeveloperStats;
    onAssignTask: (developerId: string) => void;
    onDeleteDeveloper: (developerId: string) => void;
    isDeleting?: boolean;
}

export default function TeamMemberCard({ developer, onAssignTask, onDeleteDeveloper, isDeleting }: TeamMemberCardProps) {
    const completionRate = developer.totalTasks > 0
        ? Math.round((developer.completedTasks / developer.totalTasks) * 100)
        : 0;

    const initials = developer.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div className="bg-[#1e1e1e]/60 backdrop-blur-sm rounded-xl border border-white/5 p-5 hover:border-orange-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg border border-orange-500/20">
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate">{developer.name}</h4>
                    <p className="text-sm text-slate-400 truncate">{developer.email}</p>
                </div>
                {/* Delete Button */}
                <button
                    onClick={() => onDeleteDeveloper(developer._id)}
                    disabled={isDeleting}
                    title="Delete Developer"
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
                <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-lg font-bold text-white">{developer.totalTasks}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total</p>
                </div>
                <div className="text-center p-2 bg-green-500/10 rounded-lg">
                    <p className="text-lg font-bold text-green-400">{developer.completedTasks}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Done</p>
                </div>
                <div className="text-center p-2 bg-orange-500/10 rounded-lg">
                    <p className="text-lg font-bold text-orange-400">{developer.inProgressTasks}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Active</p>
                </div>
                <div className="text-center p-2 bg-red-500/10 rounded-lg">
                    <p className="text-lg font-bold text-red-400">{developer.blockedTasks}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Blocked</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Completion Rate</span>
                    <span className="text-xs font-medium text-white">{completionRate}%</span>
                </div>
                <div className="h-2 bg-slate-900/50 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                    />
                </div>
            </div>

            {/* Points Badge */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-orange-600/10 to-red-600/10 rounded-lg border border-orange-500/20">
                <span className="text-sm text-slate-300">Total Points</span>
                <span className="text-lg font-bold text-orange-400">{developer.totalPoints}</span>
            </div>

            {/* Action */}
            <button
                onClick={() => onAssignTask(developer._id)}
                className="w-full py-2.5 px-4 text-sm font-medium text-orange-400 hover:text-white hover:bg-orange-600 border border-orange-500/50 rounded-lg transition-all duration-200"
            >
                + Assign New Task
            </button>
        </div>
    );
}

