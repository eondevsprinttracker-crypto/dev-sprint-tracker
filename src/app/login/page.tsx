"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider, signInWithPopup } from "@/lib/firebase";
import Link from "next/link";
import { loginWithGoogle } from "@/app/actions/authActions";

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleGoogleSignIn() {
        setLoading(true);
        setError("");

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const loginResult = await loginWithGoogle({
                email: user.email!,
                name: user.displayName || user.email!.split("@")[0],
                googleId: user.uid,
                photoURL: user.photoURL || undefined,
            });

            if (loginResult.success) {
                router.push("/dashboard");
                router.refresh();
            } else {
                setError(loginResult.error || "Login failed");
                setLoading(false);
            }
        } catch (err: unknown) {
            console.error("Google sign-in error:", err);
            if (err instanceof Error && err.message.includes("popup-closed")) {
                setError("Sign-in cancelled");
            } else {
                setError("Failed to sign in with Google");
            }
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Premium Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Gradient orbs */}
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-orange-600/15 rounded-full blur-[100px] animate-blob" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[80px] animate-blob" style={{ animationDelay: '2s' }} />
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
                    <p className="text-neutral-400">Track your weekly performance</p>
                </div>

                {/* Login Card */}
                <div className="glass-modal rounded-2xl p-8 animate-scale-in-bounce relative overflow-hidden">
                    {/* Card shine effect */}
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shine_3s_ease-in-out_infinite]"></div>
                    </div>

                    <h2 className="text-2xl font-semibold text-white mb-2 text-center">Developer Sign In</h2>
                    <p className="text-neutral-500 text-sm text-center mb-6">Sign in with your Google account</p>

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

                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="group w-full py-4 px-4 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-1 relative overflow-hidden"
                    >
                        {/* Button shine */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                        {loading ? (
                            <span className="flex items-center justify-center gap-2 relative">
                                <svg className="animate-spin h-5 w-5 text-orange-600" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span className="text-gray-600">Signing in...</span>
                            </span>
                        ) : (
                            <>
                                <svg className="w-5 h-5 relative" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="relative">Continue with Google</span>
                            </>
                        )}
                    </button>

                    <div className="mt-6 text-center">
                        <p className="text-neutral-500 text-sm">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="text-orange-400 hover:text-orange-300 font-medium transition-colors hover:underline">
                                Register
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Developer Note Card */}
                <div className="mt-6 p-4 glass rounded-xl border border-neutral-800/50 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <p className="text-neutral-400 text-xs text-center mb-2 flex items-center justify-center gap-2">
                        <span className="p-1 bg-orange-500/10 rounded-lg">
                            <svg className="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </span>
                        Developers sign in with their Google account
                    </p>
                    <div className="divider-gradient my-3"></div>
                    <p className="text-neutral-500 text-xs text-center">
                        Are you a PM?{" "}
                        <Link href="/pm-login" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
                            PM Login Portal →
                        </Link>
                    </p>
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
