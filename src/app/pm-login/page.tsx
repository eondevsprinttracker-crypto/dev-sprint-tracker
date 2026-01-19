"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginPM } from "@/app/actions/authActions";
import Link from "next/link";

export default function PMLoginPage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError("");

        const result = await loginPM(formData);

        if (result.success) {
            router.push("/dashboard");
            router.refresh();
        } else {
            setError(result.error || "Login failed");
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Premium Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Gradient orbs */}
                <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-orange-600/15 rounded-full blur-[100px] animate-blob" />
                <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[80px] animate-blob" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-orange-900/20 to-transparent rounded-full blur-[60px]" />

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>

                {/* Radial gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]"></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-slide-up">
                {/* Logo Section */}
                <div className="text-center mb-8">
                    {/* EonTech Logo */}
                    <div className="inline-flex items-center justify-center mb-6 relative">
                        <div className="absolute inset-0 bg-orange-500/20 rounded-2xl blur-xl animate-pulse-orange"></div>
                        <div className="relative p-4 bg-gradient-to-br from-[#111]/90 to-[#0a0a0a]/90 rounded-2xl border border-orange-500/20 shadow-2xl shadow-orange-500/10">
                            <img
                                src="/eontech-logo.png"
                                alt="Eontech"
                                className="h-12 w-auto object-contain animate-float-slow"
                            />
                        </div>
                    </div>

                    <h1 className="text-4xl font-bold mb-2">
                        <span className="text-white">Dev</span>
                        <span className="gradient-text-fire">Sprint</span>
                    </h1>
                    <p className="text-neutral-400">Project Manager Portal</p>
                </div>

                {/* Login Card */}
                <div className="glass-modal rounded-2xl p-8 animate-scale-in-bounce relative overflow-hidden">
                    {/* PM Badge */}
                    <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold rounded-bl-xl">
                        PM ACCESS
                    </div>

                    <div className="flex items-center justify-center mb-4">
                        <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-600/10 rounded-2xl border border-orange-500/20">
                            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                    </div>

                    <h2 className="text-2xl font-semibold text-white mb-6 text-center">PM Sign In</h2>

                    {error && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3 animate-scale-in">
                            <div className="p-1 bg-red-500/20 rounded-lg">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            {error}
                        </div>
                    )}

                    <form action={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="input-premium w-full"
                                placeholder="pm@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="input-premium w-full"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-neutral-500 text-sm">
                            Are you a developer?{" "}
                            <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors hover:underline">
                                Developer Login
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Test Credentials */}
                <div className="mt-6 p-4 glass rounded-xl border border-neutral-800/50 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="p-1 bg-orange-500/10 rounded-lg">
                            <svg className="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </span>
                        <p className="text-neutral-400 text-xs font-medium">Test PM Credentials</p>
                    </div>
                    <div className="text-center space-y-2 bg-black/30 rounded-lg p-4 border border-white/5">
                        <p className="text-orange-400 font-semibold text-sm">Project Manager</p>
                        <div className="flex items-center justify-center gap-2 text-neutral-400 font-mono text-xs">
                            <span className="px-2 py-1 bg-white/5 rounded">pm@test.com</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-neutral-500 font-mono text-xs">
                            <span className="px-2 py-1 bg-white/5 rounded">pm123456</span>
                        </div>
                    </div>
                </div>

                {/* Branding Footer */}
                <div className="mt-8 text-center">
                    <p className="text-neutral-600 text-xs flex items-center justify-center gap-2">
                        Powered by
                        <img src="/eontech-logo.png" alt="Eontech" className="h-4 w-auto opacity-60" />
                    </p>
                </div>
            </div>
        </div>
    );
}
