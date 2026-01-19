"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Sprint, { SprintStatus } from "@/models/Sprint";
import Task from "@/models/Task";
import Project from "@/models/Project";
import mongoose from "mongoose";

// Helper to get current user
async function getCurrentUser() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Not authenticated");
    }
    return session.user;
}

// Helper to get current week number
function getWeekNumber(date: Date = new Date()): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Create a new sprint - PM only
export async function createSprint(formData: FormData) {
    try {
        const user = await getCurrentUser();
        if (user.role !== "PM") {
            return { success: false, error: "Only Project Managers can create sprints" };
        }

        await dbConnect();

        const projectId = formData.get("projectId") as string;
        const name = formData.get("name") as string;
        const goal = formData.get("goal") as string;
        const startDate = formData.get("startDate") as string;
        const endDate = formData.get("endDate") as string;
        const capacity = parseInt(formData.get("capacity") as string) || 0;

        // Validate project exists and belongs to PM
        const project = await Project.findById(projectId);
        if (!project) {
            return { success: false, error: "Project not found" };
        }
        if (project.createdBy.toString() !== user.id) {
            return { success: false, error: "You can only create sprints for your own projects" };
        }

        // Get next order number
        const lastSprint = await Sprint.findOne({ project: projectId }).sort({ order: -1 });
        const order = lastSprint ? lastSprint.order + 1 : 1;

        const sprint = await Sprint.create({
            name: name || `Sprint ${order}`,
            goal: goal || "",
            project: projectId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            capacity,
            order,
            createdBy: user.id,
        });

        revalidatePath("/dashboard/pm/sprints");
        revalidatePath(`/dashboard/pm/projects/${projectId}`);

        return {
            success: true,
            sprint: JSON.parse(JSON.stringify(sprint)),
        };
    } catch (error) {
        console.error("Error creating sprint:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create sprint",
        };
    }
}

// Update a sprint - PM only
export async function updateSprint(
    sprintId: string,
    data: {
        name?: string;
        goal?: string;
        startDate?: string;
        endDate?: string;
        capacity?: number;
        retrospective?: string;
    }
) {
    try {
        const user = await getCurrentUser();
        if (user.role !== "PM") {
            return { success: false, error: "Only Project Managers can update sprints" };
        }

        await dbConnect();

        const sprint = await Sprint.findById(sprintId);
        if (!sprint) {
            return { success: false, error: "Sprint not found" };
        }
        if (sprint.createdBy.toString() !== user.id) {
            return { success: false, error: "You can only update your own sprints" };
        }

        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.goal !== undefined) updateData.goal = data.goal;
        if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
        if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
        if (data.capacity !== undefined) updateData.capacity = data.capacity;
        if (data.retrospective !== undefined) updateData.retrospective = data.retrospective;

        const updatedSprint = await Sprint.findByIdAndUpdate(sprintId, updateData, { new: true });

        revalidatePath("/dashboard/pm/sprints");
        revalidatePath(`/dashboard/pm/sprints/${sprintId}`);

        return {
            success: true,
            sprint: JSON.parse(JSON.stringify(updatedSprint)),
        };
    } catch (error) {
        console.error("Error updating sprint:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update sprint",
        };
    }
}

// Start a sprint - PM only
export async function startSprint(sprintId: string) {
    try {
        const user = await getCurrentUser();
        if (user.role !== "PM") {
            return { success: false, error: "Only Project Managers can start sprints" };
        }

        await dbConnect();

        const sprint = await Sprint.findById(sprintId);
        if (!sprint) {
            return { success: false, error: "Sprint not found" };
        }
        if (sprint.createdBy.toString() !== user.id) {
            return { success: false, error: "You can only start your own sprints" };
        }
        if (sprint.status !== "Planning") {
            return { success: false, error: "Only sprints in Planning status can be started" };
        }

        // Check if there's already an active sprint for this project
        const activeSprint = await Sprint.findOne({
            project: sprint.project,
            status: "Active",
        });
        if (activeSprint) {
            return { success: false, error: "There is already an active sprint for this project" };
        }

        sprint.status = "Active";
        await sprint.save();

        revalidatePath("/dashboard/pm/sprints");
        revalidatePath(`/dashboard/pm/sprints/${sprintId}`);

        return { success: true, sprint: JSON.parse(JSON.stringify(sprint)) };
    } catch (error) {
        console.error("Error starting sprint:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to start sprint",
        };
    }
}

