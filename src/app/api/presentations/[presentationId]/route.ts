import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getPresentationForEditor, savePresentationFromPayload, toPresentationDocument } from "@/lib/presentation";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/presentations/[presentationId]">,
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { presentationId } = await context.params;
  const presentation = await getPresentationForEditor(presentationId, user.id);

  if (!presentation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ presentation: toPresentationDocument(presentation) });
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/presentations/[presentationId]">,
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { presentationId } = await context.params;
    const payload = await request.json();
    const presentation = await savePresentationFromPayload(presentationId, user.id, payload);

    return NextResponse.json({ presentation: toPresentationDocument(presentation) });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not save presentation.",
      },
      { status: 400 },
    );
  }
}
