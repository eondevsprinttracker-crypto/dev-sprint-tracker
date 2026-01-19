import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    // Redirect based on role
    if (session.user.role === "PM") {
        redirect("/dashboard/pm");
    } else {
        redirect("/dashboard/dev");
    }
}
