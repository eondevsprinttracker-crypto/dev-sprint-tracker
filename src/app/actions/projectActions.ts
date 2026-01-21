"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Project, { ProjectStatus } from "@/models/Project";
import Task from "@/models/Task";
import mongoose from "mongoose";

// Helper to get current user
async function getCurrentUser() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session.user;
}

// Create a new project - PM only
export async function createProject(formData: FormData) {
    try {
        const user = await getCurrentUser();
        if (user.role !== "PM") {
            return { success: false, error: "Only Project Managers can create projects" };
        }

        await dbConnect();

        const name = formData.get("name") as string;
        const key = formData.get("key") as string;
        const description = formData.get("description") as string || "";
        const color = formData.get("color") as string || "#f97316";
        const startDate = formData.get("startDate") as string;
        const targetEndDate = formData.get("targetEndDate") as string || null;
        const developerIds = formData.getAll("developers") as string[];

        // New fields
        const category = formData.get("category") as string || "Web";
        const priority = formData.get("priority") as string || "Medium";
        const visibility = formData.get("visibility") as string || "Team";
        const riskLevel = formData.get("riskLevel") as string || "Low";
        const client = formData.get("client") as string || undefined;
        const repository = formData.get("repository") as string || undefined;
        const tagsStr = formData.get("tags") as string || "";
        const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(t => t) : [];
        const notes = formData.get("notes") as string || undefined;

        // Validate required fields
        if (!name || !key || !startDate) {
            return { success: false, error: "Name, key, and start date are required" };
        }

        // Check if key already exists
        const existingProject = await Project.findOne({ key: key.toUpperCase() });
        if (existingProject) {
            return { success: false, error: "A project with this key already exists" };
        }

        const project = await Project.create({
            name,
            key: key.toUpperCase(),
            description,
            color,
            category,
            priority,
            visibility,
            riskLevel,
            client,
            repository,
            tags,
            notes,
            attachments: [],
            startDate: new Date(startDate),
            targetEndDate: targetEndDate ? new Date(targetEndDate) : undefined,
            developers: developerIds.map(id => new mongoose.Types.ObjectId(id)),
            createdBy: new mongoose.Types.ObjectId(user.id),
        });

        revalidatePath("/dashboard/pm");
        return { success: true, project: JSON.parse(JSON.stringify(project)) };
    } catch (error: unknown) {
        console.error("Create project error:", error);
        const message = error instanceof Error ? error.message : "Failed to create project";
        return { success: false, error: message };
    }
}


// Update a project - PM only
export async function updateProject(
    projectId: string,
    data: {
        name?: string;
        description?: string;
        status?: ProjectStatus;
        color?: string;
        category?: string;
        priority?: string;
        visibility?: string;
        riskLevel?: string;
        client?: string | null;
        repository?: string | null;
        tags?: string[];
        notes?: string | null;
        startDate?: string;
        targetEndDate?: string | null;
        actualEndDate?: string | null;
        developers?: string[];
    }
) {
    try {
        const user = await getCurrentUser();
        if (user.role !== "PM") {
            return { success: false, error: "Only Project Managers can update projects" };
        }

        await dbConnect();

        const project = await Project.findById(projectId);
        if (!project) {
            return { success: false, error: "Project not found" };
        }

        // Apply updates
        if (data.name) project.name = data.name;
        if (data.description !== undefined) project.description = data.description;
        if (data.status) project.status = data.status;
        if (data.color) project.color = data.color;
        if (data.category) project.category = data.category as typeof project.category;
        if (data.priority) project.priority = data.priority as typeof project.priority;
        if (data.visibility) project.visibility = data.visibility as typeof project.visibility;
        if (data.riskLevel) project.riskLevel = data.riskLevel as typeof project.riskLevel;
        if (data.client !== undefined) project.client = data.client ?? undefined;
        if (data.repository !== undefined) project.repository = data.repository ?? undefined;
        if (data.tags !== undefined) project.tags = data.tags;
        if (data.notes !== undefined) project.notes = data.notes ?? undefined;
        if (data.startDate) project.startDate = new Date(data.startDate);
        if (data.targetEndDate !== undefined) {
            project.targetEndDate = data.targetEndDate ? new Date(data.targetEndDate) : undefined;
        }
        if (data.actualEndDate !== undefined) {
            project.actualEndDate = data.actualEndDate ? new Date(data.actualEndDate) : undefined;
        }
        if (data.developers !== undefined) {
            project.developers = data.developers.map(id => new mongoose.Types.ObjectId(id));
            project.markModified('developers');
        }

        await project.save();

        revalidatePath("/dashboard/pm");
        return { success: true, project: JSON.parse(JSON.stringify(project)) };
    } catch (error: unknown) {
        console.error("Update project error:", error);
        const message = error instanceof Error ? error.message : "Failed to update project";
        return { success: false, error: message };
    }
}


