import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SprintsPageClient from "./SprintsPageClient";

export const metadata = {
    title: "Sprint Management | DevSprint Tracker",
    description: "Manage your project sprints with advanced planning tools",
};

export default async function SprintsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/pm-login");
    }

    if (session.user.role !== "PM") {
        redirect("/dashboard/dev");
    }

    return <SprintsPageClient />;
}
