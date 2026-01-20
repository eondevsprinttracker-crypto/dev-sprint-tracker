"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";

interface NavbarProps {
    userName: string;
    userRole: "PM" | "Developer";
}

export default function Navbar({ userName, userRole }: NavbarProps) {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    async function handleLogout() {
        // Use client-side signOut which works properly on Netlify
        await signOut({ callbackUrl: "/login", redirect: true });
    }

    return (
        <nav className={`sticky top-0 z-50 transition-all duration-500 ${scrolled
            ? 'bg-[#0a0a0a]/98 backdrop-blur-3xl shadow-2xl shadow-black/40 border-b border-orange-500/20'
            : 'bg-gradient-to-b from-[#0a0a0a]/95 to-[#0a0a0a]/90 backdrop-blur-2xl border-b border-orange-500/10'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo & Brand */}
                    <div className="flex items-center gap-6">
                        {/* EonTech Logo with Enhanced Animation */}
                        <div className="relative group cursor-pointer">
                            {/* Animated glow background */}
                            <div className="absolute -inset-2 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-all duration-700 animate-pulse-orange"></div>

                            {/* Logo container */}
                            <div className="relative bg-gradient-to-br from-neutral-900 to-black p-2.5 rounded-xl border border-orange-500/20 group-hover:border-orange-500/50 transition-all duration-300 group-hover:scale-105">
                                <img
                                    src="/eontech-logo.png"
                                    alt="Eontech Logo"
                                    className="h-9 w-auto object-contain relative"
                                />
                            </div>
                        </div>

                        {/* Elegant Divider */}
                        <div className="hidden md:flex items-center gap-6">
                            <div className="h-10 w-px bg-gradient-to-b from-transparent via-orange-500/40 to-transparent"></div>

                            {/* App Title with Gradient Animation */}
                            <div className="flex flex-col gap-0.5">
                                <h1 className="text-xl font-black tracking-tight flex items-center gap-1.5">
                                    <span className="text-white">Dev</span>
                                    <span className="gradient-text-fire animate-gradient">Sprint</span>
                                </h1>
                                <div className="h-0.5 w-12 bg-gradient-to-r from-orange-500 to-transparent rounded-full"></div>
                            </div>

                            {/* Role Badge with Enhanced Design */}
                            <div className="relative group/badge">
                                <div className={`absolute -inset-0.5 rounded-full blur-sm opacity-40 group-hover/badge:opacity-70 transition-opacity ${userRole === "PM"
                                    ? "bg-gradient-to-r from-orange-500 to-orange-600"
                                    : "bg-gradient-to-r from-blue-500 to-blue-600"
                                    }`}></div>
                                <span
                                    className={`relative px-4 py-2 text-xs font-bold rounded-full border backdrop-blur-xl transition-all duration-300 flex items-center gap-2 ${userRole === "PM"
                                        ? "bg-gradient-to-r from-orange-500/20 to-orange-600/15 text-orange-200 border-orange-500/40 shadow-lg shadow-orange-500/20 group-hover/badge:shadow-orange-500/30"
                                        : "bg-gradient-to-r from-blue-500/20 to-blue-600/15 text-blue-200 border-blue-500/40 shadow-lg shadow-blue-500/20 group-hover/badge:shadow-blue-500/30"
                                        }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${userRole === "PM" ? "bg-orange-400" : "bg-blue-400"
                                        }`}></span>
                                    {userRole === "PM" ? "Project Manager" : "Developer"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* User Profile & Actions */}
                    <div className="flex items-center gap-4">
                        {/* User Info Card - Hidden on Mobile */}
                        <div className="hidden lg:flex items-center gap-4 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:border-orange-500/30">
                            <div className="text-right">
                                <p className="text-sm font-bold text-white tracking-wide">{userName}</p>
                                <p className="text-xs text-orange-400/70 font-medium">{userRole}</p>
                            </div>
                        </div>

                        {/* Profile Avatar with Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="relative group/avatar"
                            >
                                {/* Rotating gradient ring */}
                                <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 rounded-full blur-md opacity-50 group-hover/avatar:opacity-80 transition-all duration-500 animate-spin-slow"></div>

                                {/* Avatar */}
                                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 flex items-center justify-center border-2 border-orange-400/50 shadow-xl shadow-orange-500/30 group-hover/avatar:scale-110 transition-transform duration-300">
                                    <span className="text-white font-black text-base">
                                        {userName.charAt(0).toUpperCase()}
                                    </span>
                                </div>

                                {/* Online indicator */}
                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0a0a0a] shadow-lg shadow-emerald-500/50 animate-pulse"></div>
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-3 w-64 animate-scale-in-bounce origin-top-right">
                                    <div className="glass-modal rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                                        {/* User info in dropdown */}
                                        <div className="p-4 border-b border-white/10 bg-gradient-to-br from-orange-500/10 to-transparent">
                                            <p className="text-sm font-bold text-white mb-0.5">{userName}</p>
                                            <p className="text-xs text-orange-400/80">{userRole}</p>
                                        </div>

                                        {/* Menu items */}
                                        <div className="p-2">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full group/logout px-4 py-3 text-left text-sm font-medium text-neutral-300 hover:text-white rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all duration-300 flex items-center gap-3"
                                            >
                                                <div className="p-2 bg-red-500/20 rounded-lg group-hover/logout:bg-red-500/30 transition-colors">
                                                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                </div>
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced bottom glow line with animation */}
            <div className="absolute bottom-0 left-0 right-0 h-px">
                <div className="h-full bg-gradient-to-r from-transparent via-orange-500/40 to-transparent"></div>
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/60 to-transparent transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'
                    }`}></div>
            </div>

            {/* Ambient light effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-700"></div>
        </nav>
    );
}
