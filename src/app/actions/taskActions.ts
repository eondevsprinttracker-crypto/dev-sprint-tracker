"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Task, { COMPLEXITY_POINTS, TaskComplexity, TaskStatus } from "@/models/Task";
import mongoose from "mongoose";

// Helper to get current user
async function getCurrentUser() {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }
    return session.user;
}

// Helper to get current week number
function getCurrentWeekNumber(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
}

/**
 * Create a new task - PM only
 */
export async function createTask(formData: FormData) {
    const user = await getCurrentUser();

    if (user.role !== "PM") {
        return { success: false, error: "Only PMs can create tasks" };
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const assignedTo = formData.get("assignedTo") as string;
    const complexity = formData.get("complexity") as TaskComplexity;
    const estimatedHours = parseFloat(formData.get("estimatedHours") as string);
    const scheduledStartDateStr = formData.get("scheduledStartDate") as string;
    const scheduledEndDateStr = formData.get("scheduledEndDate") as string;
    const projectId = formData.get("projectId") as string | null;
    const sprintId = formData.get("sprintId") as string | null;
    const priority = (formData.get("priority") as string) || "Medium";
    const storyPoints = parseInt(formData.get("storyPoints") as string) || COMPLEXITY_POINTS[complexity];

    if (!title || !assignedTo || !complexity || !estimatedHours) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        await dbConnect();

        const task = await Task.create({
            title,
            description: description || "",
            assignedTo: new mongoose.Types.ObjectId(assignedTo),
            createdBy: new mongoose.Types.ObjectId(user.id),
            project: projectId ? new mongoose.Types.ObjectId(projectId) : undefined,
            sprint: sprintId ? new mongoose.Types.ObjectId(sprintId) : undefined,
            complexity,
            points: COMPLEXITY_POINTS[complexity],
            storyPoints,
            priority,
            estimatedHours,
            scheduledStartDate: scheduledStartDateStr ? new Date(scheduledStartDateStr) : undefined,
            scheduledEndDate: scheduledEndDateStr ? new Date(scheduledEndDateStr) : undefined,
            weekNumber: getCurrentWeekNumber(),
            status: "Todo",
        });

        revalidatePath("/dashboard");
        if (sprintId) {
            revalidatePath(`/dashboard/pm/sprints/${sprintId}`);
        }
        return { success: true, taskId: task._id.toString() };
    } catch (error) {
        console.error("Create task error:", error);
        return { success: false, error: "Failed to create task" };
    }
}

/**
 * Update task - PM only
 */
export async function updateTask(
    taskId: string,
    data: {
        title?: string;
        description?: string;
        assignedTo?: string;
        complexity?: string;
        estimatedHours?: number;
        scheduledStartDate?: string;
        scheduledEndDate?: string;
    }
) {
    const user = await getCurrentUser();

    if (user.role !== "PM") {
        return { success: false, error: "Only PMs can update tasks" };
    }

    try {
        await dbConnect();

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        // Update fields if provided
        if (data.title) task.title = data.title;
        if (data.description !== undefined) task.description = data.description;
        if (data.assignedTo) task.assignedTo = new mongoose.Types.ObjectId(data.assignedTo);
        if (data.complexity) {
            task.complexity = data.complexity as TaskComplexity;
            task.points = COMPLEXITY_POINTS[data.complexity as TaskComplexity];
        }
        if (data.estimatedHours) task.estimatedHours = data.estimatedHours;
        if (data.scheduledStartDate) task.scheduledStartDate = new Date(data.scheduledStartDate);
        if (data.scheduledEndDate) task.scheduledEndDate = new Date(data.scheduledEndDate);

        await task.save();

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Update task error:", error);
        return { success: false, error: "Failed to update task" };
    }
}

/**
 * Delete task - PM only
 */
export async function deleteTask(taskId: string) {
    const user = await getCurrentUser();

    if (user.role !== "PM") {
        return { success: false, error: "Only PMs can delete tasks" };
    }

    try {
        await dbConnect();

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        await Task.findByIdAndDelete(taskId);

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Delete task error:", error);
        return { success: false, error: "Failed to delete task" };
    }
}

