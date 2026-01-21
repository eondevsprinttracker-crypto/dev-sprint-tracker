"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface ComparisonData {
    category: string;
    developers: number;
    qa: number;
}

interface PerformanceComparisonChartProps {
    developerStats: any[];
    qaStats: any[];
}

export default function PerformanceComparisonChart({ developerStats, qaStats }: PerformanceComparisonChartProps) {
    // 1. Total Tasks Volume
    const totalDevTasks = developerStats.reduce((sum, dev) => sum + (dev.completedTasks || 0), 0);
    const totalQAReviews = qaStats.reduce((sum, qa) => sum + (qa.totalReviewed || 0), 0);

    // 2. Average Efficiency / Turnaround
    // For Devs: We can use a proxy like avg points per dev or completion rate
    // For QA: Avg review time (in minutes for chart)
    const avgDevPoints = developerStats.length > 0
        ? developerStats.reduce((sum, dev) => sum + (dev.totalPoints || 0), 0) / developerStats.length
        : 0;

    const avgQAPoints = qaStats.length > 0
        ? qaStats.reduce((sum, qa) => sum + (qa.totalPoints || 0), 0) / qaStats.length
        : 0;

    // 3. Issues Handling
    // Devs: Blocked tasks
    // QA: Bugs found
    const totalBlockedTasks = developerStats.reduce((sum, dev) => sum + (dev.blockedTasks || 0), 0);
    const totalBugsFound = qaStats.reduce((sum, qa) => sum + (qa.totalBugsFound || 0), 0);

    const volumeData: ComparisonData[] = [
        {
            category: 'Volume',
            developers: totalDevTasks,
            qa: totalQAReviews,
        }
    ];

    const pointsData: ComparisonData[] = [
        {
            category: 'Avg Points',
            developers: Math.round(avgDevPoints),
            qa: Math.round(avgQAPoints),
        }
    ];

    const issuesData: ComparisonData[] = [
        {
            category: 'Issues', // Blocked vs Bugs
            developers: totalBlockedTasks,
            qa: totalBugsFound,
        }
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl">
                    <p className="font-bold text-gray-800 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm text-gray-600">
                                {entry.name === 'developers' ? 'Developers' : 'QA Team'}:
                                <span className="font-semibold ml-1 text-gray-900">{entry.value}</span>
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
            {/* Volume Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-gray-800 mb-1">Work Volume</h3>
                <p className="text-xs text-gray-500 mb-6">Completed Tasks vs Reviewed Tasks</p>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={volumeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="category" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                            <Bar dataKey="developers" name="Developers Completed" fill="#f97316" radius={[6, 6, 0, 0]} barSize={40} />
                            <Bar dataKey="qa" name="QA Reviewed" fill="#a855f7" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Impact Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-gray-800 mb-1">Impact & Complexity</h3>
                <p className="text-xs text-gray-500 mb-6">Avg Story Points per Member</p>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pointsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="category" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                            <Bar dataKey="developers" name="Avg Dev Points" fill="#f97316" radius={[6, 6, 0, 0]} barSize={40} />
                            <Bar dataKey="qa" name="Avg QA Points" fill="#a855f7" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Quality Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-gray-800 mb-1">Quality Metrics</h3>
                <p className="text-xs text-gray-500 mb-6">Blocked Tasks vs Bugs Found</p>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={issuesData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="category" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                            <Bar dataKey="developers" name="Blocked Tasks" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={40} />
                            <Bar dataKey="qa" name="Bugs Found" fill="#ec4899" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
