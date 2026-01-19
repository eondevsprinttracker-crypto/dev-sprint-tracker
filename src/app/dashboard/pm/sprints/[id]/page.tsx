import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SprintBoardClient from "./SprintBoardClient";

export const metadata = {
    title: "Sprint Board | DevSprint Tracker",
    description: "Kanban board for sprint task management",
};

interface SprintPageProps {
    params: Promise<{ id: string }>;
}

export default async function SprintPage({ params }: SprintPageProps) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
        redirect("/pm-login");
    }

    if (session.user.role !== "PM") {
        redirect("/dashboard/dev");
    }

    return <SprintBoardClient sprintId={id} />;
}
