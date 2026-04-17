import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

import { type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { type ParsedPptxDeck } from "@/lib/importers/pptx";
import { type PresentationDocument, type ShareCoverSettings } from "@/lib/types";
import { getTemplateByKey } from "@/lib/templates";
import { presentationPayloadSchema } from "@/lib/validation";

function buildTemplateCreateData(templateKey: string, userId: string, workspaceId: string) {
  const template = getTemplateByKey(templateKey);

  if (!template) {
    throw new Error("Template not found.");
  }

  return {
    project: {
      workspaceId,
      name: template.name,
      description: template.description,
      createdByUserId: userId,
    },
    presentation: {
      name: template.name,
      templateKey: template.key,
      accent: template.accent,
      sourceType: "TEMPLATE" as const,
      createdByUserId: userId,
      slides: template.slides.map((slide, slideIndex) => ({
        sortOrder: slideIndex,
        title: slide.title,
        background: slide.background as Prisma.InputJsonValue,
        transition: slide.transition as Prisma.InputJsonValue,
        elements: slide.elements.map((element, elementIndex) => ({
          sortOrder: elementIndex,
          type: element.type,
          name: element.name,
          content: element.content as Prisma.InputJsonValue,
          position: element.position as Prisma.InputJsonValue,
          style: element.style as Prisma.InputJsonValue,
          animation: {
            preset: element.animation.preset,
            durationMs: element.animation.durationMs,
            delayMs: element.animation.delayMs,
          },
        })),
      })),
    },
  };
}

export async function createPresentationFromTemplate(templateKey: string, userId: string, workspaceId: string) {
  const data = buildTemplateCreateData(templateKey, userId, workspaceId);

  const project = await prisma.project.create({
    data: {
      workspaceId: data.project.workspaceId,
      name: data.project.name,
      description: data.project.description,
      createdByUserId: data.project.createdByUserId,
      presentations: {
        create: {
          name: data.presentation.name,
          templateKey: data.presentation.templateKey,
          accent: data.presentation.accent,
          sourceType: data.presentation.sourceType,
          createdByUserId: data.presentation.createdByUserId,
          slides: {
            create: data.presentation.slides.map((slide) => ({
              sortOrder: slide.sortOrder,
              title: slide.title,
              background: slide.background,
              transition: slide.transition,
              elements: {
                create: slide.elements.map((element) => ({
                  sortOrder: element.sortOrder,
                  type: element.type,
                  name: element.name,
                  content: element.content,
                  position: element.position,
                  style: element.style,
                  animation: {
                    create: {
                      preset: element.animation.preset,
                      durationMs: element.animation.durationMs,
                      delayMs: element.animation.delayMs,
                    },
                  },
                })),
              },
            })),
          },
        },
      },
    },
    include: {
      presentations: {
        take: 1,
      },
    },
  });

  return project.presentations[0];
}

export async function createPresentationFromPptxImport(
  deck: ParsedPptxDeck,
  userId: string,
  workspaceId: string,
) {
  return createPresentationFromImportedDeck(deck, userId, workspaceId, "Imported from PowerPoint.");
}

export async function createPresentationFromPdfImport(
  deck: ParsedPptxDeck,
  userId: string,
  workspaceId: string,
) {
  return createPresentationFromImportedDeck(deck, userId, workspaceId, "Imported from PDF.");
}

async function createPresentationFromImportedDeck(
  deck: ParsedPptxDeck,
  userId: string,
  workspaceId: string,
  description: string,
) {
  const project = await prisma.project.create({
    data: {
      workspaceId,
      name: deck.name,
      description,
      createdByUserId: userId,
      presentations: {
        create: {
          name: deck.name,
          sourceType: "WEB_EDITOR",
          createdByUserId: userId,
          slides: {
            create: deck.slides.map((slide, slideIndex) => ({
              sortOrder: slideIndex,
              title: slide.title,
              notes: slide.notes,
              background: {
                base: "#050816",
                gradientFrom: "#0f172a",
                gradientTo: "#111827",
              } as Prisma.InputJsonValue,
              transition: { type: "fade", durationMs: 700 } as Prisma.InputJsonValue,
              elements: {
                create: slide.elements.map((element, elementIndex) => ({
                  sortOrder: elementIndex,
                  type: element.type,
                  name: element.name,
                  content:
                    element.type === "TEXT"
                      ? ({ text: element.text ?? "" } as Prisma.InputJsonValue)
                      : element.type === "IMAGE"
                        ? ({ src: element.src ?? "", alt: element.alt ?? element.name } as Prisma.InputJsonValue)
                        : ({ label: element.text ?? element.name } as Prisma.InputJsonValue),
                  position: element.position as Prisma.InputJsonValue,
                  style:
                    element.style
                      ? (element.style as Prisma.InputJsonValue)
                      : element.type === "TEXT"
                      ? ({
                          color: "#f8fafc",
                          fontSize: elementIndex === 0 ? 36 : 20,
                          fontWeight: elementIndex === 0 ? 700 : 500,
                          lineHeight: 1.25,
                        } as Prisma.InputJsonValue)
                      : element.type === "IMAGE"
                        ? ({
                            borderRadius: 20,
                            boxShadow: "0 25px 60px rgba(2,6,23,0.35)",
                          } as Prisma.InputJsonValue)
                        : ({
                            background: "rgba(15,23,42,0.9)",
                            border: "1px solid rgba(148,163,184,0.24)",
                            borderRadius: 24,
                            color: "#f8fafc",
                            fontSize: 20,
                            fontWeight: 600,
                          } as Prisma.InputJsonValue),
                  animation: {
                    create: {
                      preset:
                        element.type === "IMAGE"
                          ? "ZOOM_IN"
                          : element.type === "SHAPE"
                            ? "SLIDE_LEFT"
                            : elementIndex === 0
                              ? "SLIDE_UP"
                              : "FADE_IN",
                      durationMs: 700,
                      delayMs: elementIndex * 90,
                    },
                  },
                })),
              },
            })),
          },
        },
      },
    },
    include: {
      assets: true,
      presentations: {
        take: 1,
      },
    },
  });

  const importedAssets = deck.slides.flatMap((slide) =>
    slide.elements
      .filter((element) => element.type === "IMAGE" && element.src)
      .map((element, index) => ({
        projectId: project.id,
        name: element.name || `Imported asset ${index + 1}`,
        url: element.src ?? "",
        kind: "imported-image",
      })),
  );

  if (importedAssets.length) {
    await prisma.asset.createMany({
      data: importedAssets,
    });
  }

  return project.presentations[0];
}

export async function getPresentationForEditor(presentationId: string, userId: string) {
  return prisma.presentation.findFirst({
    where: {
      id: presentationId,
      project: {
        workspace: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    },
    include: {
      project: {
        include: {
          assets: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
      shareLinks: {
        where: { isActive: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      slides: {
        orderBy: { sortOrder: "asc" },
        include: {
          elements: {
            orderBy: { sortOrder: "asc" },
            include: { animation: true },
          },
        },
      },
    },
  });
}

export async function savePresentationFromPayload(presentationId: string, userId: string, input: unknown) {
  const payload = presentationPayloadSchema.parse(input);

  const existing = await prisma.presentation.findFirst({
    where: {
      id: presentationId,
      project: {
        workspace: {
          members: {
            some: { userId },
          },
        },
      },
    },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Presentation not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.animation.deleteMany({
      where: {
        element: {
          slide: {
            presentationId,
          },
        },
      },
    });

    await tx.element.deleteMany({
      where: {
        slide: {
          presentationId,
        },
      },
    });

    await tx.slide.deleteMany({
      where: { presentationId },
    });

    await tx.presentation.update({
      where: { id: presentationId },
      data: {
        name: payload.name,
        accent: payload.accent,
        slides: {
            create: payload.slides.map((slide, slideIndex) => ({
              sortOrder: slideIndex,
              title: slide.title,
              notes: slide.notes ?? null,
              background: slide.background as Prisma.InputJsonValue,
            transition: slide.transition as Prisma.InputJsonValue,
            elements: {
              create: slide.elements.map((element, elementIndex) => ({
                sortOrder: elementIndex,
                type: element.type,
                name: element.name,
                content: element.content as Prisma.InputJsonValue,
                position: element.position as Prisma.InputJsonValue,
                style: element.style as Prisma.InputJsonValue,
                animation: {
                  create: {
                    preset: element.animation.preset,
                    durationMs: element.animation.durationMs,
                    delayMs: element.animation.delayMs,
                  },
                },
              })),
            },
          })),
        },
      },
    });
  });

  return getPresentationForEditor(presentationId, userId);
}

export async function upsertShareLink(
  presentationId: string,
  userId: string,
  passcodeEnabled: boolean,
  passcode: string,
  cover: ShareCoverSettings,
) {
  const presentation = await prisma.presentation.findFirst({
    where: {
      id: presentationId,
      project: {
        workspace: {
          members: {
            some: { userId },
          },
        },
      },
    },
    include: {
      shareLinks: {
        where: { isActive: true },
        take: 1,
      },
    },
  });

  if (!presentation) {
    throw new Error("Presentation not found.");
  }

  const passcodeHash = passcodeEnabled && passcode ? await bcrypt.hash(passcode, 10) : null;

  if (presentation.shareLinks[0]) {
    return prisma.shareLink.update({
      where: { id: presentation.shareLinks[0].id },
        data: {
        coverLabel: cover.coverLabel,
        coverTitle: cover.coverTitle,
        coverSubtitle: cover.coverSubtitle,
        coverButtonText: cover.coverButtonText,
        passcodeEnabled,
        passcodeHash,
        isActive: true,
      },
    });
  }

  return prisma.shareLink.create({
    data: {
      presentationId,
      token: randomUUID(),
      coverLabel: cover.coverLabel,
      coverTitle: cover.coverTitle,
      coverSubtitle: cover.coverSubtitle,
      coverButtonText: cover.coverButtonText,
      passcodeEnabled,
      passcodeHash,
      isActive: true,
    },
  });
}

export function toPresentationDocument(
  presentation: Awaited<ReturnType<typeof getPresentationForEditor>>,
): PresentationDocument {
  if (!presentation) {
    throw new Error("Presentation not found.");
  }

  return {
    id: presentation.id,
    name: presentation.name,
    accent: presentation.accent,
    projectName: presentation.project.name,
    slides: presentation.slides.map((slide) => ({
      id: slide.id,
      title: slide.title,
      notes: slide.notes,
      background: slide.background as Record<string, string | number>,
      transition: slide.transition as Record<string, string | number>,
      elements: slide.elements.map((element) => ({
        id: element.id,
        type: element.type,
        name: element.name,
        content: element.content as Record<string, string | number>,
        position: element.position as Record<string, number>,
        style: element.style as Record<string, string | number>,
        animation: {
          preset: element.animation?.preset ?? "FADE_IN",
          durationMs: element.animation?.durationMs ?? 700,
          delayMs: element.animation?.delayMs ?? 0,
        },
      })),
    })),
    assets: presentation.project.assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      url: asset.url,
      kind: asset.kind,
    })),
  };
}
