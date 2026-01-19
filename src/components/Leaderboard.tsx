"use client";

interface LeaderboardEntry {
    _id: string;
    name: string;
    email: string;
    totalPoints: number;
    completedTasks: number;
}

interface LeaderboardProps {
    entries: LeaderboardEntry[];
    weekNumber: number;
    currentUserId?: string;
    loading?: boolean;
}

export default function Leaderboard({ entries, weekNumber, currentUserId, loading = false }: LeaderboardProps) {
    if (loading) {
        return (
            <div className="glass-card-premium rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent"></div>
                <div className="relative flex items-center justify-center py-12">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin"></div>
                        <div className="absolute inset-0 w-12 h-12 rounded-full animate-pulse-orange bg-orange-500/10"></div>
                    </div>
                </div>
            </div>
        );
    }

    const getRankStyle = (index: number) => {
        if (index === 0) return "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/40";
        if (index === 1) return "bg-gradient-to-r from-slate-400/15 to-slate-500/5 border-slate-400/40";
        if (index === 2) return "bg-gradient-to-r from-orange-600/15 to-orange-500/5 border-orange-500/40";
        return "bg-black/20 border-white/5";
    };

    const getMedalConfig = (index: number) => {
        if (index === 0) return { emoji: "🥇", glow: "shadow-yellow-500/30", text: "text-yellow-400" };
        if (index === 1) return { emoji: "🥈", glow: "shadow-slate-400/20", text: "text-slate-300" };
        if (index === 2) return { emoji: "🥉", glow: "shadow-orange-500/20", text: "text-orange-400" };
        return { emoji: null, glow: "", text: "text-neutral-500" };
    };

    return (
        <div className="glass-card-premium rounded-2xl p-6 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/8 via-transparent to-red-500/5"></div>

            {/* Glow effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl"></div>

            <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-xl">
                            <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Leaderboard</h2>
                            <p className="text-xs text-neutral-500">Weekly rankings</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/15 rounded-full border border-orange-500/25">
                        <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-bold text-orange-300">Week {weekNumber}</span>
                    </div>
                </div>

                {entries.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-800/50 flex items-center justify-center">
                            <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-neutral-400 mb-2 font-medium">No completed tasks this week</p>
                        <p className="text-sm text-neutral-600">
                            Complete tasks to earn points and climb the leaderboard!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {entries.map((entry, index) => {
                            const isCurrentUser = entry._id === currentUserId;
                            const medalConfig = getMedalConfig(index);

                            return (
                                <div
                                    key={entry._id}
                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${getRankStyle(index)} 
                                        ${isCurrentUser ? "ring-2 ring-orange-500/50 ring-offset-2 ring-offset-[#0a0a0a]" : "hover:border-orange-500/20"}
                                        ${index < 3 ? "shadow-lg " + medalConfig.glow : ""}`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {/* Rank */}
                                    <div className="w-10 h-10 flex items-center justify-center">
                                        {medalConfig.emoji ? (
                                            <span className="text-2xl drop-shadow-lg">{medalConfig.emoji}</span>
                                        ) : (
                                            <span className={`text-lg font-bold ${medalConfig.text}`}>
                                                #{index + 1}
                                            </span>
                                        )}
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-semibold truncate ${isCurrentUser ? "text-orange-300" : "text-white"}`}>
                                                {entry.name}
                                            </p>
                                            {isCurrentUser && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30">
                                                    YOU
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <svg className="w-3 h-3 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-xs text-neutral-500">
                                                {entry.completedTasks} task{entry.completedTasks !== 1 ? "s" : ""} completed
                                            </p>
                                        </div>
                                    </div>

                                    {/* Points */}
                                    <div className="text-right">
                                        <p className={`text-2xl font-bold ${index === 0 ? 'gradient-text-fire' : 'text-orange-400'}`}>
                                            {entry.totalPoints}
                                        </p>
                                        <p className="text-xs text-neutral-500">points</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Points Legend */}
                <div className="mt-6 pt-4 border-t border-white/5">
                    <p className="text-xs text-neutral-500 mb-3 font-medium">Points per task complexity:</p>
                    <div className="flex flex-wrap gap-3">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-lg border border-emerald-500/20">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Easy: 1 pt
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-lg border border-amber-500/20">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Medium: 3 pts
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-medium rounded-lg border border-red-500/20">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Hard: 5 pts
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
