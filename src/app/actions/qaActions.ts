"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import User from "@/models/User";
import mongoose from "mongoose";

// Helper to get current user
async function getCurrentUser() {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }
    return session.user;
}

/**
 * Get all QA members - PM only
 */
export async function getQAMembers() {
    const user = await getCurrentUser();

    if (user.role !== "PM") {
        return { success: false, error: "Unauthorized", qaMembers: [] };
    }

    try {
        await dbConnect();

        const qaMembers = await User.find({ role: "QA" })
            .select("_id name email")
            .lean();

        return { success: true, qaMembers: JSON.parse(JSON.stringify(qaMembers)) };
    } catch (error) {
        console.error("Get QA members error:", error);
        return { success: false, error: "Failed to fetch QA members", qaMembers: [] };
    }
}

/**
 * Get QA team statistics - PM only
 */
export async function getQAStats() {
    const user = await getCurrentUser();

    if (user.role !== "PM") {
        return { success: false, error: "Unauthorized", stats: [] };
    }

    try {
        await dbConnect();

        const stats = await Task.aggregate([
            {
                $match: {
                    assignedQA: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: "$assignedQA",
                    totalReviewed: { $sum: 1 },
                    approved: {
                        $sum: { $cond: [{ $eq: ["$qaReviewStatus", "Approved"] }, 1, 0] },
                    },
                    failed: {
                        $sum: { $cond: [{ $eq: ["$qaReviewStatus", "Failed"] }, 1, 0] },
                    },
                    pending: {
                        $sum: { $cond: [{ $eq: ["$status", "Pending QA"] }, 1, 0] },
                    },
                    totalBugsFound: { $sum: "$bugsFound" },
                    totalTimeSpent: { $sum: "$qaTimeSpent" },
                    totalPoints: {
                        $sum: { $cond: [{ $eq: ["$qaReviewStatus", "Approved"] }, "$points", 0] },
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
                    totalReviewed: 1,
                    approved: 1,
                    failed: 1,
                    pending: 1,
                    totalBugsFound: 1,
                    totalTimeSpent: 1,
                    totalPoints: 1,
                    passRate: {
                        $cond: [
                            { $gt: [{ $add: ["$approved", "$failed"] }, 0] },
                            { $multiply: [{ $divide: ["$approved", { $add: ["$approved", "$failed"] }] }, 100] },
                            0
                        ]
                    },
                    avgReviewTime: {
                        $cond: [
                            { $gt: ["$totalReviewed", 0] },
                            { $divide: ["$totalTimeSpent", "$totalReviewed"] },
                            0
                        ]
                    },
                },
            },
            {
                $sort: { totalPoints: -1 },
            },
        ]);

        return { success: true, stats: JSON.parse(JSON.stringify(stats)) };
    } catch (error) {
        console.error("Get QA stats error:", error);
        return { success: false, error: "Failed to fetch QA stats", stats: [] };
    }
}

/**
 * Get tasks pending QA review - QA only
 */
export async function getTasksForQAReview() {
    const user = await getCurrentUser();

    if (user.role !== "QA") {
        return { success: false, error: "Unauthorized", tasks: [] };
    }

    try {
        await dbConnect();

        const tasks = await Task.find({
            assignedQA: user.id,
            status: "Pending QA"
        })
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email")
            .sort({ updatedAt: -1 })
            .lean();

        return { success: true, tasks: JSON.parse(JSON.stringify(tasks)) };
    } catch (error) {
        console.error("Get tasks for QA review error:", error);
        return { success: false, error: "Failed to fetch tasks", tasks: [] };
    }
}

/**
 * Get all tasks assigned to QA - QA dashboard
 */
export async function getMyQATasks() {
    const user = await getCurrentUser();

    if (user.role !== "QA") {
        return { success: false, error: "Unauthorized", tasks: [] };
    }

    try {
        await dbConnect();

        const tasks = await Task.find({ assignedQA: user.id })
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email")
            .sort({ updatedAt: -1 })
            .lean();

        return { success: true, tasks: JSON.parse(JSON.stringify(tasks)) };
    } catch (error) {
        console.error("Get my QA tasks error:", error);
        return { success: false, error: "Failed to fetch tasks", tasks: [] };
    }
}

/**
 * Submit task for QA review (Developer) - updates from "In Progress" to "Pending QA"
 */
export async function submitForQAReview(taskId: string, proofUrl: string) {
    const user = await getCurrentUser();

    if (user.role !== "Developer") {
        return { success: false, error: "Only developers can submit for QA review" };
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
            return { success: false, error: "You can only submit your own tasks" };
        }

        // Task must have QA assigned to go to QA review
        if (!task.assignedQA) {
            return { success: false, error: "No QA assigned to this task. Submit directly for PM review." };
        }

        if (task.status !== "In Progress" && task.status !== "Changes Requested") {
            return { success: false, error: "Task must be In Progress or Changes Requested to submit for QA review" };
        }

        // Stop developer timer if running
        if (task.isTimerRunning && task.timerStartTime) {
            const now = new Date();
            const timerStart = new Date(task.timerStartTime);
            const sessionSeconds = (now.getTime() - timerStart.getTime()) / 1000;
            task.totalSecondsSpent = (task.totalSecondsSpent || 0) + sessionSeconds;
            task.isTimerRunning = false;
            task.timerStartTime = undefined;
        }

        task.status = "Pending QA";
        task.proofUrl = proofUrl;
        task.qaReviewStatus = "Pending";
        await task.save();

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Submit for QA review error:", error);
        return { success: false, error: "Failed to submit for QA review" };
    }
}

