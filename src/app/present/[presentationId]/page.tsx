import { notFound } from "next/navigation";

import { PresenterShell } from "@/components/editor/presenter-shell";
import { requireUser } from "@/lib/auth";
import { getPresentationForEditor, toPresentationDocument } from "@/lib/presentation";

export default async function PresenterPage({
  params,
}: {
  params: Promise<{ presentationId: string }>;
}) {
  const { presentationId } = await params;
  const user = await requireUser();
  const presentation = await getPresentationForEditor(presentationId, user.id);

  if (!presentation) {
    notFound();
  }

  return <PresenterShell presentation={toPresentationDocument(presentation)} />;
}
