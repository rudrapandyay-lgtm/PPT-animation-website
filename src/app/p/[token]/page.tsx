import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { PublicPresentationShell } from "@/components/share/public-presentation-shell";
import { SharePasscodeForm } from "@/components/share/share-passcode-form";
import { prisma } from "@/lib/db";
import { unlockShareAction } from "@/app/p/[token]/actions";

export default async function PublicPresentationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      presentation: {
        include: {
          project: true,
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
      },
    },
  });

  if (!shareLink || !shareLink.isActive) {
    notFound();
  }

  const cookieStore = await cookies();
  const unlocked = cookieStore.get(`motiondeck_share_${token}`)?.value === "granted";
  const requiresPasscode = shareLink.passcodeEnabled && !unlocked;

  const presentation = {
    id: shareLink.presentation.id,
    name: shareLink.presentation.name,
    accent: shareLink.presentation.accent,
    projectName: shareLink.presentation.project.name,
    slides: shareLink.presentation.slides.map((slide) => ({
      id: slide.id,
      title: slide.title,
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
  };

  return (
    <main className="min-h-screen bg-[#050816] px-6 py-6 text-white lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.24),transparent_25%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-amber-200">Shared presentation</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">{presentation.name}</h1>
              <p className="mt-3 text-sm text-slate-300">{presentation.projectName}</p>
            </div>
            <Link href="/" className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10">
              Built with MotionDeck
            </Link>
          </div>

          {requiresPasscode ? (
            <div className="mt-8 max-w-md rounded-[2rem] border border-white/10 bg-slate-950/55 p-6">
              <h2 className="text-2xl font-semibold">Protected client share</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                This presentation is protected with a viewer passcode. Enter it below to unlock the deck.
              </p>
              <SharePasscodeForm token={token} action={unlockShareAction} />
            </div>
          ) : (
            <PublicPresentationShell
              presentation={presentation}
              cover={{
                coverLabel: shareLink.coverLabel,
                coverTitle: shareLink.coverTitle ?? presentation.name,
                coverSubtitle:
                  shareLink.coverSubtitle ??
                  `${presentation.projectName} presented with MotionDeck.`,
                coverButtonText: shareLink.coverButtonText,
              }}
            />
          )}
        </div>
      </div>
    </main>
  );
}
