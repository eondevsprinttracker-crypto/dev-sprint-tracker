import { WORK_DAYS, EFFECTIVE_WORK_HOURS } from './constants';

export function calculateBusinessHours(start: Date, end: Date): number {
    let totalHours = 0;
    const current = new Date(start);
    const endDate = new Date(end);

    // Normalize dates to ignore time for day iteration logic if needed, 
    // but the requirement says "Iterate through days".
    // "If the range is within a single day, calculate (End - Start) - 1.5 hours"

    // Check if start and end are on the same day
    if (current.toDateString() === endDate.toDateString()) {
        if (!WORK_DAYS.includes(current.getDay())) {
            return 0;
        }

        const diffMs = endDate.getTime() - current.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // If the duration is long enough to include lunch, subtract it. 
        // Logic: "Current (End - Start) - 1.5 hours (if applicable)"
        // Simple heuristic: if difference > 5 hours, subtract 1.5. 
        // Or strictly follow "Effective Work Hours Per Day: 6.5 Hours" max.
        // Let's stick to the prompt's logic: "calculate (End - Start) - 1.5 hours"
        // But we must ensure non-negative.

        let hours = diffHours;
        if (hours > 5) { // Assuming lunch break applies for shift > 5h
            hours -= 1.5;
        }
        return Math.min(Math.max(hours, 0), EFFECTIVE_WORK_HOURS);
    }

    // Clone to iterate
    const iterDate = new Date(current);

    while (iterDate <= endDate) {
        const dayOfWeek = iterDate.getDay();

        if (WORK_DAYS.includes(dayOfWeek)) {
            // For start date (partial day)
            if (iterDate.toDateString() === start.toDateString()) {
                // Assume full day remaining from start time? 
                // Or just flat 6.5 for full days and handle partials?
                // Prompt: "For each valid work day, add max 6.5 hours."
                // Let's assume full days count as 6.5.
                // If the prompt implies precise calculation based on time:
                // "Iterate through days... For each valid work day, add max 6.5 hours."

                // Let's implement a simpler version that assumes full days for intermediate days
                // and maybe adjust for start/end?
                // The prompt is slightly ambiguous on partial days in a multi-day range.
                // "Usage: ... auto-fill hours" implies estimation.
                // Let's just sum 6.5 for every valid weekday in the range [start, end] inclusive.

                totalHours += EFFECTIVE_WORK_HOURS;
            } else if (iterDate.toDateString() === end.toDateString()) {
                totalHours += EFFECTIVE_WORK_HOURS;
            } else {
                totalHours += EFFECTIVE_WORK_HOURS;
            }
        }

        // Move to next day
        iterDate.setDate(iterDate.getDate() + 1);
    }

    // Refined logic based on "Usage: When PM selects Start/End dates ... populate estimatedHours"
    // Usually PM selects dates (reset to 00:00 or 09:00).
    // If we iterate days, we just count working days * 6.5.

    // Let's rewrite strictly to: Count working days between start and end (inclusive) * 6.5

    let workingDays = 0;
    const d = new Date(start);
    // Reset time to avoid issues with time comparison if inputs vary
    d.setHours(0, 0, 0, 0);
    const e = new Date(end);
    e.setHours(0, 0, 0, 0);

    while (d <= e) {
        if (WORK_DAYS.includes(d.getDay())) {
            workingDays++;
        }
        d.setDate(d.getDate() + 1);
    }

    return workingDays * EFFECTIVE_WORK_HOURS;
}
