"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface SidebarProps {
    userRole: "PM" | "Developer";
}

interface NavItem {
    name: string;
    href: string;
    icon: React.ReactNode;
    badge?: number;
}

export default function Sidebar({ userRole }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    const pmNavItems: NavItem[] = [
        {
            name: "Overview",
            href: "/dashboard/pm",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            name: "Sprints",
            href: "/dashboard/pm/sprints",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
        },
        {
            name: "Projects",
            href: "/dashboard/pm?tab=projects",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
        },
        {
            name: "All Tasks",
            href: "/dashboard/pm?tab=tasks",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
        },
        {
            name: "Team",
            href: "/dashboard/pm?tab=team",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        },
    ];

    const devNavItems: NavItem[] = [
        {
            name: "My Tasks",
            href: "/dashboard/dev",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
        },
        {
            name: "Leaderboard",
            href: "/dashboard/dev?view=leaderboard",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
            ),
        },
    ];

    const navItems = userRole === "PM" ? pmNavItems : devNavItems;

    return (
        <>
            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-[#0a0a0a]/98 to-[#0a0a0a]/95 backdrop-blur-2xl border-r border-orange-500/10 z-40 transition-all duration-500 ease-in-out ${collapsed ? "w-20" : "w-72"
                    }`}
            >
                {/* Logo Section */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
                    {!collapsed && (
                        <div className="flex items-center gap-3 animate-fade-in">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition"></div>
                                <img
                                    src="/eontech-logo.png"
                                    alt="EonTech"
                                    className="h-8 w-auto relative"
                                />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white">
                                    Dev<span className="gradient-text-fire">Sprint</span>
                                </h2>
                                <p className="text-xs text-orange-400/60 font-medium">{userRole}</p>
                            </div>
                        </div>
                    )}

                    {/* Collapse Button */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/30 transition-all duration-300 group"
                    >
                        <svg
                            className={`w-5 h-5 text-orange-400 transition-transform duration-500 ${collapsed ? "rotate-180" : ""
                                }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2">
                    {navItems.map((item, index) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 overflow-hidden ${isActive
                                    ? "bg-gradient-to-r from-orange-500/20 to-orange-600/10 border border-orange-500/30 shadow-lg shadow-orange-500/20"
                                    : "hover:bg-white/5 border border-transparent hover:border-white/10"
                                    }`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Active indicator */}
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-orange-600 rounded-r-full"></div>
                                )}

                                {/* Hover glow */}
                                <div className={`absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isActive ? "opacity-100" : ""
                                    }`}></div>

                                {/* Icon */}
                                <div className={`relative z-10 p-2 rounded-lg transition-all duration-300 ${isActive
                                    ? "bg-orange-500/20 text-orange-400"
                                    : "bg-white/5 text-neutral-400 group-hover:bg-orange-500/10 group-hover:text-orange-400"
                                    }`}>
                                    {item.icon}
                                </div>

                                {/* Label */}
                                {!collapsed && (
                                    <div className="relative z-10 flex-1">
                                        <span className={`text-sm font-semibold transition-colors ${isActive ? "text-white" : "text-neutral-400 group-hover:text-white"
                                            }`}>
                                            {item.name}
                                        </span>
                                    </div>
                                )}

                                {/* Badge */}
                                {item.badge && !collapsed && (
                                    <div className="relative z-10 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full">
                                        <span className="text-xs font-bold text-orange-400">{item.badge}</span>
                                    </div>
                                )}

                                {/* Arrow indicator when collapsed */}
                                {collapsed && isActive && (
                                    <div className="absolute right-2 w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
                    {!collapsed ? (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-orange-500/20 rounded-lg">
                                    <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <span className="text-xs font-bold text-orange-300">Quick Tip</span>
                            </div>
                            <p className="text-xs text-neutral-400 leading-relaxed">
                                Use <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-orange-400">Ctrl+B</kbd> to toggle sidebar
                            </p>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <div className="p-2.5 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>

                {/* Ambient glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 via-transparent to-transparent pointer-events-none opacity-50"></div>
            </aside>

            {/* Spacer to prevent content overlap */}
            <div className={`transition-all duration-500 ${collapsed ? "w-20" : "w-72"}`}></div>
        </>
    );
}
