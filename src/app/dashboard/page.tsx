import Link from "next/link";

import { createPresentationAction } from "@/app/actions/presentations";
import { signOutAction } from "@/app/actions/auth";
import { ImportDeckCard } from "@/components/dashboard/import-deck-card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { presentationTemplates } from "@/lib/templates";

export default async function DashboardPage() {
  const user = await requireUser();

  const projects = await prisma.project.findMany({
    where: {
      workspace: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      presentations: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: {
          shareLinks: {
            where: { isActive: true },
            take: 1,
          },
        },
      },
    },
  });

  const importJobs = await prisma.importJob.findMany({
    where: {
      workspace: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      presentation: true,
    },
  });

  return (
    <main className="min-h-screen bg-[#050816] px-6 py-6 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-white/5 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-violet-200">Workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back, {user.name.split(" ")[0]}</h1>
            <p className="mt-2 text-sm text-slate-300">Create a polished deck, refine motion, and share a protected client link.</p>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10">
              Sign out
            </button>
          </form>
        </div>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Premium starter templates</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">Start from a system, not a blank page.</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {presentationTemplates.map((template) => (
              <form key={template.key} action={createPresentationAction} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <input type="hidden" name="templateKey" value={template.key} />
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{template.audience}</p>
                <h3 className="mt-3 text-2xl font-semibold">{template.name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{template.description}</p>
                <button type="submit" className="mt-6 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-200">
                  Use template
                </button>
              </form>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Recent work</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">Your presentations</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {projects.length ? (
              projects.map((project) => {
                const presentation = project.presentations[0];

                if (!presentation) {
                  return null;
                }

                return (
                  <div key={project.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-white/5 px-6 py-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{project.name}</p>
                      <h3 className="mt-2 text-xl font-semibold">{presentation.name}</h3>
                      <p className="mt-2 text-sm text-slate-300">
                        Updated {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(presentation.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {presentation.shareLinks[0] ? (
                        <Link href={`/p/${presentation.shareLinks[0].token}`} className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10">
                          View share link
                        </Link>
                      ) : null}
                      <Link href={`/editor/${presentation.id}`} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-200">
                        Open editor
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center text-slate-300">
                No presentations yet. Choose a premium starter template above to begin.
              </div>
            )}
          </div>
        </section>

        <ImportDeckCard
          recentImports={importJobs.map((job) => ({
            id: job.id,
            sourceFilename: job.sourceFilename,
            sourceMimeType: job.sourceMimeType,
            status: job.status,
            createdAt: new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(job.createdAt),
            presentationId: job.presentationId ?? undefined,
            notes: job.notes,
          }))}
        />
      </div>
    </main>
  );
}
