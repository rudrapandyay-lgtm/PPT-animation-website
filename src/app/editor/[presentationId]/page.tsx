import { notFound } from "next/navigation";

import { EditorShell } from "@/components/editor/editor-shell";
import { requireUser } from "@/lib/auth";
import { getPresentationForEditor, toPresentationDocument } from "@/lib/presentation";

export default async function EditorPage({
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

  const document = toPresentationDocument(presentation);

  return (
    <EditorShell
      initialPresentation={document}
      existingShareToken={presentation.shareLinks[0]?.token}
      existingPasscodeEnabled={presentation.shareLinks[0]?.passcodeEnabled}
      initialShareCover={{
        coverLabel: presentation.shareLinks[0]?.coverLabel ?? "Shared presentation",
        coverTitle: presentation.shareLinks[0]?.coverTitle ?? presentation.name,
        coverSubtitle:
          presentation.shareLinks[0]?.coverSubtitle ??
          `${presentation.project.name} presented with MotionDeck.`,
        coverButtonText: presentation.shareLinks[0]?.coverButtonText ?? "Enter presentation",
      }}
      assets={document.assets ?? []}
    />
  );
}
