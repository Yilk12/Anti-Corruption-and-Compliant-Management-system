import { NextRequest, NextResponse } from "next/server";
import { forwardToBackend } from "@/app/api/_gateway";

// Ensure this route is treated as dynamic (not statically generated)
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Forward request to your backend authentication endpoint
    const response = await forwardToBackend(req, "/api/auth/login");

    // Return the backend response directly
    return response;
  } catch (error) {
    console.error("Error in /api/auth/login:", error);
    return NextResponse.json(
      { message: "Login failed", error: (error as Error).message },
      { status: 500 }
    );
  }
}