/**
 * QA approves task - moves to Pending Review (PM approval)
 */
export async function approveQAReview(taskId: string, notes?: string) {
    const user = await getCurrentUser();

    if (user.role !== "QA") {
        return { success: false, error: "Only QA can approve reviews" };
    }

    try {
        await dbConnect();

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        if (!task.assignedQA || task.assignedQA.toString() !== user.id) {
            return { success: false, error: "You are not assigned to review this task" };
        }

        if (task.status !== "Pending QA") {
            return { success: false, error: "Task must be in Pending QA status" };
        }

        // Stop QA timer if running
        if (task.isQATimerRunning && task.qaTimerStartTime) {
            const now = new Date();
            const timerStart = new Date(task.qaTimerStartTime);
            const sessionSeconds = (now.getTime() - timerStart.getTime()) / 1000;
            task.qaTimeSpent = (task.qaTimeSpent || 0) + sessionSeconds;
            task.isQATimerRunning = false;
            task.qaTimerStartTime = undefined;
        }

        task.status = "Pending Review";
        task.qaReviewStatus = "Approved";
        task.qaReviewNotes = notes || "";
        task.qaReviewedAt = new Date();
        await task.save();

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Approve QA review error:", error);
        return { success: false, error: "Failed to approve review" };
    }
}

/**
 * QA fails task - sends back to developer with feedback
 */
export async function failQAReview(taskId: string, notes: string, bugsFound: number = 1) {
    const user = await getCurrentUser();

    if (user.role !== "QA") {
        return { success: false, error: "Only QA can fail reviews" };
    }

    if (!notes) {
        return { success: false, error: "Please provide feedback notes for the developer" };
    }

    try {
        await dbConnect();

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        if (!task.assignedQA || task.assignedQA.toString() !== user.id) {
            return { success: false, error: "You are not assigned to review this task" };
        }

        if (task.status !== "Pending QA") {
            return { success: false, error: "Task must be in Pending QA status" };
        }

        // Stop QA timer if running
        if (task.isQATimerRunning && task.qaTimerStartTime) {
            const now = new Date();
            const timerStart = new Date(task.qaTimerStartTime);
            const sessionSeconds = (now.getTime() - timerStart.getTime()) / 1000;
            task.qaTimeSpent = (task.qaTimeSpent || 0) + sessionSeconds;
            task.isQATimerRunning = false;
            task.qaTimerStartTime = undefined;
        }

        task.status = "Changes Requested";
        task.qaReviewStatus = "Failed";
        task.qaReviewNotes = notes;
        task.bugsFound = (task.bugsFound || 0) + bugsFound;
        task.qaReviewedAt = new Date();
        await task.save();

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Fail QA review error:", error);
        return { success: false, error: "Failed to fail review" };
    }
}

/**
 * Start QA timer for a task
 */
