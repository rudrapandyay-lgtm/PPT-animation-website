"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { type FormState } from "@/lib/validation";

export async function unlockShareAction(_state: FormState | void, formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const passcode = String(formData.get("passcode") ?? "");

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
  });

  if (!shareLink || !shareLink.isActive) {
    return { message: "This presentation link is no longer available." } satisfies FormState;
  }

  if (!shareLink.passcodeEnabled || !shareLink.passcodeHash) {
    redirect(`/p/${token}`);
  }

  const matches = await bcrypt.compare(passcode, shareLink.passcodeHash);

  if (!matches) {
    return { message: "Incorrect passcode." } satisfies FormState;
  }

  const cookieStore = await cookies();
  cookieStore.set(`motiondeck_share_${token}`, "granted", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 6,
  });

  redirect(`/p/${token}`);
}
