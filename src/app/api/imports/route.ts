import path from "node:path";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getCurrentUser, getUserWorkspaceOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parsePdfBuffer } from "@/lib/importers/pdf";
import { parsePptxBuffer } from "@/lib/importers/pptx";
import { createPresentationFromPdfImport, createPresentationFromPptxImport } from "@/lib/presentation";
import { storeObject } from "@/lib/storage";

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getUserWorkspaceOrThrow(user.id);
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }

  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json({ error: "Only PPTX and PDF files are supported right now." }, { status: 400 });
  }

  const extension = path.extname(file.name) || (file.type === "application/pdf" ? ".pdf" : ".pptx");
  const fileName = `${randomUUID()}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const storedObject = await storeObject({
    key: path.posix.join("imports", fileName),
    buffer,
    contentType: file.type,
  });

  const importJob = await prisma.importJob.create({
    data: {
      workspaceId: workspace.id,
      requestedById: user.id,
      sourceFilename: file.name,
      sourceMimeType: file.type,
      storedPath: storedObject.key,
      status: "UPLOADED",
      notes: `File stored successfully at ${storedObject.url}.`,
    },
  });

  if (file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
    try {
      await prisma.importJob.update({
        where: { id: importJob.id },
        data: {
          status: "PROCESSING",
          notes: "Parsing PowerPoint slides into editable content.",
        },
      });

      const deck = await parsePptxBuffer(buffer, file.name);
      const presentation = await createPresentationFromPptxImport(deck, user.id, workspace.id);

      await prisma.importJob.update({
        where: { id: importJob.id },
        data: {
          status: "READY",
          presentationId: presentation.id,
          notes: "PowerPoint imported into an editable MotionDeck presentation.",
        },
      });

      return NextResponse.json({
        message: "PPTX imported successfully.",
        presentationId: presentation.id,
      });
    } catch (error) {
      await prisma.importJob.update({
        where: { id: importJob.id },
        data: {
          status: "FAILED",
          notes: error instanceof Error ? error.message : "PPTX import failed.",
        },
      });

      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "PPTX import failed during parsing.",
        },
        { status: 400 },
      );
    }
  }

  try {
    await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        status: "PROCESSING",
        notes: "Parsing PDF pages into editable slides.",
      },
    });

    const deck = await parsePdfBuffer(buffer, file.name);
    const presentation = await createPresentationFromPdfImport(deck, user.id, workspace.id);

    await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        status: "READY",
        presentationId: presentation.id,
        notes: "PDF imported into an editable MotionDeck presentation.",
      },
    });

    return NextResponse.json({
      message: "PDF imported successfully.",
      presentationId: presentation.id,
    });
  } catch (error) {
    await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        status: "FAILED",
        notes: error instanceof Error ? error.message : "PDF import failed.",
      },
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "PDF import failed during parsing.",
      },
      { status: 400 },
    );
  }
}
