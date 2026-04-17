"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { type AnimationPreset, type PresentationDocument, type PresentationElement } from "@/lib/types";

function presetVariants(preset: AnimationPreset) {
  switch (preset) {
    case "SLIDE_UP":
      return { initial: { opacity: 0, y: 34 }, animate: { opacity: 1, y: 0 } };
    case "SLIDE_LEFT":
      return { initial: { opacity: 0, x: 34 }, animate: { opacity: 1, x: 0 } };
    case "ZOOM_IN":
      return { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 } };
    case "STAGGER":
      return { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } };
    default:
      return { initial: { opacity: 0 }, animate: { opacity: 1 } };
  }
}

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
    letterSpacing:
      typeof element.style.letterSpacing === "number" ? `${element.style.letterSpacing}em` : undefined,
    textTransform:
      typeof element.style.textTransform === "string" ? element.style.textTransform : undefined,
  };
}

function SlideElement({ element }: { element: PresentationElement }) {
  const variants = presetVariants(element.animation.preset);

  return (
    <motion.div
      initial={variants.initial}
      animate={variants.animate}
      transition={{
        duration: element.animation.durationMs / 1000,
        delay: element.animation.delayMs / 1000,
        ease: "easeOut",
      }}
      className="absolute overflow-hidden"
      style={elementStyle(element)}
    >
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
          style={{ borderRadius: typeof element.style.borderRadius === "number" ? `${element.style.borderRadius}px` : undefined }}
        />
      ) : null}
    </motion.div>
  );
}

export function PresentationPlayer({
  presentation,
  className,
  showControls = true,
}: {
  presentation: PresentationDocument;
  className?: string;
  showControls?: boolean;
}) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [started, setStarted] = useState(!showControls);
  const isStarted = started || !showControls;

  const slide = useMemo(() => presentation.slides[slideIndex], [presentation.slides, slideIndex]);

  return (
    <div className={cn("space-y-4", className)}>
      {showControls ? (
        <div className="flex items-center justify-between gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          <div>
            {slideIndex + 1} / {presentation.slides.length}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="rounded-full border border-white/10 px-4 py-2 text-white hover:bg-white/10"
            >
              Play
            </button>
            <button
              type="button"
              onClick={() => setSlideIndex((value) => Math.max(0, value - 1))}
              className="rounded-full border border-white/10 px-4 py-2 hover:bg-white/10"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setSlideIndex((value) => Math.min(presentation.slides.length - 1, value + 1))}
              className="rounded-full border border-white/10 px-4 py-2 hover:bg-white/10"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <div className="relative aspect-video overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id + String(isStarted)}
            initial={{ opacity: 0.7, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.4 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${String(slide.background.gradientFrom ?? slide.background.base)} 0%, ${String(slide.background.gradientTo ?? slide.background.base)} 100%)`,
            }}
          >
            {isStarted
              ? slide.elements.map((element) => <SlideElement key={element.id} element={element} />)
              : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
