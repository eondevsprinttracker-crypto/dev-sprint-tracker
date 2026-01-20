import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTaskById } from "@/app/actions/taskActions";
import EditTaskPageClient from "./EditTaskPageClient";

interface EditTaskPageProps {
    params: Promise<{ id: string }>;
}

export const metadata = {
    title: "Edit Task | DevSprint Tracker",
    description: "Edit task details",
};

export default async function EditTaskPage({ params }: EditTaskPageProps) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
        redirect("/login");
    }

    if (session.user.role !== "PM") {
        redirect("/dashboard/dev");
    }

    const result = await getTaskById(id);

    if (!result.success || !result.task) {
        redirect("/dashboard/pm");
    }

    return <EditTaskPageClient task={result.task} />;
}