/**
 * Get team statistics for PM dashboard
 */
export async function getTeamStats() {
    const user = await getCurrentUser();

    if (user.role !== "PM") {
        return { success: false, error: "Unauthorized", stats: [] };
    }

    try {
        await dbConnect();

        const stats = await Task.aggregate([
            {
                $group: {
                    _id: "$assignedTo",
                    totalTasks: { $sum: 1 },
                    completedTasks: {
                        $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
                    },
                    inProgressTasks: {
                        $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] },
                    },
                    blockedTasks: {
                        $sum: { $cond: [{ $eq: ["$isBlocked", true] }, 1, 0] },
                    },
                    totalPoints: {
                        $sum: { $cond: [{ $eq: ["$status", "Completed"] }, "$points", 0] },
                    },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {
                $project: {
                    _id: 1,
                    name: "$user.name",
                    email: "$user.email",
                    totalTasks: 1,
                    completedTasks: 1,
                    inProgressTasks: 1,
                    blockedTasks: 1,
                    totalPoints: 1,
                },
            },
            {
                $sort: { totalTasks: -1 },
            },
        ]);

        return { success: true, stats: JSON.parse(JSON.stringify(stats)) };
    } catch (error) {
        console.error("Get team stats error:", error);
        return { success: false, error: "Failed to fetch team stats", stats: [] };
    }
}

/**
 * Unblock a task - PM only
 */
export async function unblockTask(taskId: string) {
    const user = await getCurrentUser();

    if (user.role !== "PM") {
        return { success: false, error: "Only PMs can unblock tasks" };
    }

    try {
        await dbConnect();

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        task.isBlocked = false;
        task.blockerNote = "";
        await task.save();

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Unblock task error:", error);
        return { success: false, error: "Failed to unblock task" };
    }
}

/**
 * Mark task as pending review with proof - Developer only
 */
export async function markAsPending(taskId: string, proofUrl: string) {
    const user = await getCurrentUser();

    if (user.role !== "Developer") {
        return { success: false, error: "Only developers can submit for review" };
    }

    if (!proofUrl) {
        return { success: false, error: "Proof URL is required" };
    }

    try {
        await dbConnect();

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        if (task.assignedTo.toString() !== user.id) {
            return { success: false, error: "You can only update your own tasks" };
        }

        if (task.status !== "In Progress" && task.status !== "Changes Requested") {
            return { success: false, error: "Task must be In Progress to submit for review" };
        }

        // Auto-calculate hours if task was in progress and has start time
        if (task.status === "In Progress") {
            const now = new Date();

            // Macro time calculation
            if (task.startedAt) {
                const start = new Date(task.startedAt);
                const diffHours = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
                task.actualHours = (task.actualHours || 0) + diffHours;
                task.startedAt = undefined;
            }

            // Stop precise timer
            if (task.isTimerRunning && task.timerStartTime) {
                const timerStart = new Date(task.timerStartTime);
                const sessionSeconds = (now.getTime() - timerStart.getTime()) / 1000;
                task.totalSecondsSpent = (task.totalSecondsSpent || 0) + sessionSeconds;
                task.isTimerRunning = false;
                task.timerStartTime = undefined;
            }
        }


        // Calculate efficiency bonus
        const estimatedSeconds = task.estimatedHours * 3600;
        const actualSeconds = task.totalSecondsSpent || 0;

        let bonus = 0;
        // Base score is calculated when task is created/updated (points field), but here we calculate efficiency bonus

        if (actualSeconds < estimatedSeconds) {
            const savedHours = (estimatedSeconds - actualSeconds) / 3600;
            bonus = Math.round(savedHours * 10);
        } else if (actualSeconds > estimatedSeconds) {
            const overdueHours = (actualSeconds - estimatedSeconds) / 3600;
            const penalty = Math.round(overdueHours * 5);
            bonus = -penalty; // Deduct from score
        }

        task.efficiencyBonus = bonus;

        task.status = "Pending Review";
        task.proofUrl = proofUrl;
        await task.save();

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Mark as pending error:", error);
        return { success: false, error: "Failed to update task" };
    }
}

