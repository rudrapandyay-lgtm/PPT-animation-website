"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { clearUserSession, setUserSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { type FormState, signInSchema, signUpSchema } from "@/lib/validation";

function fieldErrors(error: Record<string, string[]>) {
  return {
    fieldErrors: error,
  } satisfies FormState;
}

export async function signUpAction(_state: FormState | void, formData: FormData) {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return fieldErrors(parsed.error.flatten().fieldErrors);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existingUser) {
    return { message: "An account with that email already exists." } satisfies FormState;
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
  redirect("/dashboard");
}

export async function signInAction(_state: FormState | void, formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return fieldErrors(parsed.error.flatten().fieldErrors);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    return { message: "Invalid email or password." } satisfies FormState;
  }

  const matches = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!matches) {
    return { message: "Invalid email or password." } satisfies FormState;
  }

  await setUserSession({ userId: user.id, email: user.email, name: user.name });
  redirect("/dashboard");
}

export async function signOutAction() {
  await clearUserSession();
  redirect("/");
}
