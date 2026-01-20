"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
    const searchParams = useSearchParams();
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
            href: "/dashboard/pm/projects",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
        },
        {
            name: "All Tasks",
            href: "/dashboard/pm/tasks",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
        },
        {
            name: "Team",
            href: "/dashboard/pm/team",
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

    // Helper function to check if a navigation item is active
    const isItemActive = (itemHref: string) => {
        // Parse the href to extract base path and query params
        const [basePath, queryString] = itemHref.split('?');

        // For exact path matches (without query params)
        if (!queryString) {
            return pathname === basePath;
        }

        // Check if the base path matches
        if (pathname !== basePath) {
            return false;
        }

        // Parse the expected query params from the href
        const expectedParams = new URLSearchParams(queryString);

        // Check if all expected params match the current search params
        for (const [key, value] of expectedParams.entries()) {
            if (searchParams.get(key) !== value) {
                return false;
            }
        }

        return true;
    };

    return (
        <>
            {/* Modern Sidebar */}
            {/* Modern Sidebar */}
            <aside
                className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-40 transition-all duration-300 ${collapsed ? "w-16" : "w-64"
                    }`}
            >
                {/* Toggle Section - Minimal */}
                <div className="h-12 flex items-center justify-end px-3">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <svg
                            className={`w-5 h-5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""
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
                <nav className="p-3 space-y-1 mt-2">
                    {navItems.map((item, index) => {
                        const isActive = isItemActive(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                    ? "bg-linear-to-r from-orange-50 to-pink-50 text-orange-600 shadow-sm"
                                    : "text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                {/* Active indicator */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-linear-to-b from-orange-500 to-pink-500 rounded-r-full"></div>
                                )}

                                {/* Icon */}
                                <div className={`shrink-0 transition-colors duration-200 ${isActive
                                    ? "text-orange-600"
                                    : "text-gray-500 group-hover:text-gray-700"
                                    }`}>
                                    {item.icon}
                                </div>

                                {/* Label */}
                                {!collapsed && (
                                    <div className="flex-1 flex items-center justify-between">
                                        <span className={`text-sm font-medium transition-colors ${isActive ? "text-orange-600" : "text-gray-700 group-hover:text-gray-900"
                                            }`}>
                                            {item.name}
                                        </span>
                                        {item.badge && (
                                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Collapsed state indicator */}
                                {collapsed && isActive && (
                                    <div className="absolute right-1 w-1 h-1 bg-orange-500 rounded-full"></div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section - Minimal Tip */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200">
                    {!collapsed ? (
                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                            <div className="flex items-center gap-2 mb-1.5">
                                <svg className="w-3.5 h-3.5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs font-semibold text-gray-700">Quick Tip</span>
                            </div>
                            <p className="text-xs text-gray-600">
                                Press <kbd className="px-1.5 py-0.5 bg-white rounded text-orange-600 border border-gray-300 text-[10px] font-mono">⌘B</kbd> to toggle
                            </p>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Spacer to prevent content overlap */}
            <div className={`transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}></div>
        </>
    );
}

