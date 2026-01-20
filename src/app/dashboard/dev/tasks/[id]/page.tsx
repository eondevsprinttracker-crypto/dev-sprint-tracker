import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTaskById } from "@/app/actions/taskActions";
import TaskDetailPageClient from "@/app/dashboard/pm/tasks/[id]/TaskDetailPageClient";

interface TaskDetailPageProps {
    params: Promise<{ id: string }>;
}

export const metadata = {
    title: "Task Details | DevSprint Tracker",
    description: "View task details and history",
};

export default async function DevTaskDetailPage({ params }: TaskDetailPageProps) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
        redirect("/login");
    }

    // Ensure only Developer (or PM) can access
    if (session.user.role !== "Developer" && session.user.role !== "PM") {
        redirect("/login");
    }

    const result = await getTaskById(id);

    if (!result.success || !result.task) {
        redirect("/dashboard/dev");
    }

    return <TaskDetailPageClient task={result.task} userRole={session.user.role} />;
}
