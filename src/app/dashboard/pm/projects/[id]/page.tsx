import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getProjectById } from "@/app/actions/projectActions";
import ProjectDetailPageClient from "./ProjectDetailPageClient";

interface ProjectDetailPageProps {
    params: Promise<{ id: string }>;
}

export const metadata = {
    title: "Project Details | DevSprint Tracker",
    description: "Manage project tasks and team",
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
        redirect("/login");
    }

    if (session.user.role !== "PM" && session.user.role !== "Developer") {
        redirect("/login");
    }

    const result = await getProjectById(id);

    if (!result.success || !result.project) {
        redirect(session.user.role === "PM" ? "/dashboard/pm/projects" : "/dashboard/dev");
    }

    return <ProjectDetailPageClient projectId={id} />;
}
