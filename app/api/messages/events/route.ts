import { NextRequest } from "next/server";
import { addClient, removeClient } from "../_events";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      const client = {
        id: Math.random().toString(36).slice(2),
        send: (data: string) => controller.enqueue(encoder.encode(data)),
      };
      addClient(client);
      // send hello
      controller.enqueue(encoder.encode(`event: hello\ndata: {"ok":true}\n\n`));
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(`event: ping\ndata: {"t":${Date.now()}}\n\n`)); } catch {}
      }, 25000);
      (req as any).signal?.addEventListener?.("abort", () => {
        clearInterval(heartbeat);
        removeClient(client);
        controller.close();
      });
    },
    cancel() {
      // no-op
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
