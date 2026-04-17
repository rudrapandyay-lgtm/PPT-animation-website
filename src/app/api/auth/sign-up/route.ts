import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { setUserSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { signUpSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = signUpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existingUser) {
    return NextResponse.json({ message: "An account with that email already exists." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const slugBase = slugify(parsed.data.name) || "workspace";
  const slug = `${slugBase}-${Math.random().toString(36).slice(2, 8)}`;

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    },
  });

  await prisma.workspace.create({
    data: {
      name: `${parsed.data.name.split(" ")[0]}'s Workspace`,
      slug,
      ownerUserId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  await setUserSession({ userId: user.id, email: user.email, name: user.name });
  return NextResponse.json({ redirectTo: "/dashboard" });
}
