import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format hours into a readable "Xh Ym" string.
 * @param hours Total hours (can be decimal)
 * @returns Formatted string (e.g. "1h 30m", "0h 45m")
 */
export function formatDuration(hours: number): string {
    if (hours === 0) return "0h 0m";

    // Handle negative values (for variance)
    const sign = hours < 0 ? "-" : "";
    const absHours = Math.abs(hours);

    // If very small but not 0 (e.g. < 36s), show < 1m 
    // minimal 0.01h is 36s. Let's keep the logic simple first.
    if (absHours < 0.01) return "< 1m";

    const totalSeconds = Math.round(absHours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);

    return `${sign}${h}h ${m}m`;
}
