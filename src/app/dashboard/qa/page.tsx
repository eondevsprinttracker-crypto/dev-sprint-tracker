import { auth } from "@/auth";
import { redirect } from "next/navigation";
import QADashboardClient from "./QADashboardClient";

export default async function QADashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if (session.user.role !== "QA") {
        redirect("/dashboard");
    }

    return <QADashboardClient />;
}
