import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSprintById } from "@/app/actions/sprintActions";
import EditSprintPageClient from "./EditSprintPageClient";

export const metadata = {
    title: "Edit Sprint | DevSprint Tracker",
    description: "Edit an existing sprint",
};

interface EditSprintPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditSprintPage({ params }: EditSprintPageProps) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
        redirect("/pm-login");
    }

    if (session.user.role !== "PM") {
        redirect("/dashboard/dev");
    }

    const result = await getSprintById(id);

    if (!result.success || !result.sprint) {
        redirect("/dashboard/pm/sprints");
    }

    return <EditSprintPageClient sprint={result.sprint} />;
}
