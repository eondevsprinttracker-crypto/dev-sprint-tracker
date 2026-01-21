import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadProof, uploadProjectFile } from "@/lib/cloudinary";

// Helper to get current week number
function getCurrentWeekNumber(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
}

export async function POST(request: Request) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { file, fileName, projectId } = await request.json();

        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
        }

        // If fileName is provided, use project file upload (for attachments)
        if (fileName) {
            const result = await uploadProjectFile(file, projectId || 'temp', fileName);
            return NextResponse.json({
                success: true,
                url: result.url,
                publicId: result.publicId,
                type: result.type,
                size: result.size,
            });
        }

        // Otherwise use proof upload (for task completion proofs)
        const result = await uploadProof(file, session.user.id, getCurrentWeekNumber());

        return NextResponse.json({
            success: true,
            url: result.url,
            publicId: result.publicId,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
    }
}