// Complete a sprint - PM only
export async function completeSprint(sprintId: string) {
    try {
        const user = await getCurrentUser();
        if (user.role !== "PM") {
            return { success: false, error: "Only Project Managers can complete sprints" };
        }

        await dbConnect();

        const sprint = await Sprint.findById(sprintId);
        if (!sprint) {
            return { success: false, error: "Sprint not found" };
        }
        if (sprint.createdBy.toString() !== user.id) {
            return { success: false, error: "You can only complete your own sprints" };
        }
        if (sprint.status !== "Active") {
            return { success: false, error: "Only active sprints can be completed" };
        }

        // Calculate velocity from completed tasks
        const completedTasks = await Task.find({
            sprint: sprintId,
            status: "Completed",
        });
        const velocity = completedTasks.reduce((sum, task) => sum + (task.storyPoints || task.points || 0), 0);

        sprint.status = "Completed";
        sprint.velocity = velocity;
        await sprint.save();

        // Move incomplete tasks back to backlog (remove sprint reference)
        await Task.updateMany(
            { sprint: sprintId, status: { $ne: "Completed" } },
            { $unset: { sprint: "" } }
        );

        revalidatePath("/dashboard/pm/sprints");
        revalidatePath(`/dashboard/pm/sprints/${sprintId}`);

        return { success: true, sprint: JSON.parse(JSON.stringify(sprint)), velocity };
    } catch (error) {
        console.error("Error completing sprint:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to complete sprint",
        };
    }
}

// Cancel a sprint - PM only
export async function cancelSprint(sprintId: string) {
    try {
        const user = await getCurrentUser();
        if (user.role !== "PM") {
            return { success: false, error: "Only Project Managers can cancel sprints" };
        }

        await dbConnect();

        const sprint = await Sprint.findById(sprintId);
        if (!sprint) {
            return { success: false, error: "Sprint not found" };
        }
        if (sprint.createdBy.toString() !== user.id) {
            return { success: false, error: "You can only cancel your own sprints" };
        }
        if (sprint.status === "Completed") {
            return { success: false, error: "Completed sprints cannot be cancelled" };
        }

        sprint.status = "Cancelled";
        await sprint.save();

        // Move all tasks back to backlog
        await Task.updateMany({ sprint: sprintId }, { $unset: { sprint: "" } });

        revalidatePath("/dashboard/pm/sprints");
        revalidatePath(`/dashboard/pm/sprints/${sprintId}`);

        return { success: true };
    } catch (error) {
        console.error("Error cancelling sprint:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to cancel sprint",
        };
    }
}

// Delete a sprint - PM only
export async function deleteSprint(sprintId: string) {
    try {
        const user = await getCurrentUser();
        if (user.role !== "PM") {
            return { success: false, error: "Only Project Managers can delete sprints" };
        }

        await dbConnect();

        const sprint = await Sprint.findById(sprintId);
        if (!sprint) {
            return { success: false, error: "Sprint not found" };
        }
        if (sprint.createdBy.toString() !== user.id) {
            return { success: false, error: "You can only delete your own sprints" };
        }

        // Move all tasks back to backlog before deleting
        await Task.updateMany({ sprint: sprintId }, { $unset: { sprint: "" } });

        await Sprint.findByIdAndDelete(sprintId);

        revalidatePath("/dashboard/pm/sprints");

        return { success: true };
    } catch (error) {
        console.error("Error deleting sprint:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete sprint",
        };
    }
}

// Get all sprints for PM (optionally filtered by project)
export async function getSprints(projectId?: string) {
    try {
        const user = await getCurrentUser();
        if (user.role !== "PM") {
            return { success: false, error: "Only Project Managers can view sprints" };
        }

        await dbConnect();

        const query: Record<string, unknown> = { createdBy: user.id };
        if (projectId) {
            query.project = projectId;
        }

        const sprints = await Sprint.find(query)
            .populate("project", "name key color")
            .sort({ order: -1 })
            .lean();

        // Get task counts for each sprint
        const sprintsWithStats = await Promise.all(
            sprints.map(async (sprint) => {
                const tasks = await Task.find({ sprint: sprint._id }).lean();
                const taskStats = {
                    total: tasks.length,
                    completed: tasks.filter((t) => t.status === "Completed").length,
                    inProgress: tasks.filter((t) => t.status === "In Progress").length,
                    todo: tasks.filter((t) => t.status === "Todo").length,
                    blocked: tasks.filter((t) => t.isBlocked).length,
                    totalPoints: tasks.reduce((sum, t) => sum + (t.storyPoints || t.points || 0), 0),
                    completedPoints: tasks
                        .filter((t) => t.status === "Completed")
                        .reduce((sum, t) => sum + (t.storyPoints || t.points || 0), 0),
                };
                return { ...sprint, taskStats };
            })
        );

        return { success: true, sprints: JSON.parse(JSON.stringify(sprintsWithStats)) };
    } catch (error) {
        console.error("Error fetching sprints:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch sprints",
        };
    }
}

