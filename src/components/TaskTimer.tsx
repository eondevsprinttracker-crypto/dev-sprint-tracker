"use client";

import { useState, useEffect, useCallback } from "react";
import { startTimer, stopTimer } from "@/app/actions/taskActions";

interface TaskTimerProps {
    taskId: string;
    initialIsRunning: boolean;
    initialStartTime: string | null;
    initialTotalSeconds: number;
    onUpdate?: () => void;
    showControls?: boolean;
}

export default function TaskTimer({
    taskId,
    initialIsRunning,
    initialStartTime,
    initialTotalSeconds,
    onUpdate,
    showControls = true
}: TaskTimerProps) {
    const [isRunning, setIsRunning] = useState(initialIsRunning);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [loading, setLoading] = useState(false);
    const [startTime, setStartTime] = useState(initialStartTime);
    const [totalSeconds, setTotalSeconds] = useState(initialTotalSeconds);

    useEffect(() => {
        setIsRunning(initialIsRunning);
        setStartTime(initialStartTime);
        setTotalSeconds(initialTotalSeconds);
    }, [initialIsRunning, initialStartTime, initialTotalSeconds]);

    const calculateTime = useCallback(() => {
        let currentSession = 0;
        if (isRunning && startTime) {
            const start = new Date(startTime).getTime();
            const now = new Date().getTime();
            currentSession = Math.max(0, Math.floor((now - start) / 1000));
        }
        return totalSeconds + currentSession;
    }, [isRunning, startTime, totalSeconds]);

    useEffect(() => {
        setElapsedSeconds(calculateTime());

        if (!isRunning) return;

        const interval = setInterval(() => {
            setElapsedSeconds(calculateTime());
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, calculateTime]);

    async function handleToggleTimer() {
        setLoading(true);
        try {
            if (isRunning) {
                const result = await stopTimer(taskId);
                if (result.success) {
                    const currentElapsed = calculateTime();
                    setTotalSeconds(currentElapsed);
                    setIsRunning(false);
                    setStartTime(null);
                    if (onUpdate) onUpdate();
                }
            } else {
                const result = await startTimer(taskId);
                if (result.success) {
                    setIsRunning(true);
                    setStartTime(new Date().toISOString());
                    if (onUpdate) onUpdate();
                }
            }
        } catch (error) {
            console.error("Timer toggle error:", error);
        }
        setLoading(false);
    }

    const formatTime = (totalSec: number) => {
        const total = Math.floor(totalSec);
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const seconds = total % 60;

        const pad = (n: number) => n.toString().padStart(2, '0');

        if (hours > 0) {
            return `${hours}:${pad(minutes)}:${pad(seconds)}`;
        }
        return `${pad(minutes)}:${pad(seconds)}`;
    };

    return (
        <div className="flex items-center gap-3">
            {/* Timer Display */}
            <div className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg ${isRunning
                    ? 'bg-emerald-500/15 border border-emerald-500/25'
                    : 'bg-black/30 border border-white/5'
                }`}>
                {/* Running pulse effect */}
                {isRunning && (
                    <div className="absolute inset-0 rounded-lg bg-emerald-500/5 animate-pulse-orange"></div>
                )}

                <span className={`relative font-mono text-lg font-bold tracking-wider ${isRunning ? 'text-emerald-400' : 'text-white'
                    }`}>
                    {formatTime(elapsedSeconds)}
                </span>

                {/* Running Indicator */}
                {isRunning && (
                    <div className="relative flex">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                )}
            </div>

            {/* Play/Pause Button */}
            {showControls && (
                <button
                    onClick={handleToggleTimer}
                    disabled={loading}
                    className={`group relative p-2.5 rounded-xl transition-all duration-300 ${loading
                        ? 'opacity-50 cursor-not-allowed'
                        : isRunning
                            ? 'bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 border border-orange-500/25 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/10'
                            : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/25 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10'
                        }`}
                    title={isRunning ? "Pause Timer" : "Start Timer"}
                >
                    {loading ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : isRunning ? (
                        <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 transition-transform group-hover:scale-110 group-hover:translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </button>
            )}
        </div>
    );
}