// Delete a project - PM only
export async function deleteProject(projectId: string, deleteAssociatedTasks: boolean = false) {
    try {
        const user = await getCurrentUser();
        if (user.role !== "PM") {
            return { success: false, error: "Only Project Managers can delete projects" };
        }

        await dbConnect();

        const project = await Project.findById(projectId);
        if (!project) {
            return { success: false, error: "Project not found" };
        }

        if (deleteAssociatedTasks) {
            // Delete all tasks associated with this project
            await Task.deleteMany({ project: new mongoose.Types.ObjectId(projectId) });
        } else {
            // Unlink tasks from project (they become standalone)
            await Task.updateMany(
                { project: new mongoose.Types.ObjectId(projectId) },
                { $unset: { project: 1 } }
            );
        }

        await Project.findByIdAndDelete(projectId);

        revalidatePath("/dashboard/pm");
        return { success: true };
    } catch (error: unknown) {
        console.error("Delete project error:", error);
        const message = error instanceof Error ? error.message : "Failed to delete project";
        return { success: false, error: message };
    }
}

// Get all projects for PM
export async function getProjects() {
    try {
        const user = await getCurrentUser();
        if (user.role !== "PM") {
            return { success: false, error: "Only Project Managers can view all projects" };
        }

        await dbConnect();

        const projects = await Project.find({ createdBy: new mongoose.Types.ObjectId(user.id) })
            .populate("developers", "name email")
            .sort({ createdAt: -1 })
            .lean();

        // Get task counts for each project
        const projectsWithStats = await Promise.all(
            projects.map(async (project) => {
                const taskStats = await Task.aggregate([
                    { $match: { project: project._id } },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            completed: {
                                $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
                            },
                            inProgress: {
                                $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] },
                            },
                            blocked: {
                                $sum: { $cond: ["$isBlocked", 1, 0] },
                            },
                        },
                    },
                ]);

                const stats = taskStats[0] || { total: 0, completed: 0, inProgress: 0, blocked: 0 };

                return {
                    ...project,
                    taskStats: {
                        total: stats.total,
                        completed: stats.completed,
                        inProgress: stats.inProgress,
                        blocked: stats.blocked,
                        progress: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
                    },
                };
            })
        );

        return { success: true, projects: JSON.parse(JSON.stringify(projectsWithStats)) };
    } catch (error: unknown) {
        console.error("Get projects error:", error);
        const message = error instanceof Error ? error.message : "Failed to get projects";
        return { success: false, error: message };
    }
}

// Get project by ID with full details
export async function getProjectById(projectId: string) {
    try {
        const user = await getCurrentUser();

        await dbConnect();

        const project = await Project.findById(projectId)
            .populate("developers", "name email")
            .populate("createdBy", "name email")
            .lean();

        if (!project) {
            return { success: false, error: "Project not found" };
        }

        // Get task statistics
        const taskStats = await Task.aggregate([
            { $match: { project: new mongoose.Types.ObjectId(projectId) } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
                    inProgress: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
                    todo: { $sum: { $cond: [{ $eq: ["$status", "Todo"] }, 1, 0] } },
                    pendingReview: { $sum: { $cond: [{ $eq: ["$status", "Pending Review"] }, 1, 0] } },
                    changesRequested: { $sum: { $cond: [{ $eq: ["$status", "Changes Requested"] }, 1, 0] } },
                    blocked: { $sum: { $cond: ["$isBlocked", 1, 0] } },
                    totalEstimatedHours: { $sum: "$estimatedHours" },
                    totalActualHours: { $sum: "$actualHours" },
                },
            },
        ]);

        const stats = taskStats[0] || {
            total: 0,
            completed: 0,
            inProgress: 0,
            todo: 0,
            pendingReview: 0,
            changesRequested: 0,
            blocked: 0,
            totalEstimatedHours: 0,
            totalActualHours: 0,
        };

        return {
            success: true,
            project: JSON.parse(JSON.stringify({
                ...project,
                taskStats: {
                    ...stats,
                    progress: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
                },
            })),
        };
    } catch (error: unknown) {
        console.error("Get project by ID error:", error);
        const message = error instanceof Error ? error.message : "Failed to get project";
        return { success: false, error: message };
    }
}

