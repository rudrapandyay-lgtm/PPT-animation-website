"use client";

import { useState } from "react";

import { PresentationPlayer } from "@/components/editor/presentation-player";
import { type PresentationDocument, type ShareCoverSettings } from "@/lib/types";

export function PublicPresentationShell({
  presentation,
  cover,
}: {
  presentation: PresentationDocument;
  cover: ShareCoverSettings;
}) {
  const [entered, setEntered] = useState(false);

  if (!entered) {
    return (
      <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-8 shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
          <p className="text-sm uppercase tracking-[0.28em] text-amber-200">{cover.coverLabel}</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {cover.coverTitle}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            {cover.coverSubtitle}
          </p>
          <button
            type="button"
            onClick={() => setEntered(true)}
            className="mt-8 rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-200"
          >
            {cover.coverButtonText}
          </button>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4">
          <div className="aspect-video rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.2),transparent_25%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-6">
            <div className="flex h-full flex-col justify-between rounded-[1.3rem] border border-white/10 bg-slate-950/60 p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Preview</p>
                <h3 className="mt-3 text-2xl font-semibold text-white">{presentation.name}</h3>
                <p className="mt-2 text-sm text-slate-300">{presentation.projectName}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  {presentation.slides.length} slides
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  Motion enabled
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  Protected share
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
        <p>{cover.coverTitle}</p>
        <button
          type="button"
          onClick={() => setEntered(false)}
          className="rounded-full border border-white/10 px-4 py-2 hover:bg-white/10"
        >
          Back to cover
        </button>
      </div>
      <PresentationPlayer presentation={presentation} />
    </div>
  );
}
