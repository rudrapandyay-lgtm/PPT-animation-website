import { NextResponse } from "next/server";

import { clearUserSession } from "@/lib/auth";

export async function POST() {
  await clearUserSession();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}
