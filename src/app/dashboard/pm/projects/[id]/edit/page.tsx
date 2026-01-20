import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getProjectById } from "@/app/actions/projectActions";
import EditProjectPageClient from "./EditProjectPageClient";

interface EditProjectPageProps {
    params: Promise<{ id: string }>;
}

export const metadata = {
    title: "Edit Project | DevSprint Tracker",
    description: "Edit project details",
};

export default async function EditProjectPage({ params }: EditProjectPageProps) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
        redirect("/login");
    }

    if (session.user.role !== "PM") {
        redirect("/dashboard/dev");
    }

    const result = await getProjectById(id);

    if (!result.success || !result.project) {
        redirect("/dashboard/pm/projects");
    }

    return <EditProjectPageClient project={result.project} />;
}
