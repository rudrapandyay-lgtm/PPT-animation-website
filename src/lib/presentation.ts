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

function buildPresentationInsertGraph(
  slides: Array<{
    title: string;
    notes?: string;
    background: Prisma.InputJsonValue;
    transition: Prisma.InputJsonValue;
    elements: Array<{
      type: "TEXT" | "IMAGE" | "SHAPE";
      name: string;
      content: Prisma.InputJsonValue;
      position: Prisma.InputJsonValue;
      style: Prisma.InputJsonValue;
      animation: {
        preset: "FADE_IN" | "SLIDE_UP" | "SLIDE_LEFT" | "ZOOM_IN" | "STAGGER";
        durationMs: number;
        delayMs: number;
      };
    }>;
  }>,
  presentationId: string,
) {
  const slideRows: Prisma.SlideCreateManyInput[] = [];
  const elementRows: Prisma.ElementCreateManyInput[] = [];
  const animationRows: Prisma.AnimationCreateManyInput[] = [];

  for (let slideIndex = 0; slideIndex < slides.length; slideIndex += 1) {
    const slideId = randomUUID();
    const slide = slides[slideIndex];
    slideRows.push({
      id: slideId,
      presentationId,
      sortOrder: slideIndex,
      title: slide.title,
      notes: slide.notes ?? null,
      background: slide.background,
      transition: slide.transition,
    });

    for (let elementIndex = 0; elementIndex < slide.elements.length; elementIndex += 1) {
      const elementId = randomUUID();
      const element = slide.elements[elementIndex];
      elementRows.push({
        id: elementId,
        slideId,
        sortOrder: elementIndex,
        type: element.type,
        name: element.name,
        content: element.content,
        position: element.position,
        style: element.style,
      });
      animationRows.push({
        id: randomUUID(),
        elementId,
        preset: element.animation.preset,
        durationMs: element.animation.durationMs,
        delayMs: element.animation.delayMs,
        easing: "easeOut",
      });
    }
  }

  return { slideRows, elementRows, animationRows };
}

export async function createPresentationFromTemplate(templateKey: string, userId: string, workspaceId: string) {
  const data = buildTemplateCreateData(templateKey, userId, workspaceId);
  const projectId = randomUUID();
  const presentationId = randomUUID();
  const { slideRows, elementRows, animationRows } = buildPresentationInsertGraph(
    data.presentation.slides.map((slide) => ({
      title: slide.title,
      background: slide.background,
      transition: slide.transition,
      elements: slide.elements.map((element) => ({
        type: element.type,
        name: element.name,
        content: element.content,
        position: element.position,
        style: element.style,
        animation: element.animation,
      })),
    })),
    presentationId,
  );

  await prisma.$transaction([
    prisma.project.create({
      data: {
        id: projectId,
        workspaceId: data.project.workspaceId,
        name: data.project.name,
        description: data.project.description,
        createdByUserId: data.project.createdByUserId,
      },
    }),
    prisma.presentation.create({
      data: {
        id: presentationId,
        projectId,
        name: data.presentation.name,
        templateKey: data.presentation.templateKey,
        accent: data.presentation.accent,
        sourceType: data.presentation.sourceType,
        createdByUserId: data.presentation.createdByUserId,
      },
    }),
    prisma.slide.createMany({ data: slideRows }),
    prisma.element.createMany({ data: elementRows }),
    prisma.animation.createMany({ data: animationRows }),
  ]);

  return prisma.presentation.findUniqueOrThrow({ where: { id: presentationId } });
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

  const { slideRows, elementRows, animationRows } = buildPresentationInsertGraph(
    payload.slides.map((slide) => ({
      title: slide.title ?? "Untitled slide",
      notes: slide.notes ?? undefined,
      background: slide.background as Prisma.InputJsonValue,
      transition: slide.transition as Prisma.InputJsonValue,
      elements: slide.elements.map((element) => ({
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
    presentationId,
  );

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
      },
    });

    await tx.slide.createMany({ data: slideRows });
    await tx.element.createMany({ data: elementRows });
    await tx.animation.createMany({ data: animationRows });
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