/**
 * Update task status - PM only (for approve/reject)
 */
export async function updateStatus(taskId: string, newStatus: "Completed" | "Changes Requested") {
    const user = await getCurrentUser();

    if (user.role !== "PM") {
        return { success: false, error: "Only PMs can approve or reject tasks" };
    }

    try {
        await dbConnect();

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        if (task.status !== "Pending Review") {
            return { success: false, error: "Task must be in Pending Review to approve/reject" };
        }

        task.status = newStatus;
        await task.save();

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Update status error:", error);
        return { success: false, error: "Failed to update task status" };
    }
}

/**
 * Update task status for developers (Todo -> In Progress)
 */
export async function startTask(taskId: string) {
    const user = await getCurrentUser();

    if (user.role !== "Developer") {
        return { success: false, error: "Only developers can start tasks" };
    }

    try {
        await dbConnect();

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        if (task.assignedTo.toString() !== user.id) {
            return { success: false, error: "You can only start your own tasks" };
        }

        if (task.status !== "Todo" && task.status !== "Changes Requested") {
            return { success: false, error: "Task must be Todo or Changes Requested to start" };
        }

        task.status = "In Progress";
        task.startedAt = new Date();
        task.isTimerRunning = true;
        task.timerStartTime = new Date();
        await task.save();

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Start task error:", error);
        return { success: false, error: "Failed to start task" };
    }
}

/**
 * Start timer for task
 */
export async function startTimer(taskId: string) {
    const user = await getCurrentUser();

    if (user.role !== "Developer") {
        return { success: false, error: "Only developers can use the timer" };
    }

    try {
        await dbConnect();

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        if (task.assignedTo.toString() !== user.id) {
            return { success: false, error: "You can only track time for your own tasks" };
        }

        if (task.isTimerRunning) {
            return { success: false, error: "Timer is already running" };
        }

        task.isTimerRunning = true;
        task.timerStartTime = new Date();

        // Also update status to In Progress if it's Todo
        if (task.status === "Todo") {
            task.status = "In Progress";
        }

        await task.save();

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Start timer error:", error);
        return { success: false, error: "Failed to start timer" };
    }
}

/**
 * Stop timer for task
 */
export async function stopTimer(taskId: string) {
    const user = await getCurrentUser();

    if (user.role !== "Developer") {
        return { success: false, error: "Only developers can use the timer" };
    }

    try {
        await dbConnect();

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        if (task.assignedTo.toString() !== user.id) {
            return { success: false, error: "You can only track time for your own tasks" };
        }

        if (!task.isTimerRunning || !task.timerStartTime) {
            return { success: false, error: "Timer is not running" };
        }

        const now = new Date();
        const startTime = new Date(task.timerStartTime);
        const sessionSeconds = (now.getTime() - startTime.getTime()) / 1000;

        task.totalSecondsSpent = (task.totalSecondsSpent || 0) + sessionSeconds;
        task.actualHours = (task.totalSecondsSpent / 3600); // Sync actualHours for display
        task.isTimerRunning = false;
        task.timerStartTime = undefined; // Set to null/undefined

        await task.save();

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Stop timer error:", error);
        return { success: false, error: "Failed to stop timer" };
    }
}

/**
 * Log hours worked - Developer only
 */
export async function logHours(taskId: string, hours: number) {
    const user = await getCurrentUser();

    if (user.role !== "Developer") {
        return { success: false, error: "Only developers can log hours" };
    }

    if (hours <= 0) {
        return { success: false, error: "Hours must be positive" };
    }

    try {
        await dbConnect();

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        if (task.assignedTo.toString() !== user.id) {
            return { success: false, error: "You can only log hours on your own tasks" };
        }

        task.actualHours = (task.actualHours || 0) + hours;
        await task.save();

        revalidatePath("/dashboard");
        return { success: true, newTotal: task.actualHours };
    } catch (error) {
        console.error("Log hours error:", error);
        return { success: false, error: "Failed to log hours" };
    }
}