// Get sprint by ID with tasks
export async function getSprintById(sprintId: string) {
    try {
        const user = await getCurrentUser();
        await dbConnect();

        const sprint = await Sprint.findById(sprintId)
            .populate("project", "name key color developers")
            .populate("createdBy", "name email")
            .lean();

        if (!sprint) {
            return { success: false, error: "Sprint not found" };
        }

        // Get all tasks in this sprint
        const tasks = await Task.find({ sprint: sprintId })
            .populate("assignedTo", "name email image")
            .populate("createdBy", "name email")
            .sort({ order: 1 })
            .lean();

        // Get backlog tasks (tasks in project but not in any sprint)
        const backlogTasks = await Task.find({
            project: sprint.project._id,
            sprint: { $exists: false },
        })
            .populate("assignedTo", "name email image")
            .sort({ order: 1 })
            .lean();

        // Alternatively get tasks where sprint is null
        const unassignedTasks = await Task.find({
            project: sprint.project._id,
            $or: [{ sprint: null }, { sprint: { $exists: false } }],
        })
            .populate("assignedTo", "name email image")
            .sort({ order: 1 })
            .lean();

        const allBacklog = [...backlogTasks, ...unassignedTasks].filter(
            (task, index, self) => index === self.findIndex((t) => t._id.toString() === task._id.toString())
        );

        // Calculate current stats
        const taskStats = {
            total: tasks.length,
            completed: tasks.filter((t) => t.status === "Completed").length,
            inProgress: tasks.filter((t) => t.status === "In Progress").length,
            todo: tasks.filter((t) => t.status === "Todo").length,
            pendingReview: tasks.filter((t) => t.status === "Pending Review").length,
            blocked: tasks.filter((t) => t.isBlocked).length,
            totalPoints: tasks.reduce((sum, t) => sum + (t.storyPoints || t.points || 0), 0),
            completedPoints: tasks
                .filter((t) => t.status === "Completed")
                .reduce((sum, t) => sum + (t.storyPoints || t.points || 0), 0),
        };

        return {
            success: true,
            sprint: JSON.parse(JSON.stringify(sprint)),
            tasks: JSON.parse(JSON.stringify(tasks)),
            backlog: JSON.parse(JSON.stringify(allBacklog)),
            taskStats,
        };
    } catch (error) {
        console.error("Error fetching sprint:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch sprint",
        };
    }
}

