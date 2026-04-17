"use server";

import { redirect } from "next/navigation";

import { getUserWorkspaceOrThrow, requireUser } from "@/lib/auth";
import { createPresentationFromTemplate } from "@/lib/presentation";
import { createPresentationSchema } from "@/lib/validation";

export async function createPresentationAction(formData: FormData) {
  const user = await requireUser();
  const workspace = await getUserWorkspaceOrThrow(user.id);

  const parsed = createPresentationSchema.safeParse({
    templateKey: formData.get("templateKey"),
  });

  if (!parsed.success) {
    throw new Error("Select a valid template.");
  }

  const presentation = await createPresentationFromTemplate(
    parsed.data.templateKey,
    user.id,
    workspace.id,
  );

  redirect(`/editor/${presentation.id}`);
}
