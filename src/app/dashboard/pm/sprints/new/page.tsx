import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NewSprintPageClient from "./NewSprintPageClient";

export const metadata = {
    title: "Create Sprint | DevSprint Tracker",
    description: "Create a new sprint for your project",
};

export default async function NewSprintPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/pm-login");
    }

    if (session.user.role !== "PM") {
        redirect("/dashboard/dev");
    }

    return <NewSprintPageClient />;
}
