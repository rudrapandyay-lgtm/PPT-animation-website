import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { upsertShareLink } from "@/lib/presentation";
import { absoluteUrl } from "@/lib/utils";
import { shareLinkSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: RouteContext<"/api/presentations/[presentationId]/share">,
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { presentationId } = await context.params;
    const body = await request.json();
    const parsed = shareLinkSchema.parse(body);
    const shareLink = await upsertShareLink(
      presentationId,
      user.id,
      parsed.passcodeEnabled,
      parsed.passcode,
      {
        coverLabel: parsed.coverLabel,
        coverTitle: parsed.coverTitle,
        coverSubtitle: parsed.coverSubtitle,
        coverButtonText: parsed.coverButtonText,
      },
    );

    return NextResponse.json({
      url: absoluteUrl(`/p/${shareLink.token}`),
      passcodeEnabled: shareLink.passcodeEnabled,
      coverLabel: shareLink.coverLabel,
      coverTitle: shareLink.coverTitle,
      coverSubtitle: shareLink.coverSubtitle,
      coverButtonText: shareLink.coverButtonText,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not create share link.",
      },
      { status: 400 },
    );
  }
}
