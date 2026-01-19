import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NewProjectPageClient from "./NewProjectPageClient";

export const metadata = {
    title: "Create Project | DevSprint Tracker",
    description: "Create a new project for your team",
};

export default async function NewProjectPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/pm-login");
    }

    if (session.user.role !== "PM") {
        redirect("/dashboard/dev");
    }

    return <NewProjectPageClient />;
}
