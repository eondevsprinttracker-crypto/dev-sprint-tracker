import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTaskById } from "@/app/actions/taskActions";
import TaskDetailPageClient from "./TaskDetailPageClient";

interface TaskDetailPageProps {
    params: Promise<{ id: string }>;
}

export const metadata = {
    title: "Task Details | DevSprint Tracker",
    description: "View task details and history",
};

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
        redirect("/login");
    }

    const role = session.user.role;
    if (role !== "PM" && role !== "Developer") {
        // Should not happen, but safe fallback
        redirect("/login");
    }

    const result = await getTaskById(id);

    if (!result.success || !result.task) {
        // Redirect partly based on role, or just back to generic dashboard
        redirect(role === "PM" ? "/dashboard/pm" : "/dashboard/dev");
    }

    return <TaskDetailPageClient task={result.task} userRole={role} />;
}
