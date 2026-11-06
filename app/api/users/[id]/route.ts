import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";
import { forwardToBackend } from "@/app/api/_gateway";

// Thin proxy to real backend users/{id} endpoint
// Preserves query string and cookies
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return forwardToBackend(req, `/api/users/${params.id}`);
}
