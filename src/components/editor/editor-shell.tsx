"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { PresentationPlayer } from "@/components/editor/presentation-player";
import {
  type AnimationPreset,
  type PresentationAsset,
  type PresentationDocument,
  type PresentationElement,
  type PresentationSlide,
  type ShareCoverSettings,
} from "@/lib/types";
import { absoluteUrl, cn } from "@/lib/utils";

const presets: { value: AnimationPreset; label: string }[] = [
  { value: "FADE_IN", label: "Fade in" },
  { value: "SLIDE_UP", label: "Slide up" },
  { value: "SLIDE_LEFT", label: "Slide left" },
  { value: "ZOOM_IN", label: "Zoom in" },
  { value: "STAGGER", label: "Stagger" },
];

type CanvasInteraction = {
  mode: "drag" | "resize";
  elementId: string;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  originW: number;
  originH: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function styleFromElement(element: PresentationElement) {
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
    boxShadow: typeof element.style.boxShadow === "string" ? element.style.boxShadow : undefined,
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

function createDefaultSlide(index: number): PresentationSlide {
  const slideId = crypto.randomUUID();
  const titleId = crypto.randomUUID();

  return {
    id: slideId,
    title: `New slide ${index + 1}`,
    background: {
      base: "#050816",
      gradientFrom: "#0f172a",
      gradientTo: "#111827",
    },
    transition: { type: "fade", durationMs: 700 },
    elements: [
      {
        id: titleId,
        type: "TEXT",
        name: "Title",
        content: { text: "New slide title" },
        position: { x: 8, y: 16, w: 44, h: 18 },
        style: {
          color: "#f8fafc",
          fontSize: 42,
          fontWeight: 700,
          lineHeight: 1.08,
        },
        animation: {
          preset: "SLIDE_UP",
          durationMs: 700,
          delayMs: 80,
        },
      },
    ],
  };
}

function reorderSlides(slides: PresentationSlide[], fromIndex: number, toIndex: number) {
  const next = [...slides];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function createElement(type: PresentationElement["type"], index: number): PresentationElement {
  const id = crypto.randomUUID();

  if (type === "TEXT") {
    return {
      id,
      type,
      name: `Text ${index + 1}`,
      content: { text: "New text block" },
      position: { x: 10, y: 24 + index * 6, w: 38, h: 12 },
      style: {
        color: "#f8fafc",
        fontSize: 24,
        fontWeight: 600,
        lineHeight: 1.2,
      },
      animation: { preset: "FADE_IN", durationMs: 700, delayMs: index * 60 },
    };
  }

  if (type === "IMAGE") {
    return {
      id,
      type,
      name: `Image ${index + 1}`,
      content: {
        src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        alt: "Uploaded image",
      },
      position: { x: 52, y: 20, w: 28, h: 34 },
      style: {
        borderRadius: 24,
        boxShadow: "0 25px 60px rgba(2,6,23,0.35)",
      },
      animation: { preset: "ZOOM_IN", durationMs: 750, delayMs: index * 60 },
    };
  }

  return {
    id,
    type,
    name: `Shape ${index + 1}`,
    content: { label: "New callout" },
    position: { x: 10, y: 58, w: 30, h: 14 },
    style: {
      background: "rgba(139,92,246,0.18)",
      border: "1px solid rgba(196,181,253,0.28)",
      borderRadius: 24,
      color: "#f5f3ff",
      fontSize: 20,
      fontWeight: 600,
    },
    animation: { preset: "SLIDE_UP", durationMs: 700, delayMs: index * 60 },
  };
}

function duplicateSlide(slide: PresentationSlide): PresentationSlide {
  return {
    ...slide,
    id: crypto.randomUUID(),
    elements: slide.elements.map((element) => ({
      ...element,
      id: crypto.randomUUID(),
    })),
  };
}

export function EditorShell({
  initialPresentation,
  existingShareToken,
  existingPasscodeEnabled,
  initialShareCover,
  assets,
}: {
  initialPresentation: PresentationDocument;
  existingShareToken?: string;
  existingPasscodeEnabled?: boolean;
  initialShareCover: ShareCoverSettings;
  assets: PresentationAsset[];
}) {
  const [presentation, setPresentation] = useState(initialPresentation);
  const [selectedSlideId, setSelectedSlideId] = useState<string | undefined>(
    initialPresentation.slides[0]?.id,
  );
  const [selectedElementId, setSelectedElementId] = useState<string | undefined>(
    initialPresentation.slides[0]?.elements[0]?.id,
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [saveState, setSaveState] = useState<string | null>(null);
  const [shareState, setShareState] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState(
    existingShareToken ? absoluteUrl(`/p/${existingShareToken}`) : "",
  );
  const [sharePasscodeEnabled, setSharePasscodeEnabled] = useState(Boolean(existingPasscodeEnabled));
  const [sharePasscode, setSharePasscode] = useState("");
  const [shareCover, setShareCover] = useState(initialShareCover);
  const [undoStack, setUndoStack] = useState<PresentationDocument[]>([]);
  const [redoStack, setRedoStack] = useState<PresentationDocument[]>([]);
  const [isPending, startTransition] = useTransition();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<CanvasInteraction | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMountedRef = useRef(false);
  const isRestoringRef = useRef(false);

  const selectedSlide = useMemo(
    () => presentation.slides.find((slide) => slide.id === selectedSlideId) ?? presentation.slides[0],
    [presentation.slides, selectedSlideId],
  );

  const selectedElement = useMemo(
    () => selectedSlide?.elements.find((element) => element.id === selectedElementId) ?? selectedSlide?.elements[0],
    [selectedElementId, selectedSlide],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isMeta = event.ctrlKey || event.metaKey;

      if (!isMeta) {
        return;
      }

      if (event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      }

      if (event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey)) {
        event.preventDefault();
        redo();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function updatePresentation(
    updater: (current: PresentationDocument) => PresentationDocument,
    options?: { trackHistory?: boolean },
  ) {
    setPresentation((current) => {
      const next = updater(current);

      if (options?.trackHistory !== false) {
        setUndoStack((stack) => [...stack.slice(-39), structuredClone(current)]);
        setRedoStack([]);
      }

      return next;
    });
  }

  function updatePresentationName(name: string) {
    updatePresentation((current) => ({ ...current, name }));
  }

  function updateSelectedElement(updater: (element: PresentationElement) => PresentationElement) {
    if (!selectedSlide || !selectedElement) {
      return;
    }

    updatePresentation((current) => ({
      ...current,
      slides: current.slides.map((slide) =>
        slide.id !== selectedSlide.id
          ? slide
          : {
              ...slide,
              elements: slide.elements.map((element) =>
                element.id === selectedElement.id ? updater(element) : element,
              ),
            },
      ),
    }));
  }

  function setSelectedSlide(slideId: string) {
    const slide = presentation.slides.find((item) => item.id === slideId);
    setSelectedSlideId(slideId);
    setSelectedElementId(slide?.elements[0]?.id);
  }

  function addSlide() {
    const nextSlide = createDefaultSlide(presentation.slides.length);
    updatePresentation((current) => ({
      ...current,
      slides: [...current.slides, nextSlide],
    }));
    setSelectedSlideId(nextSlide.id);
    setSelectedElementId(nextSlide.elements[0]?.id);
  }

  function duplicateSelectedSlide() {
    if (!selectedSlide) {
      return;
    }

    const duplicated = duplicateSlide(selectedSlide);
    const currentIndex = presentation.slides.findIndex((slide) => slide.id === selectedSlide.id);

    updatePresentation((current) => {
      const nextSlides = [...current.slides];
      nextSlides.splice(currentIndex + 1, 0, duplicated);
      return {
        ...current,
        slides: nextSlides,
      };
    });

    setSelectedSlideId(duplicated.id);
    setSelectedElementId(duplicated.elements[0]?.id);
  }

  function moveSelectedSlide(direction: -1 | 1) {
    if (!selectedSlide) {
      return;
    }

    const currentIndex = presentation.slides.findIndex((slide) => slide.id === selectedSlide.id);
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= presentation.slides.length) {
      return;
    }

    updatePresentation((current) => ({
      ...current,
      slides: reorderSlides(current.slides, currentIndex, nextIndex),
    }));
  }

  function deleteSelectedSlide() {
    if (!selectedSlide || presentation.slides.length === 1) {
      return;
    }

    const currentIndex = presentation.slides.findIndex((slide) => slide.id === selectedSlide.id);
    const remaining = presentation.slides.filter((slide) => slide.id !== selectedSlide.id);
    const nextSlide = remaining[Math.max(0, currentIndex - 1)] ?? remaining[0];

    updatePresentation((current) => ({
      ...current,
      slides: current.slides.filter((slide) => slide.id !== selectedSlide.id),
    }));
    setSelectedSlideId(nextSlide.id);
    setSelectedElementId(nextSlide.elements[0]?.id);
  }

  function addElement(type: PresentationElement["type"]) {
    if (!selectedSlide) {
      return;
    }

    const nextElement = createElement(type, selectedSlide.elements.length);
    updatePresentation((current) => ({
      ...current,
      slides: current.slides.map((slide) =>
        slide.id !== selectedSlide.id
          ? slide
          : {
              ...slide,
              elements: [...slide.elements, nextElement],
            },
      ),
    }));
    setSelectedElementId(nextElement.id);
  }

  function undo() {
    setUndoStack((stack) => {
      const previous = stack[stack.length - 1];
      if (!previous) {
        return stack;
      }

      isRestoringRef.current = true;
      setRedoStack((future) => [structuredClone(presentation), ...future.slice(0, 39)]);
      setPresentation(previous);
      return stack.slice(0, -1);
    });
  }

  function redo() {
    setRedoStack((stack) => {
      const next = stack[0];
      if (!next) {
        return stack;
      }

      isRestoringRef.current = true;
      setUndoStack((history) => [...history.slice(-39), structuredClone(presentation)]);
      setPresentation(next);
      return stack.slice(1);
    });
  }

  function beginInteraction(
    event: ReactPointerEvent<HTMLButtonElement | HTMLDivElement | HTMLSpanElement>,
    element: PresentationElement,
    mode: CanvasInteraction["mode"],
  ) {
    if (!canvasRef.current) {
      return;
    }

    interactionRef.current = {
      mode,
      elementId: element.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: element.position.x,
      originY: element.position.y,
      originW: element.position.w,
      originH: element.position.h,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleCanvasPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const interaction = interactionRef.current;
    const canvas = canvasRef.current;

    if (!interaction || !canvas || event.pointerId !== interaction.pointerId) {
      return;
    }

    const deltaX = ((event.clientX - interaction.startX) / canvas.clientWidth) * 100;
    const deltaY = ((event.clientY - interaction.startY) / canvas.clientHeight) * 100;

    updatePresentation((current) => ({
      ...current,
      slides: current.slides.map((slide) =>
        slide.id !== selectedSlideId
          ? slide
          : {
              ...slide,
              elements: slide.elements.map((element) => {
                if (element.id !== interaction.elementId) {
                  return element;
                }

                if (interaction.mode === "drag") {
                  const nextX = clamp(interaction.originX + deltaX, 0, 100 - element.position.w);
                  const nextY = clamp(interaction.originY + deltaY, 0, 100 - element.position.h);

                  return {
                    ...element,
                    position: {
                      ...element.position,
                      x: Number(nextX.toFixed(2)),
                      y: Number(nextY.toFixed(2)),
                    },
                  };
                }

                const nextW = clamp(interaction.originW + deltaX, 8, 100 - interaction.originX);
                const nextH = clamp(interaction.originH + deltaY, 6, 100 - interaction.originY);

                return {
                  ...element,
                  position: {
                    ...element.position,
                    w: Number(nextW.toFixed(2)),
                    h: Number(nextH.toFixed(2)),
                  },
                };
              }),
            },
      ),
    }));
  }

  function clearInteraction(pointerId?: number) {
    if (!interactionRef.current) {
      return;
    }

    if (pointerId !== undefined && interactionRef.current.pointerId !== pointerId) {
      return;
    }

    interactionRef.current = null;
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !selectedElement || selectedElement.type !== "IMAGE") {
      return;
    }

    const fileDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Could not read image."));
      reader.readAsDataURL(file);
    });

    updateSelectedElement((element) => ({
      ...element,
      content: {
        ...element.content,
        src: fileDataUrl,
        alt: file.name,
      },
    }));

    event.target.value = "";
  }

  const savePresentation = useCallback(async (isAuto = false) => {
    setSaveState(isAuto ? "Autosaving..." : null);

    const response = await fetch(`/api/presentations/${presentation.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(presentation),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setSaveState(payload?.error ?? "Could not save the presentation.");
      return;
    }

    setSaveState(isAuto ? "All changes saved." : "Presentation saved.");
  }, [presentation]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      void savePresentation(true);
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [presentation, savePresentation]);

  async function createShareLink() {
    setShareState(null);

    const response = await fetch(`/api/presentations/${presentation.id}/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        passcodeEnabled: sharePasscodeEnabled,
        passcode: sharePasscode,
        ...shareCover,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setShareState(payload?.error ?? "Could not create share link.");
      return;
    }

    const payload = (await response.json()) as {
      url: string;
      passcodeEnabled: boolean;
      coverLabel: string;
      coverTitle: string | null;
      coverSubtitle: string | null;
      coverButtonText: string;
    };

    setShareUrl(payload.url);
    setShareCover({
      coverLabel: payload.coverLabel,
      coverTitle: payload.coverTitle ?? shareCover.coverTitle,
      coverSubtitle: payload.coverSubtitle ?? shareCover.coverSubtitle,
      coverButtonText: payload.coverButtonText,
    });
    setShareState(payload.passcodeEnabled ? "Protected link ready." : "Share link ready.");
  }

  async function copyShareUrl() {
    if (!shareUrl) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    setShareState("Link copied.");
  }

  const selectedSlideIndex = selectedSlide
    ? presentation.slides.findIndex((slide) => slide.id === selectedSlide.id)
    : -1;

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-4 lg:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
          <div>
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">
              Back to dashboard
            </Link>
            <input
              value={presentation.name}
              onChange={(event) => updatePresentationName(event.target.value)}
              className="mt-2 block bg-transparent text-2xl font-semibold tracking-tight outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={undo}
              disabled={!undoStack.length}
              className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-40"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!redoStack.length}
              className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-40"
            >
              Redo
            </button>
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
            >
              Preview
            </button>
            <Link
              href={`/present/${presentation.id}`}
              className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
            >
              Presenter
            </Link>
            <a
              href={`/api/presentations/${presentation.id}/export/html`}
              className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
            >
              Export HTML
            </a>
            <a
              href={`/api/presentations/${presentation.id}/export/mp4`}
              className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
            >
              Export MP4
            </a>
            <button
              type="button"
              onClick={() => startTransition(() => void savePresentation())}
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-200"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="grid flex-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
          <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Slides</p>
              <button
                type="button"
                onClick={addSlide}
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/10"
              >
                Add slide
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {presentation.slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setSelectedSlide(slide.id)}
                  className={cn(
                    "w-full rounded-3xl border px-4 py-4 text-left transition",
                    selectedSlide?.id === slide.id
                      ? "border-violet-300/60 bg-violet-400/10"
                      : "border-white/10 bg-slate-950/40 hover:bg-white/6",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Slide {index + 1}</p>
                      <p className="mt-2 font-medium text-slate-100">{slide.title ?? `Untitled ${index + 1}`}</p>
                    </div>
                    {selectedSlide?.id === slide.id ? (
                      <div className="flex gap-1">
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                          Active
                        </span>
                      </div>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>

            {selectedSlide ? (
              <div className="mt-5 grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={duplicateSelectedSlide}
                  className="rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold"
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => moveSelectedSlide(-1)}
                  disabled={selectedSlideIndex <= 0}
                  className="rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold disabled:opacity-40"
                >
                  Move up
                </button>
                <button
                  type="button"
                  onClick={() => moveSelectedSlide(1)}
                  disabled={selectedSlideIndex === presentation.slides.length - 1}
                  className="rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold disabled:opacity-40"
                >
                  Move down
                </button>
                <button
                  type="button"
                  onClick={deleteSelectedSlide}
                  disabled={presentation.slides.length === 1}
                  className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            ) : null}
          </aside>

          <main className="rounded-[2rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Canvas</p>
                <p className="mt-1 text-sm text-slate-300">
                  Drag elements to reposition them. Use the bottom-right handle to resize.
                </p>
                {selectedSlide?.notes ? (
                  <p className="mt-2 text-xs text-slate-400">Speaker notes imported for this slide.</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => addElement("TEXT")}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                >
                  Add text
                </button>
                <button
                  type="button"
                  onClick={() => addElement("SHAPE")}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                >
                  Add shape
                </button>
                <button
                  type="button"
                  onClick={() => addElement("IMAGE")}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                >
                  Add image
                </button>
                {saveState ? <p className="text-sm text-emerald-300">{saveState}</p> : null}
              </div>
            </div>

            {selectedSlide ? (
              <div
                ref={canvasRef}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={(event) => clearInteraction(event.pointerId)}
                onPointerCancel={(event) => clearInteraction(event.pointerId)}
                className="relative mx-auto aspect-video w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-[0_30px_80px_rgba(2,6,23,0.45)]"
                style={{
                  background: `linear-gradient(135deg, ${String(selectedSlide.background.gradientFrom ?? selectedSlide.background.base)} 0%, ${String(selectedSlide.background.gradientTo ?? selectedSlide.background.base)} 100%)`,
                }}
              >
                {selectedSlide.elements.map((element) => (
                  <button
                    key={element.id}
                    type="button"
                    onPointerDown={(event) => {
                      setSelectedElementId(element.id);
                      beginInteraction(event, element, "drag");
                    }}
                    className={cn(
                      "absolute overflow-hidden text-left transition",
                      selectedElement?.id === element.id
                        ? "ring-2 ring-violet-300"
                        : "ring-1 ring-transparent hover:ring-white/30",
                    )}
                    style={{ ...styleFromElement(element), cursor: "move" }}
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
                      />
                    ) : null}
                    <span
                      role="presentation"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        setSelectedElementId(element.id);
                        beginInteraction(event, element, "resize");
                      }}
                      className="absolute bottom-1 right-1 h-4 w-4 rounded-full border border-white/60 bg-white/30"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </main>

          <aside className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Properties</p>
              {selectedSlide ? (
                <div className="mt-4 space-y-4">
                  <label className="block space-y-2">
                    <span className="text-sm text-slate-300">Speaker notes</span>
                    <textarea
                      value={selectedSlide.notes ?? ""}
                      onChange={(event) =>
                        updatePresentation((current) => ({
                          ...current,
                          slides: current.slides.map((slide) =>
                            slide.id !== selectedSlide.id
                              ? slide
                              : {
                                  ...slide,
                                  notes: event.target.value,
                                },
                          ),
                        }))
                      }
                      rows={4}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none focus:border-violet-400"
                    />
                  </label>

                  {selectedElement ? (
                    <>
                  <div>
                    <p className="text-sm font-medium text-slate-100">{selectedElement.name}</p>
                    <p className="text-sm text-slate-400">{selectedElement.type.toLowerCase()} element</p>
                  </div>

                  {selectedElement.type === "TEXT" ? (
                    <label className="block space-y-2">
                      <span className="text-sm text-slate-300">Text content</span>
                      <textarea
                        value={String(selectedElement.content.text ?? "")}
                        onChange={(event) =>
                          updateSelectedElement((element) => ({
                            ...element,
                            content: { ...element.content, text: event.target.value },
                          }))
                        }
                        rows={6}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none focus:border-violet-400"
                      />
                    </label>
                  ) : null}

                  {selectedElement.type === "SHAPE" ? (
                    <label className="block space-y-2">
                      <span className="text-sm text-slate-300">Label</span>
                      <textarea
                        value={String(selectedElement.content.label ?? "")}
                        onChange={(event) =>
                          updateSelectedElement((element) => ({
                            ...element,
                            content: { ...element.content, label: event.target.value },
                          }))
                        }
                        rows={4}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none focus:border-violet-400"
                      />
                    </label>
                  ) : null}

                  {selectedElement.type === "IMAGE" ? (
                    <div className="space-y-3">
                      <label className="block space-y-2">
                        <span className="text-sm text-slate-300">Image URL</span>
                        <input
                          value={String(selectedElement.content.src ?? "")}
                          onChange={(event) =>
                            updateSelectedElement((element) => ({
                              ...element,
                              content: { ...element.content, src: event.target.value },
                            }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none focus:border-violet-400"
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-sm text-slate-300">Upload image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => void handleImageUpload(event)}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-violet-300 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
                        />
                      </label>
                      <p className="text-xs leading-5 text-slate-400">
                        Uploaded images are embedded directly into the presentation so they save with the deck.
                      </p>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block space-y-2">
                      <span className="text-sm text-slate-300">X</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={selectedElement.position.x}
                        onChange={(event) =>
                          updateSelectedElement((element) => ({
                            ...element,
                            position: {
                              ...element.position,
                              x: clamp(Number(event.target.value), 0, 100 - element.position.w),
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none focus:border-violet-400"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm text-slate-300">Y</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={selectedElement.position.y}
                        onChange={(event) =>
                          updateSelectedElement((element) => ({
                            ...element,
                            position: {
                              ...element.position,
                              y: clamp(Number(event.target.value), 0, 100 - element.position.h),
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none focus:border-violet-400"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm text-slate-300">Width</span>
                      <input
                        type="number"
                        min={8}
                        max={100}
                        step={0.5}
                        value={selectedElement.position.w}
                        onChange={(event) =>
                          updateSelectedElement((element) => ({
                            ...element,
                            position: {
                              ...element.position,
                              w: clamp(Number(event.target.value), 8, 100 - element.position.x),
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none focus:border-violet-400"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm text-slate-300">Height</span>
                      <input
                        type="number"
                        min={6}
                        max={100}
                        step={0.5}
                        value={selectedElement.position.h}
                        onChange={(event) =>
                          updateSelectedElement((element) => ({
                            ...element,
                            position: {
                              ...element.position,
                              h: clamp(Number(event.target.value), 6, 100 - element.position.y),
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none focus:border-violet-400"
                      />
                    </label>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-sm text-slate-300">Animation preset</span>
                    <select
                      value={selectedElement.animation.preset}
                      onChange={(event) =>
                        updateSelectedElement((element) => ({
                          ...element,
                          animation: {
                            ...element.animation,
                            preset: event.target.value as AnimationPreset,
                          },
                        }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none focus:border-violet-400"
                    >
                      {presets.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block space-y-2">
                      <span className="text-sm text-slate-300">Duration</span>
                      <input
                        type="number"
                        min={150}
                        max={4000}
                        step={50}
                        value={selectedElement.animation.durationMs}
                        onChange={(event) =>
                          updateSelectedElement((element) => ({
                            ...element,
                            animation: {
                              ...element.animation,
                              durationMs: Number(event.target.value),
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none focus:border-violet-400"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm text-slate-300">Delay</span>
                      <input
                        type="number"
                        min={0}
                        max={4000}
                        step={50}
                        value={selectedElement.animation.delayMs}
                        onChange={(event) =>
                          updateSelectedElement((element) => ({
                            ...element,
                            animation: {
                              ...element.animation,
                              delayMs: Number(event.target.value),
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none focus:border-violet-400"
                      />
                    </label>
                  </div>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Asset library</p>
              <div className="mt-4 space-y-3">
                {assets.length ? (
                  assets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => {
                        if (!selectedElement || selectedElement.type !== "IMAGE") {
                          return;
                        }

                        updateSelectedElement((element) => ({
                          ...element,
                          content: {
                            ...element.content,
                            src: asset.url,
                            alt: asset.name,
                          },
                        }));
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={asset.url} alt={asset.name} className="h-12 w-12 rounded-xl object-cover" />
                      <div>
                        <p className="text-sm font-medium text-slate-100">{asset.name}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{asset.kind}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No imported assets yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Share</p>
              <div className="mt-4 space-y-3">
                <label className="block space-y-2">
                  <span className="text-sm text-slate-300">Cover label</span>
                  <input
                    value={shareCover.coverLabel}
                    onChange={(event) =>
                      setShareCover((current) => ({ ...current, coverLabel: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-400"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-slate-300">Cover title</span>
                  <textarea
                    value={shareCover.coverTitle}
                    onChange={(event) =>
                      setShareCover((current) => ({ ...current, coverTitle: event.target.value }))
                    }
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-400"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-slate-300">Cover subtitle</span>
                  <textarea
                    value={shareCover.coverSubtitle}
                    onChange={(event) =>
                      setShareCover((current) => ({ ...current, coverSubtitle: event.target.value }))
                    }
                    rows={4}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-400"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-slate-300">Button text</span>
                  <input
                    value={shareCover.coverButtonText}
                    onChange={(event) =>
                      setShareCover((current) => ({ ...current, coverButtonText: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-400"
                  />
                </label>
              </div>
              <label className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200">
                <span>Viewer passcode</span>
                <input
                  checked={sharePasscodeEnabled}
                  onChange={(event) => setSharePasscodeEnabled(event.target.checked)}
                  type="checkbox"
                  className="h-4 w-4"
                />
              </label>

              {sharePasscodeEnabled ? (
                <input
                  value={sharePasscode}
                  onChange={(event) => setSharePasscode(event.target.value)}
                  placeholder="Create passcode"
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-400"
                />
              ) : null}

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => startTransition(() => void createShareLink())}
                  className="rounded-full bg-violet-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-violet-300"
                >
                  {isPending ? "Working..." : "Generate link"}
                </button>
                <button
                  type="button"
                  onClick={() => startTransition(() => void copyShareUrl())}
                  disabled={!shareUrl}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm disabled:opacity-40"
                >
                  Copy
                </button>
              </div>

              {shareUrl ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                  <p className="break-all">{shareUrl}</p>
                </div>
              ) : null}
              {shareState ? <p className="mt-3 text-sm text-emerald-300">{shareState}</p> : null}
            </div>
          </aside>
        </div>
      </div>

      {isPreviewOpen ? (
        <div className="fixed inset-0 z-50 overflow-auto bg-slate-950/90 px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              >
                Close preview
              </button>
            </div>
            <PresentationPlayer presentation={presentation} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
