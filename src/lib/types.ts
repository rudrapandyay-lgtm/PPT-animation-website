export type AnimationPreset = "FADE_IN" | "SLIDE_UP" | "SLIDE_LEFT" | "ZOOM_IN" | "STAGGER";

export type PresentationElement = {
  id: string;
  type: "TEXT" | "IMAGE" | "SHAPE";
  name: string;
  content: Record<string, string | number>;
  position: Record<string, number>;
  style: Record<string, string | number>;
  animation: {
    preset: AnimationPreset;
    durationMs: number;
    delayMs: number;
  };
};

export type PresentationSlide = {
  id: string;
  title: string | null;
  notes?: string | null;
  background: Record<string, string | number>;
  transition: Record<string, string | number>;
  elements: PresentationElement[];
};

export type PresentationAsset = {
  id: string;
  name: string;
  url: string;
  kind: string;
};

export type PresentationDocument = {
  id: string;
  name: string;
  accent: string;
  projectName?: string;
  assets?: PresentationAsset[];
  slides: PresentationSlide[];
};

export type ShareCoverSettings = {
  coverLabel: string;
  coverTitle: string;
  coverSubtitle: string;
  coverButtonText: string;
};
