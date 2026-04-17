import Link from "next/link";

import { PresentationPlayer } from "@/components/editor/presentation-player";
import { presentationTemplates } from "@/lib/templates";

export default function Home() {
  const previewTemplate = presentationTemplates[0];

  return (
    <main className="overflow-hidden bg-[#050816] text-white">
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-6 lg:px-8 lg:pt-8">
        <div className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
          <div className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-200">MotionDeck</div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/sign-in" className="text-slate-300 hover:text-white">
              Sign in
            </Link>
            <Link href="/sign-up" className="rounded-full bg-white px-4 py-2 font-semibold text-slate-950 hover:bg-slate-200">
              Start free
            </Link>
          </div>
        </div>

        <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-200">Presentation motion studio</p>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
              Turn static decks into premium client-facing motion.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              MotionDeck gives agencies and professional teams premium starter templates, in-browser motion controls, and private share links that feel finished before the meeting starts.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/sign-up" className="rounded-full bg-white px-6 py-3 font-semibold text-slate-950 hover:bg-slate-200">
                Build your first deck
              </Link>
              <a href="#templates" className="rounded-full border border-white/10 px-6 py-3 font-semibold text-white hover:bg-white/10">
                View templates
              </a>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                <p className="text-3xl font-semibold">3</p>
                <p className="mt-2 text-sm text-slate-300">Premium starter systems for agencies, sales teams, and proposals.</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                <p className="text-3xl font-semibold">5</p>
                <p className="mt-2 text-sm text-slate-300">Built-in motion presets per element with timing control.</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                <p className="text-3xl font-semibold">1</p>
                <p className="mt-2 text-sm text-slate-300">Protected share link for client-ready delivery.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.32),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4 shadow-[0_40px_120px_rgba(2,6,23,0.6)]">
            <PresentationPlayer
              presentation={{
                id: previewTemplate.key,
                name: previewTemplate.name,
                accent: previewTemplate.accent,
                slides: previewTemplate.slides.map((slide) => ({
                  id: slide.id,
                  title: slide.title,
                  background: slide.background,
                  transition: slide.transition,
                  elements: slide.elements,
                })),
              }}
            />
          </div>
        </div>
      </section>

      <section id="templates" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Starter templates</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Start with a deck that already looks expensive.</h2>
          </div>
          <Link href="/sign-up" className="hidden rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 md:inline-flex">
            Create workspace
          </Link>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {presentationTemplates.map((template) => (
            <article key={template.key} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">{template.audience}</p>
                <h3 className="mt-4 text-2xl font-semibold">{template.name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{template.description}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="rounded-full border border-white/10 px-3 py-2">Premium dark palette</span>
                <span className="rounded-full border border-white/10 px-3 py-2">Animated structure</span>
                <span className="rounded-full border border-white/10 px-3 py-2">Client-share ready</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
