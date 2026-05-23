import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { cleanupExpiredReservations } from "@/lib/reservations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (env.CRON_SECRET) {
    const secret = request.headers.get("x-cron-secret");
    if (secret !== env.CRON_SECRET) {
      return NextResponse.json(
        {
          error: "Unauthorized"
        },
        {
          status: 401
        }
      );
    }
  }

  const releasedReservations = await cleanupExpiredReservations();

  return NextResponse.json({
    success: true,
    releasedReservations
  });
}
