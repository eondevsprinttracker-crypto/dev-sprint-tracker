"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Image from "next/image";

interface NavbarProps {
    userName: string;
    userRole: "PM" | "Developer";
    userImage?: string;
}

export default function Navbar({ userName, userRole, userImage }: NavbarProps) {
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
        <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
            ? 'bg-white/80 backdrop-blur-2xl shadow-xl border-b border-gray-200/50'
            : 'bg-white/70 backdrop-blur-xl border-b border-gray-100'
            }`}>
            <div className="max-w-full mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo & Brand */}
                    <div className="flex items-center gap-4">
                        {/* Compact Logo */}
                        <div className="relative group cursor-pointer">
                            <div className="absolute -inset-1 bg-linear-to-r from-orange-500 to-pink-500 rounded-lg blur opacity-0 group-hover:opacity-25 transition duration-500"></div>
                            <div className="relative bg-white p-2 rounded-lg border border-gray-200 group-hover:border-orange-300 transition-all duration-300 shadow-sm">
                                <img
                                    src="/eontech-logo.png"
                                    alt="EonTech"
                                    className="h-7 w-auto object-contain"
                                />
                            </div>
                        </div>

                        {/* App Title - Sleek Design */}
                        <div className="hidden sm:flex items-center gap-3">
                            <div className="h-8 w-px bg-linear-to-b from-transparent via-gray-300 to-transparent"></div>
                            <div>
                                <h1 className="text-lg font-bold tracking-tight">
                                    <span className="text-gray-900">Dev</span>
                                    <span className="bg-linear-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">Sprint</span>
                                </h1>
                            </div>
                        </div>

                        {/* Role Badge - Minimal */}
                        <div className="hidden md:block ml-2">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${userRole === "PM"
                                ? "bg-orange-100 text-orange-700 border border-orange-200"
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                                }`}>
                                {userRole === "PM" ? "PM" : "Dev"}
                            </span>
                        </div>
                    </div>

                    {/* User Profile & Actions */}
                    <div className="flex items-center gap-3">
                        {/* User Name - Desktop Only */}
                        <div className="hidden lg:block text-right mr-2">
                            <p className="text-sm font-semibold text-gray-900">{userName}</p>
                            <p className="text-xs text-gray-500">{userRole}</p>
                        </div>

                        {/* Profile Avatar with Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="relative group/avatar focus:outline-none"
                            >
                                {/* Animated gradient ring */}
                                <div className="absolute -inset-1 bg-linear-to-r from-orange-400 via-pink-500 to-orange-400 rounded-full blur-lg opacity-40 group-hover/avatar:opacity-70 animate-spin-slow transition-all duration-500"></div>

                                {/* Avatar Container */}
                                <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-2xl shadow-orange-500/30 group-hover/avatar:scale-105 transition-all duration-300 bg-linear-to-br from-orange-400 to-orange-600">
                                    {userImage ? (
                                        <Image
                                            src={userImage}
                                            alt={userName}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">
                                                {userName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Online indicator */}
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white shadow-lg shadow-emerald-500/50">
                                    <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
                                </div>
                            </button>

                            {/* Dropdown Menu - Modern Design */}
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-3 w-72 animate-scale-in-bounce origin-top-right">
                                    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                                        {/* User info card in dropdown */}
                                        <div className="p-4 bg-linear-to-br from-gray-50 to-white border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                {/* Avatar in dropdown */}
                                                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 bg-linear-to-br from-orange-400 to-orange-600 shrink-0">
                                                    {userImage ? (
                                                        <Image
                                                            src={userImage}
                                                            alt={userName}
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <span className="text-white font-bold text-lg">
                                                                {userName.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                                                    <p className="text-xs text-gray-600">{userRole}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Menu items */}
                                        <div className="p-2">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full group/logout px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200 flex items-center gap-3"
                                            >
                                                <div className="p-1.5 bg-gray-100 rounded-lg group-hover/logout:bg-red-100 transition-colors">
                                                    <svg className="w-4 h-4 text-gray-600 group-hover/logout:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                </div>
                                                <span>Sign out</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtle bottom border */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-gray-300 to-transparent"></div>
        </nav>
    );
}