export async function startQATimer(taskId: string) {
    const user = await getCurrentUser();

    if (user.role !== "QA") {
        return { success: false, error: "Only QA can use the QA timer" };
    }

    try {
        await dbConnect();

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        if (!task.assignedQA || task.assignedQA.toString() !== user.id) {
            return { success: false, error: "You are not assigned to review this task" };
        }

        if (task.isQATimerRunning) {
            return { success: false, error: "QA Timer is already running" };
        }

        task.isQATimerRunning = true;
        task.qaTimerStartTime = new Date();
        await task.save();

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Start QA timer error:", error);
        return { success: false, error: "Failed to start QA timer" };
    }
}

/**
 * Stop QA timer for a task
 */
export async function stopQATimer(taskId: string) {
    const user = await getCurrentUser();

    if (user.role !== "QA") {
        return { success: false, error: "Only QA can use the QA timer" };
    }

    try {
        await dbConnect();

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        if (!task.assignedQA || task.assignedQA.toString() !== user.id) {
            return { success: false, error: "You are not assigned to review this task" };
        }

        if (!task.isQATimerRunning || !task.qaTimerStartTime) {
            return { success: false, error: "QA Timer is not running" };
        }

        const now = new Date();
        const startTime = new Date(task.qaTimerStartTime);
        const sessionSeconds = (now.getTime() - startTime.getTime()) / 1000;

        task.qaTimeSpent = (task.qaTimeSpent || 0) + sessionSeconds;
        task.isQATimerRunning = false;
        task.qaTimerStartTime = undefined;
        await task.save();

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Stop QA timer error:", error);
        return { success: false, error: "Failed to stop QA timer" };
    }
}

/**
 * Assign QA to a task - PM only
 */
export async function assignQAToTask(taskId: string, qaId: string) {
    const user = await getCurrentUser();

    if (user.role !== "PM") {
        return { success: false, error: "Only PMs can assign QA to tasks" };
    }

    try {
        await dbConnect();

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        // Verify QA exists and has QA role
        const qaUser = await User.findById(qaId);
        if (!qaUser || qaUser.role !== "QA") {
            return { success: false, error: "Invalid QA member" };
        }

        task.assignedQA = new mongoose.Types.ObjectId(qaId);
        await task.save();

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Assign QA error:", error);
        return { success: false, error: "Failed to assign QA" };
    }
}

/**
 * Get QA leaderboard for current week
 */
export async function getQALeaderboard() {
    // Helper to get current week number
    function getCurrentWeekNumber(): number {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now.getTime() - start.getTime();
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        return Math.ceil(diff / oneWeek);
    }

    const currentWeek = getCurrentWeekNumber();

    try {
        await dbConnect();

        const leaderboard = await Task.aggregate([
            {
                $match: {
                    qaReviewStatus: { $in: ["Approved", "Failed"] },
                    weekNumber: currentWeek,
                },
            },
            {
                $group: {
                    _id: "$assignedQA",
                    reviewedTasks: { $sum: 1 },
                    approved: {
                        $sum: { $cond: [{ $eq: ["$qaReviewStatus", "Approved"] }, 1, 0] },
                    },
                    totalPoints: {
                        $sum: { $cond: [{ $eq: ["$qaReviewStatus", "Approved"] }, "$points", 0] },
                    },
                    bugsFound: { $sum: "$bugsFound" },
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
                    reviewedTasks: 1,
                    approved: 1,
                    totalPoints: 1,
                    bugsFound: 1,
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
        console.error("Get QA leaderboard error:", error);
        return { success: false, error: "Failed to fetch QA leaderboard", leaderboard: [] };
    }
}

/**
 * Delete a QA member - PM only
 */
export async function deleteQAMember(qaId: string) {
    const user = await getCurrentUser();

    if (user.role !== "PM") {
        return { success: false, error: "Only PMs can delete QA members" };
    }

    try {
        await dbConnect();

        const qaUser = await User.findById(qaId);
        if (!qaUser || qaUser.role !== "QA") {
            return { success: false, error: "QA member not found" };
        }

        // Remove QA assignment from all tasks
        await Task.updateMany(
            { assignedQA: qaId },
            { $unset: { assignedQA: 1 } }
        );

        // Delete the QA user
        await User.findByIdAndDelete(qaId);

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Delete QA member error:", error);
        return { success: false, error: "Failed to delete QA member" };
    }
}
