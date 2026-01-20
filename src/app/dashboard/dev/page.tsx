import { auth } from "@/auth";
import DevDashboardClient from "./DevDashboardClient";

export default async function DevDashboard() {
    const session = await auth();
    // Auth checks are now handled in layout.tsx, but good to have session for props

    return <DevDashboardClient userRole={session?.user?.role || "Developer"} />;
}
