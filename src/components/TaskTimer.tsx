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
        <div className="flex items-center">
            <div className={`group/timer relative flex items-center gap-3 px-3 py-2 rounded-2xl transition-all duration-500 overflow-hidden ${isRunning
                ? 'bg-emerald-500/5 ring-1 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
                : 'bg-white/[0.03] ring-1 ring-white/10 hover:bg-white/[0.05]'
                }`}>

                {/* Subtle Breathing Glow */}
                {isRunning && (
                    <div className="absolute inset-0 bg-emerald-500/[0.02] animate-pulse" style={{ animationDuration: '3s' }} />
                )}

                {/* Control Button - Integrated */}
                {showControls && (
                    <button
                        onClick={handleToggleTimer}
                        disabled={loading}
                        className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${loading
                            ? 'opacity-50 cursor-not-allowed'
                            : isRunning
                                ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                        title={isRunning ? "Pause" : "Start"}
                    >
                        {loading ? (
                            <svg className="w-4 h-4 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : isRunning ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>
                )}

                {/* Timer Display */}
                <div className="relative z-10 flex items-center gap-2.5 pr-1">
                    <div className="flex flex-col">
                        <span className={`font-mono text-xl font-bold tracking-tight leading-none ${isRunning ? 'text-emerald-400' : 'text-neutral-300'
                            }`}>
                            {formatTime(elapsedSeconds)}
                        </span>
                    </div>

                    {/* Status Dot */}
                    {isRunning && (
                        <div className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                    )}
                </div>
            </div>
        </div>
    );
}
