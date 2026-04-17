import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { setUserSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { signInSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = signInSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 400 });
  }

  const matches = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!matches) {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 400 });
  }

  await setUserSession({ userId: user.id, email: user.email, name: user.name });
  return NextResponse.json({ redirectTo: "/dashboard" });
}
