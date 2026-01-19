import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NewTaskPageClient from "./NewTaskPageClient";

export const metadata = {
    title: "Create Task | DevSprint Tracker",
    description: "Create a new task for your project",
};

export default async function NewTaskPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/pm-login");
    }

    if (session.user.role !== "PM") {
        redirect("/dashboard/dev");
    }

    return <NewTaskPageClient />;
}