// Add task to sprint
export async function addTaskToSprint(taskId: string, sprintId: string) {
    try {
        const user = await getCurrentUser();
        if (user.role !== "PM") {
            return { success: false, error: "Only Project Managers can assign tasks to sprints" };
        }

        await dbConnect();

        const sprint = await Sprint.findById(sprintId);
        if (!sprint) {
            return { success: false, error: "Sprint not found" };
        }
        if (sprint.createdBy.toString() !== user.id) {
            return { success: false, error: "You can only modify your own sprints" };
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        // Get next order number in sprint
        const lastTask = await Task.findOne({ sprint: sprintId }).sort({ order: -1 });
        const order = lastTask ? lastTask.order + 1 : 0;

        task.sprint = sprint._id;
        task.order = order;
        await task.save();

        revalidatePath(`/dashboard/pm/sprints/${sprintId}`);

        return { success: true, task: JSON.parse(JSON.stringify(task)) };
    } catch (error) {
        console.error("Error adding task to sprint:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to add task to sprint",
        };
    }
}

// Remove task from sprint (move to backlog)
export async function removeTaskFromSprint(taskId: string) {
    try {
        const user = await getCurrentUser();
        if (user.role !== "PM") {
            return { success: false, error: "Only Project Managers can remove tasks from sprints" };
        }

        await dbConnect();

        const task = await Task.findById(taskId).populate("sprint");
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        const sprintId = task.sprint?._id?.toString();

        // Remove sprint reference
        task.sprint = undefined;
        task.order = 0;
        await task.save();

        if (sprintId) {
            revalidatePath(`/dashboard/pm/sprints/${sprintId}`);
        }

        return { success: true };
    } catch (error) {
        console.error("Error removing task from sprint:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to remove task from sprint",
        };
    }
}

// Reorder tasks within a sprint
export async function reorderSprintTasks(sprintId: string, taskIds: string[]) {
    try {
        const user = await getCurrentUser();
        if (user.role !== "PM") {
            return { success: false, error: "Only Project Managers can reorder tasks" };
        }

        await dbConnect();

        const sprint = await Sprint.findById(sprintId);
        if (!sprint) {
            return { success: false, error: "Sprint not found" };
        }
        if (sprint.createdBy.toString() !== user.id) {
            return { success: false, error: "You can only modify your own sprints" };
        }

        // Update order for each task
        await Promise.all(
            taskIds.map((taskId, index) =>
                Task.findByIdAndUpdate(taskId, { order: index })
            )
        );

        revalidatePath(`/dashboard/pm/sprints/${sprintId}`);

        return { success: true };
    } catch (error) {
        console.error("Error reordering tasks:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to reorder tasks",
        };
    }
}

// Update task status (for Kanban drag-drop)
export async function updateTaskStatus(taskId: string, newStatus: string, newOrder?: number) {
    try {
        const user = await getCurrentUser();
        await dbConnect();

        const task = await Task.findById(taskId);
        if (!task) {
            return { success: false, error: "Task not found" };
        }

        // Validate status
        const validStatuses = ["Todo", "In Progress", "Pending Review", "Completed", "Changes Requested"];
        if (!validStatuses.includes(newStatus)) {
            return { success: false, error: "Invalid status" };
        }

        task.status = newStatus as "Todo" | "In Progress" | "Pending Review" | "Completed" | "Changes Requested";
        if (newOrder !== undefined) {
            task.order = newOrder;
        }

        // Set startedAt when moving to In Progress
        if (newStatus === "In Progress" && !task.startedAt) {
            task.startedAt = new Date();
        }

        await task.save();

        if (task.sprint) {
            revalidatePath(`/dashboard/pm/sprints/${task.sprint}`);
        }
        revalidatePath("/dashboard/pm");

        return { success: true, task: JSON.parse(JSON.stringify(task)) };
    } catch (error) {
        console.error("Error updating task status:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update task status",
        };
    }
}

// Get active sprint for a project
export async function getActiveSprint(projectId: string) {
    try {
        await dbConnect();

        const sprint = await Sprint.findOne({
            project: projectId,
            status: "Active",
        })
            .populate("project", "name key color")
            .lean();

        if (!sprint) {
            return { success: true, sprint: null };
        }

        // Get task counts
        const tasks = await Task.find({ sprint: sprint._id }).lean();
        const taskStats = {
            total: tasks.length,
            completed: tasks.filter((t) => t.status === "Completed").length,
            inProgress: tasks.filter((t) => t.status === "In Progress").length,
            totalPoints: tasks.reduce((sum, t) => sum + (t.storyPoints || t.points || 0), 0),
            completedPoints: tasks
                .filter((t) => t.status === "Completed")
                .reduce((sum, t) => sum + (t.storyPoints || t.points || 0), 0),
        };

        return {
            success: true,
            sprint: JSON.parse(JSON.stringify({ ...sprint, taskStats })),
        };
    } catch (error) {
        console.error("Error fetching active sprint:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch active sprint",
        };
    }
}

// Get sprint velocity history for a project
export async function getSprintVelocityHistory(projectId: string) {
    try {
        await dbConnect();

        const sprints = await Sprint.find({
            project: projectId,
            status: "Completed",
        })
            .sort({ order: 1 })
            .select("name velocity capacity order")
            .lean();

        return {
            success: true,
            velocityHistory: JSON.parse(JSON.stringify(sprints)),
        };
    } catch (error) {
        console.error("Error fetching velocity history:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch velocity history",
        };
    }
}

// Get burndown data for a sprint
export async function getSprintBurndown(sprintId: string) {
    try {
        await dbConnect();

        const sprint = await Sprint.findById(sprintId).lean();
        if (!sprint) {
            return { success: false, error: "Sprint not found" };
        }

        // Get all tasks in sprint with their completion dates
        const tasks = await Task.find({ sprint: sprintId }).lean();

        // Calculate total points
        const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || t.points || 0), 0);

        // Get sprint duration in days
        const startDate = new Date(sprint.startDate);
        const endDate = new Date(sprint.endDate);
        const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Build burndown data
        const burndownData: { date: string; ideal: number; actual: number }[] = [];
        const dailyBurn = totalPoints / durationDays;

        for (let i = 0; i <= durationDays; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + i);
            const dateStr = currentDate.toISOString().split("T")[0];

            // Ideal burndown
            const ideal = Math.max(0, totalPoints - dailyBurn * i);

            // Actual remaining (based on completed tasks up to this date)
            const completedByDate = tasks.filter(
                (t) => t.status === "Completed" && new Date(t.updatedAt) <= currentDate
            );
            const completedPoints = completedByDate.reduce(
                (sum, t) => sum + (t.storyPoints || t.points || 0),
                0
            );
            const actual = totalPoints - completedPoints;

            burndownData.push({
                date: dateStr,
                ideal: Math.round(ideal * 10) / 10,
                actual: currentDate <= new Date() ? actual : null as unknown as number,
            });
        }

        return {
            success: true,
            burndownData,
            totalPoints,
        };
    } catch (error) {
        console.error("Error fetching burndown:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch burndown data",
        };
    }
}