/**
 * Toggle blocker status
 */
export async function toggleBlocker(taskId: string, blockerNote?: string) {
    const user = await getCurrentUser();

    try {
        await dbConnect();

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        // Developers can only toggle their own tasks
        if (user.role === "Developer" && task.assignedTo.toString() !== user.id) {
            return { success: false, error: "You can only update your own tasks" };
        }

        task.isBlocked = !task.isBlocked;
        if (task.isBlocked && blockerNote) {
            task.blockerNote = blockerNote;
        } else if (!task.isBlocked) {
            task.blockerNote = "";
        }
        await task.save();

        revalidatePath("/dashboard");
        return { success: true, isBlocked: task.isBlocked };
    } catch (error) {
        console.error("Toggle blocker error:", error);
        return { success: false, error: "Failed to toggle blocker" };
    }
}

/**
 * Post a comment on a task
 */
export async function postComment(taskId: string, text: string) {
    const user = await getCurrentUser();

    if (!text.trim()) {
        return { success: false, error: "Comment cannot be empty" };
    }

    try {
        await dbConnect();

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        task.comments.push({
            user: new mongoose.Types.ObjectId(user.id),
            text: text.trim(),
            timestamp: new Date(),
        });
        await task.save();

        revalidatePath("/dashboard");
        revalidatePath(`/dashboard/task/${taskId}`);
        return { success: true };
    } catch (error) {
        console.error("Post comment error:", error);
        return { success: false, error: "Failed to post comment" };
    }
}

/**
 * Get tasks for developer
 */
export async function getMyTasks() {
    const user = await getCurrentUser();

    try {
        await dbConnect();

        const tasks = await Task.find({ assignedTo: user.id })
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 })
            .lean();

        return { success: true, tasks: JSON.parse(JSON.stringify(tasks)) };
    } catch (error) {
        console.error("Get my tasks error:", error);
        return { success: false, error: "Failed to fetch tasks", tasks: [] };
    }
}

/**
 * Get all tasks for PM
 */
export async function getAllTasks() {
    const user = await getCurrentUser();

    if (user.role !== "PM") {
        return { success: false, error: "Unauthorized", tasks: [] };
    }

    try {
        await dbConnect();

        const tasks = await Task.find({})
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 })
            .lean();

        return { success: true, tasks: JSON.parse(JSON.stringify(tasks)) };
    } catch (error) {
        console.error("Get all tasks error:", error);
        return { success: false, error: "Failed to fetch tasks", tasks: [] };
    }
}

/**
 * Get pending review tasks for PM
 */
export async function getPendingReviewTasks() {
    const user = await getCurrentUser();

    if (user.role !== "PM") {
        return { success: false, error: "Unauthorized", tasks: [] };
    }

    try {
        await dbConnect();

        const tasks = await Task.find({ status: "Pending Review" })
            .populate("assignedTo", "name email")
            .sort({ updatedAt: -1 })
            .lean();

        return { success: true, tasks: JSON.parse(JSON.stringify(tasks)) };
    } catch (error) {
        console.error("Get pending tasks error:", error);
        return { success: false, error: "Failed to fetch tasks", tasks: [] };
    }
}

/**
 * Get developer leaderboard for current week
 */
