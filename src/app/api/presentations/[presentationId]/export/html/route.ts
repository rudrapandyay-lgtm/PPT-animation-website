import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { renderPresentationHtml } from "@/lib/export/presentation-html";
import { getPresentationForEditor, toPresentationDocument } from "@/lib/presentation";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/presentations/[presentationId]/export/html">,
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

  const document = toPresentationDocument(presentation);
  const html = renderPresentationHtml(document);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${document.name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "presentation"}.html"`,
    },
  });
}
