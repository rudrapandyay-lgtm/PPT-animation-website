"use client";

import Link from "next/link";
import { useState } from "react";

import { type PresentationDocument, type PresentationElement } from "@/lib/types";

function elementStyle(element: PresentationElement) {
  return {
    left: `${element.position.x}%`,
    top: `${element.position.y}%`,
    width: `${element.position.w}%`,
    height: `${element.position.h}%`,
    color: typeof element.style.color === "string" ? element.style.color : undefined,
    background: typeof element.style.background === "string" ? element.style.background : undefined,
    border: typeof element.style.border === "string" ? element.style.border : undefined,
    borderRadius:
      typeof element.style.borderRadius === "number"
        ? `${element.style.borderRadius}px`
        : typeof element.style.borderRadius === "string"
          ? element.style.borderRadius
          : undefined,
    boxShadow:
      typeof element.style.boxShadow === "string" ? element.style.boxShadow : undefined,
    fontSize:
      typeof element.style.fontSize === "number" ? `${element.style.fontSize}px` : undefined,
    fontWeight:
      typeof element.style.fontWeight === "number" || typeof element.style.fontWeight === "string"
        ? element.style.fontWeight
        : undefined,
    lineHeight:
      typeof element.style.lineHeight === "number" || typeof element.style.lineHeight === "string"
        ? element.style.lineHeight
        : undefined,
    textTransform:
      typeof element.style.textTransform === "string" ? element.style.textTransform : undefined,
  };
}

function SlideCanvas({ slide }: { slide: PresentationDocument["slides"][number] }) {
  return (
    <div
      className="relative aspect-video overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-[0_30px_80px_rgba(2,6,23,0.45)]"
      style={{
        background: `linear-gradient(135deg, ${String(slide.background.gradientFrom ?? slide.background.base)} 0%, ${String(slide.background.gradientTo ?? slide.background.base)} 100%)`,
      }}
    >
      {slide.elements.map((element) => (
        <div key={element.id} className="absolute overflow-hidden" style={elementStyle(element)}>
          {element.type === "TEXT" ? (
            <div className="h-full whitespace-pre-wrap">{String(element.content.text ?? "")}</div>
          ) : null}
          {element.type === "SHAPE" ? (
            <div className="flex h-full w-full items-center justify-center whitespace-pre-wrap px-4 text-center">
              {String(element.content.label ?? "")}
            </div>
          ) : null}
          {element.type === "IMAGE" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={String(element.content.src ?? "")}
              alt={String(element.content.alt ?? element.name)}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function PresenterShell({ presentation }: { presentation: PresentationDocument }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const currentSlide = presentation.slides[slideIndex];
  const nextSlide = presentation.slides[Math.min(slideIndex + 1, presentation.slides.length - 1)];
  const currentTime = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());

  return (
    <main className="min-h-screen bg-[#050816] px-6 py-6 text-white lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-white/5 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Presenter mode</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{presentation.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-300">{currentTime}</p>
            <Link href={`/editor/${presentation.id}`} className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10">
              Back to editor
            </Link>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-300">
                Slide {slideIndex + 1} of {presentation.slides.length}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSlideIndex((value) => Math.max(0, value - 1))}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setSlideIndex((value) => Math.min(presentation.slides.length - 1, value + 1))}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Next
                </button>
              </div>
            </div>
            <SlideCanvas slide={currentSlide} />
          </section>

          <section className="space-y-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Up next</p>
              <div className="mt-4">
                <SlideCanvas slide={nextSlide} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Speaker notes</p>
              <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4 text-sm leading-7 text-slate-200">
                {currentSlide.notes?.trim() ? currentSlide.notes : "No notes for this slide."}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Shortcuts</p>
              <div className="mt-4 grid gap-3 text-sm text-slate-300">
                <p><span className="font-semibold text-white">Left Arrow</span> Previous slide</p>
                <p><span className="font-semibold text-white">Right Arrow</span> Next slide</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
