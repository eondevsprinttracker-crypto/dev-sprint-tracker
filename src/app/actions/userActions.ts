"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Task from "@/models/Task";
import bcrypt from "bcryptjs";

// Helper to get current user
async function getCurrentUser() {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }
    return session.user;
}

/**
 * Delete a developer and all related data - PM only
 * Cascading deletes: all tasks assigned to the developer and their comments
 */
export async function deleteDeveloper(developerId: string) {
    const user = await getCurrentUser();

    if (user.role !== "PM") {
        return { success: false, error: "Only Project Managers can delete developers" };
    }

    if (!developerId) {
        return { success: false, error: "Developer ID is required" };
    }

    try {
        await dbConnect();

        // Find the developer to delete
        const developer = await User.findById(developerId);
        if (!developer) {
            return { success: false, error: "Developer not found" };
        }

        // Prevent deleting a PM (safety check)
        if (developer.role === "PM") {
            return { success: false, error: "Cannot delete a Project Manager" };
        }

        // Delete all tasks assigned to this developer
        await Task.deleteMany({ assignedTo: developerId });

        // Remove the developer's comments from all tasks
        await Task.updateMany(
            { "comments.user": developerId },
            { $pull: { comments: { user: developerId } } }
        );

        // Delete the user
        await User.findByIdAndDelete(developerId);

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Delete developer error:", error);
        return { success: false, error: "Failed to delete developer" };
    }
}

/**
 * Create a new team member (Developer or QA) - PM only
 */
export async function createTeamMember(data: {
    name: string;
    email: string;
    password?: string;
    role: "Developer" | "QA";
}) {
    const user = await getCurrentUser();

    if (user.role !== "PM") {
        return { success: false, error: "Only Project Managers can create team members" };
    }

    try {
        await dbConnect();

        // Check if user already exists
        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
            return { success: false, error: "User with this email already exists" };
        }

        const hashedPassword = data.password
            ? await bcrypt.hash(data.password, 10)
            : undefined;

        await User.create({
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: data.role,
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Create team member error:", error);
        return { success: false, error: "Failed to create team member" };
    }
}