// Add developer to project - PM only
export async function addDeveloperToProject(projectId: string, developerId: string) {
    try {
        const user = await getCurrentUser();
        if (user.role !== "PM") {
            return { success: false, error: "Only Project Managers can modify project team" };
        }

        await dbConnect();

        const project = await Project.findById(projectId);
        if (!project) {
            return { success: false, error: "Project not found" };
        }

        const devObjId = new mongoose.Types.ObjectId(developerId);
        if (project.developers.some(d => d.equals(devObjId))) {
            return { success: false, error: "Developer is already in this project" };
        }

        project.developers.push(devObjId);
        await project.save();

        revalidatePath("/dashboard/pm");
        return { success: true };
    } catch (error: unknown) {
        console.error("Add developer to project error:", error);
        const message = error instanceof Error ? error.message : "Failed to add developer";
        return { success: false, error: message };
    }
}

// Remove developer from project - PM only
export async function removeDeveloperFromProject(projectId: string, developerId: string) {
    try {
        const user = await getCurrentUser();
        if (user.role !== "PM") {
            return { success: false, error: "Only Project Managers can modify project team" };
        }

        await dbConnect();

        const project = await Project.findById(projectId);
        if (!project) {
            return { success: false, error: "Project not found" };
        }

        const devObjId = new mongoose.Types.ObjectId(developerId);
        project.developers = project.developers.filter(d => !d.equals(devObjId));
        await project.save();

        revalidatePath("/dashboard/pm");
        return { success: true };
    } catch (error: unknown) {
        console.error("Remove developer from project error:", error);
        const message = error instanceof Error ? error.message : "Failed to remove developer";
        return { success: false, error: message };
    }
}

// Get tasks by project with optional status filter
export async function getTasksByProject(projectId: string, status?: string) {
    try {
        const user = await getCurrentUser();

        await dbConnect();

        const query: Record<string, unknown> = { project: new mongoose.Types.ObjectId(projectId) };
        if (status && status !== "all") {
            query.status = status;
        }

        const tasks = await Task.find(query)
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 })
            .lean();

        return { success: true, tasks: JSON.parse(JSON.stringify(tasks)) };
    } catch (error: unknown) {
        console.error("Get tasks by project error:", error);
        const message = error instanceof Error ? error.message : "Failed to get tasks";
        return { success: false, error: message };
    }
}

// Add attachment to project - PM only
export async function addProjectAttachment(
    projectId: string,
    attachment: {
        name: string;
        url: string;
        publicId: string;
        type: 'image' | 'video' | 'pdf' | 'document' | 'other';
        size: number;
    }
) {
    try {
        const user = await getCurrentUser();
        if (user.role !== "PM") {
            return { success: false, error: "Only Project Managers can add attachments" };
        }

        await dbConnect();

        const project = await Project.findById(projectId);
        if (!project) {
            return { success: false, error: "Project not found" };
        }

        project.attachments.push({
            ...attachment,
            uploadedAt: new Date(),
        });
        await project.save();

        revalidatePath("/dashboard/pm");
        return { success: true, project: JSON.parse(JSON.stringify(project)) };
    } catch (error: unknown) {
        console.error("Add attachment error:", error);
        const message = error instanceof Error ? error.message : "Failed to add attachment";
        return { success: false, error: message };
    }
}

// Remove attachment from project - PM only
export async function removeProjectAttachment(projectId: string, publicId: string) {
    try {
        const user = await getCurrentUser();
        if (user.role !== "PM") {
            return { success: false, error: "Only Project Managers can remove attachments" };
        }

        await dbConnect();

        const project = await Project.findById(projectId);
        if (!project) {
            return { success: false, error: "Project not found" };
        }

        // Find attachment to get type for Cloudinary deletion
        const attachment = project.attachments.find((a: { publicId: string }) => a.publicId === publicId);
        if (!attachment) {
            return { success: false, error: "Attachment not found" };
        }

        // Remove from database first
        project.attachments = project.attachments.filter((a: { publicId: string }) => a.publicId !== publicId);
        await project.save();

        // Delete from Cloudinary (import at runtime to avoid issues)
        try {
            const { deleteFile } = await import("@/lib/cloudinary");
            const resourceType = attachment.type === 'image' ? 'image' :
                attachment.type === 'video' ? 'video' : 'raw';
            await deleteFile(publicId, resourceType);
        } catch (cloudinaryError) {
            console.error("Cloudinary delete error (non-critical):", cloudinaryError);
        }

        revalidatePath("/dashboard/pm");
        return { success: true };
    } catch (error: unknown) {
        console.error("Remove attachment error:", error);
        const message = error instanceof Error ? error.message : "Failed to remove attachment";
        return { success: false, error: message };
    }
}
