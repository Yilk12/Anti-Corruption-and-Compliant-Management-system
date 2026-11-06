import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";
import { forwardToBackend } from "@/app/api/_gateway";

// Thin proxy to real backend users endpoint
// Preserves query string and cookies
export async function GET(req: NextRequest) {
  return forwardToBackend(req, "/api/users");
}
