import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import DevDashboardClient from "./DevDashboardClient";

export default async function DevDashboard() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if (session.user.role !== "Developer") {
        redirect("/dashboard/pm");
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
            <Navbar userName={session.user.name} userRole={session.user.role} />
            <div className="flex">
                <Sidebar userRole="Developer" />
                <main className="flex-1">
                    <DevDashboardClient userRole={session.user.role} />
                </main>
            </div>
        </div>
    );
}
