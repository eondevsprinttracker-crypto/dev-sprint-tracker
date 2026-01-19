import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import PMDashboardClient from "./PMDashboardClient";

export default async function PMDashboard() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if (session.user.role !== "PM") {
        redirect("/dashboard/dev");
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
            <Navbar userName={session.user.name} userRole={session.user.role} />
            <div className="flex">
                <Sidebar userRole="PM" />
                <main className="flex-1">
                    <PMDashboardClient />
                </main>
            </div>
        </div>
    );
}