export async function getLeaderboard() {
    const user = await getCurrentUser();
    const currentWeek = getCurrentWeekNumber();

    try {
        await dbConnect();

        const leaderboard = await Task.aggregate([
            {
                $match: {
                    status: "Completed",
                    weekNumber: currentWeek,
                },
            },
            {
                $group: {
                    _id: "$assignedTo",
                    totalPoints: { $sum: "$points" },
                    completedTasks: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {
                $project: {
                    _id: 1,
                    totalPoints: 1,
                    completedTasks: 1,
                    name: "$user.name",
                    email: "$user.email",
                },
            },
            {
                $sort: { totalPoints: -1 },
            },
        ]);

        return { success: true, leaderboard: JSON.parse(JSON.stringify(leaderboard)), weekNumber: currentWeek };
    } catch (error) {
        console.error("Get leaderboard error:", error);
        return { success: false, error: "Failed to fetch leaderboard", leaderboard: [] };
    }
}

/**
 * Get all developers (for task assignment)
 */
export async function getDevelopers() {
    const user = await getCurrentUser();

    if (user.role !== "PM") {
        return { success: false, error: "Unauthorized", developers: [] };
    }

    try {
        await dbConnect();

        const developers = await (await import("@/models/User")).default
            .find({ role: "Developer" })
            .select("_id name email")
            .lean();

        return { success: true, developers: JSON.parse(JSON.stringify(developers)) };
    } catch (error) {
        console.error("Get developers error:", error);
        return { success: false, error: "Failed to fetch developers", developers: [] };
    }
}

/**
 * Get task by ID with comments
 */
export async function getTaskById(taskId: string) {
    await getCurrentUser();

    try {
        await dbConnect();

        const task = await Task.findById(taskId)
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email role")
            .populate("comments.user", "name email")
            .lean();

        if (!task) {
            return { success: false, error: "Task not found", task: null };
        }

        return { success: true, task: JSON.parse(JSON.stringify(task)) };
    } catch (error) {
        console.error("Get task error:", error);
        return { success: false, error: "Failed to fetch task", task: null };
    }
}

/**
 * Change task status - Developer can move between allowed states
 */
export async function changeTaskStatus(taskId: string, newStatus: TaskStatus) {
    const user = await getCurrentUser();

    if (user.role !== "Developer") {
        return { success: false, error: "Only developers can change task status" };
    }

    try {
        await dbConnect();

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        if (task.assignedTo.toString() !== user.id) {
            return { success: false, error: "You can only update your own tasks" };
        }

        const oldStatus = task.status;

        // If status isn't changing, do nothing
        if (oldStatus === newStatus) {
            return { success: true };
        }

        const now = new Date();

        // 1. If moving FROM In Progress, stop the timer
        if (oldStatus === "In Progress") {
            // Logic for auto-detecting time from startAt (Macro)
            if (task.startedAt) {
                const start = new Date(task.startedAt);
                const diffHours = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
                task.actualHours = (task.actualHours || 0) + diffHours;
                task.startedAt = undefined;
            }

            // Logic for stopping precise timer
            if (task.isTimerRunning && task.timerStartTime) {
                const timerStart = new Date(task.timerStartTime);
                const sessionSeconds = (now.getTime() - timerStart.getTime()) / 1000;
                task.totalSecondsSpent = (task.totalSecondsSpent || 0) + sessionSeconds;
                // actualHours is already updated above by macro logic, or should we overwrite?
                // To avoid double counting, let's rely on macro logic for 'hours' display consistency across sessions
                // but keep totalSecondsSpent accurate for stopwatch.
                // Actually, macro logic is more robust against page reloads if timerStartTime wasn't persisted properly?
                // No, timerStartTime IS persisted.
                // Let's rely on timerStartTime for precision if it exists.
                // If we use both, we might add time twice.
                // Let's decide: 'startedAt' is when the status CHANGED. 'timerStartTime' is the same.
                // So both calculations represent the same duration. We should only apply one.
                // Since we are standardizing on "Auto Timer", let's prioritize the macro "startedAt" for actualHours
                // as it's been the source of truth so far, AND update totalSecondsSpent for the timer UI next time.
            }

            task.isTimerRunning = false;
            task.timerStartTime = undefined;
        }

        // 2. If moving TO In Progress, start the timer
        if (newStatus === "In Progress") {
            task.startedAt = new Date();
            task.isTimerRunning = true;
            task.timerStartTime = new Date();
        }

        task.status = newStatus;
        await task.save();

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Change status error:", error);
        return { success: false, error: "Failed to update status" };
    }
}
