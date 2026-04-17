export type TemplateElement = {
  id: string;
  type: "TEXT" | "IMAGE" | "SHAPE";
  name: string;
  content: Record<string, string | number>;
  position: Record<string, number>;
  style: Record<string, string | number>;
  animation: {
    preset: "FADE_IN" | "SLIDE_UP" | "SLIDE_LEFT" | "ZOOM_IN" | "STAGGER";
    durationMs: number;
    delayMs: number;
  };
};

export type TemplateSlide = {
  id: string;
  title: string;
  background: Record<string, string | number>;
  transition: Record<string, string | number>;
  elements: TemplateElement[];
};

export type PresentationTemplate = {
  key: string;
  name: string;
  audience: string;
  description: string;
  accent: string;
  slides: TemplateSlide[];
};

function textElement(
  id: string,
  name: string,
  text: string,
  position: Record<string, number>,
  style: Record<string, string | number>,
  animation: TemplateElement["animation"],
): TemplateElement {
  return {
    id,
    type: "TEXT",
    name,
    content: { text },
    position,
    style,
    animation,
  };
}

function imageElement(
  id: string,
  name: string,
  src: string,
  position: Record<string, number>,
  style: Record<string, string | number>,
  animation: TemplateElement["animation"],
): TemplateElement {
  return {
    id,
    type: "IMAGE",
    name,
    content: { src, alt: name },
    position,
    style,
    animation,
  };
}

function shapeElement(
  id: string,
  name: string,
  label: string,
  position: Record<string, number>,
  style: Record<string, string | number>,
  animation: TemplateElement["animation"],
): TemplateElement {
  return {
    id,
    type: "SHAPE",
    name,
    content: { label },
    position,
    style,
    animation,
  };
}

const baseText = { color: "#f8fafc", letterSpacing: -0.02 };

export const presentationTemplates: PresentationTemplate[] = [
  {
    key: "agency-pitch",
    name: "Agency Pitch",
    audience: "Creative and strategy teams",
    description: "A cinematic deck for pitching retainers, launches, and campaigns.",
    accent: "#8b5cf6",
    slides: [
      {
        id: "agency-1",
        title: "Cover",
        background: { base: "#09090f", gradientFrom: "#191127", gradientTo: "#0f172a" },
        transition: { type: "fade", durationMs: 700 },
        elements: [
          shapeElement("agency-1-shape", "Accent glow", "", { x: 62, y: 8, w: 26, h: 60 }, { background: "linear-gradient(180deg, rgba(139,92,246,0.65), rgba(15,23,42,0))", borderRadius: 28, blur: 0 }, { preset: "FADE_IN", durationMs: 900, delayMs: 0 }),
          textElement("agency-1-kicker", "Kicker", "MOTIONDECK STUDIO", { x: 8, y: 11, w: 26, h: 6 }, { ...baseText, color: "#c4b5fd", fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2 }, { preset: "SLIDE_UP", durationMs: 700, delayMs: 80 }),
          textElement("agency-1-title", "Title", "Turn static pitches into client-ready motion.", { x: 8, y: 22, w: 48, h: 24 }, { ...baseText, fontSize: 48, fontWeight: 700, lineHeight: 1.05 }, { preset: "SLIDE_UP", durationMs: 800, delayMs: 140 }),
          textElement("agency-1-copy", "Copy", "A premium presentation system for teams that need faster approvals, sharper storytelling, and a more polished room presence.", { x: 8, y: 52, w: 44, h: 14 }, { color: "#cbd5e1", fontSize: 18, lineHeight: 1.5 }, { preset: "FADE_IN", durationMs: 800, delayMs: 240 }),
          shapeElement("agency-1-pill", "Pill", "Strategy / Creative / Delivery", { x: 8, y: 74, w: 27, h: 8 }, { background: "rgba(15,23,42,0.9)", border: "1px solid rgba(196,181,253,0.35)", borderRadius: 999, color: "#e2e8f0", fontSize: 14, fontWeight: 500 }, { preset: "ZOOM_IN", durationMs: 700, delayMs: 300 }),
          imageElement("agency-1-image", "Hero visual", "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80", { x: 60, y: 18, w: 32, h: 58 }, { borderRadius: 28, boxShadow: "0 32px 80px rgba(15,23,42,0.45)" }, { preset: "SLIDE_LEFT", durationMs: 950, delayMs: 160 }),
        ],
      },
      {
        id: "agency-2",
        title: "Problem",
        background: { base: "#020617", gradientFrom: "#0f172a", gradientTo: "#111827" },
        transition: { type: "slide", durationMs: 700 },
        elements: [
          textElement("agency-2-title", "Title", "Why premium teams outgrow static slides", { x: 8, y: 14, w: 48, h: 12 }, { ...baseText, fontSize: 40, fontWeight: 700 }, { preset: "SLIDE_UP", durationMs: 700, delayMs: 40 }),
          textElement("agency-2-b1", "Bullet 1", "Static decks flatten narrative momentum in the room.", { x: 8, y: 34, w: 42, h: 8 }, { color: "#e2e8f0", fontSize: 18, lineHeight: 1.4 }, { preset: "STAGGER", durationMs: 700, delayMs: 120 }),
          textElement("agency-2-b2", "Bullet 2", "Hand-animating client decks burns hours on production, not strategy.", { x: 8, y: 46, w: 42, h: 8 }, { color: "#e2e8f0", fontSize: 18, lineHeight: 1.4 }, { preset: "STAGGER", durationMs: 700, delayMs: 220 }),
          textElement("agency-2-b3", "Bullet 3", "Brand consistency slips when every pitch starts from a blank file.", { x: 8, y: 58, w: 42, h: 8 }, { color: "#e2e8f0", fontSize: 18, lineHeight: 1.4 }, { preset: "STAGGER", durationMs: 700, delayMs: 320 }),
          shapeElement("agency-2-metric", "Metric", "3x faster deck production", { x: 62, y: 24, w: 24, h: 22 }, { background: "rgba(15,23,42,0.88)", border: "1px solid rgba(129,140,248,0.35)", borderRadius: 24, color: "#f8fafc", fontSize: 28, fontWeight: 700 }, { preset: "ZOOM_IN", durationMs: 750, delayMs: 180 }),
          shapeElement("agency-2-proof", "Proof", "Agency-grade starter systems", { x: 58, y: 53, w: 30, h: 12 }, { background: "rgba(168,85,247,0.14)", border: "1px solid rgba(216,180,254,0.25)", borderRadius: 22, color: "#ddd6fe", fontSize: 18, fontWeight: 600 }, { preset: "FADE_IN", durationMs: 800, delayMs: 280 }),
        ],
      },
      {
        id: "agency-3",
        title: "Process",
        background: { base: "#050816", gradientFrom: "#111827", gradientTo: "#1e1b4b" },
        transition: { type: "fade", durationMs: 700 },
        elements: [
          textElement("agency-3-title", "Title", "A tighter pitch workflow", { x: 8, y: 14, w: 40, h: 12 }, { ...baseText, fontSize: 40, fontWeight: 700 }, { preset: "SLIDE_UP", durationMs: 700, delayMs: 0 }),
          shapeElement("agency-3-step1", "Step 1", "01 Import or start from template", { x: 8, y: 34, w: 28, h: 18 }, { background: "rgba(15,23,42,0.9)", borderRadius: 24, border: "1px solid rgba(129,140,248,0.25)", color: "#e2e8f0", fontSize: 20, fontWeight: 600 }, { preset: "STAGGER", durationMs: 700, delayMs: 120 }),
          shapeElement("agency-3-step2", "Step 2", "02 Refine pacing and emphasis", { x: 38, y: 44, w: 28, h: 18 }, { background: "rgba(15,23,42,0.9)", borderRadius: 24, border: "1px solid rgba(129,140,248,0.25)", color: "#e2e8f0", fontSize: 20, fontWeight: 600 }, { preset: "STAGGER", durationMs: 700, delayMs: 220 }),
          shapeElement("agency-3-step3", "Step 3", "03 Share a hosted client-ready deck", { x: 68, y: 54, w: 24, h: 18 }, { background: "rgba(15,23,42,0.9)", borderRadius: 24, border: "1px solid rgba(129,140,248,0.25)", color: "#e2e8f0", fontSize: 18, fontWeight: 600 }, { preset: "STAGGER", durationMs: 700, delayMs: 320 }),
        ],
      },
      {
        id: "agency-4",
        title: "Results",
        background: { base: "#070b1a", gradientFrom: "#0f172a", gradientTo: "#312e81" },
        transition: { type: "fade", durationMs: 700 },
        elements: [
          textElement("agency-4-title", "Title", "Results clients notice", { x: 8, y: 14, w: 40, h: 10 }, { ...baseText, fontSize: 40, fontWeight: 700 }, { preset: "SLIDE_UP", durationMs: 700, delayMs: 50 }),
          shapeElement("agency-4-card1", "Card 1", "+34% stronger close rate", { x: 8, y: 34, w: 24, h: 22 }, { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 28, color: "#f8fafc", fontSize: 26, fontWeight: 700 }, { preset: "FADE_IN", durationMs: 700, delayMs: 150 }),
          shapeElement("agency-4-card2", "Card 2", "2.4h saved per deck", { x: 36, y: 42, w: 24, h: 22 }, { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 28, color: "#f8fafc", fontSize: 26, fontWeight: 700 }, { preset: "FADE_IN", durationMs: 700, delayMs: 250 }),
          shapeElement("agency-4-card3", "Card 3", "One motion system across every pitch", { x: 64, y: 50, w: 24, h: 22 }, { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 28, color: "#f8fafc", fontSize: 22, fontWeight: 700 }, { preset: "FADE_IN", durationMs: 700, delayMs: 350 }),
        ],
      },
      {
        id: "agency-5",
        title: "Closing",
        background: { base: "#09090f", gradientFrom: "#111827", gradientTo: "#0f172a" },
        transition: { type: "fade", durationMs: 700 },
        elements: [
          textElement("agency-5-title", "Title", "Ready to pitch in motion?", { x: 8, y: 26, w: 52, h: 14 }, { ...baseText, fontSize: 48, fontWeight: 700, lineHeight: 1.05 }, { preset: "SLIDE_UP", durationMs: 700, delayMs: 80 }),
          textElement("agency-5-copy", "Copy", "Build the next client deck in MotionDeck, share a protected link, and walk into the room already looking sharper.", { x: 8, y: 48, w: 44, h: 12 }, { color: "#cbd5e1", fontSize: 18, lineHeight: 1.5 }, { preset: "FADE_IN", durationMs: 750, delayMs: 180 }),
          shapeElement("agency-5-button", "Button", "hello@motiondeck.studio", { x: 8, y: 68, w: 24, h: 8 }, { background: "#8b5cf6", borderRadius: 999, color: "#ffffff", fontSize: 16, fontWeight: 700 }, { preset: "ZOOM_IN", durationMs: 700, delayMs: 260 }),
        ],
      },
    ],
  },
  {
    key: "sales-deck",
    name: "Sales Deck",
    audience: "Revenue and solution teams",
    description: "Sharp, metric-led slides for outbound pitches and enterprise demos.",
    accent: "#0ea5e9",
    slides: [
      {
        id: "sales-1",
        title: "Cover",
        background: { base: "#03111d", gradientFrom: "#082f49", gradientTo: "#020617" },
        transition: { type: "fade", durationMs: 700 },
        elements: [
          textElement("sales-1-title", "Title", "Shorten time-to-yes with a sharper commercial story.", { x: 8, y: 22, w: 52, h: 20 }, { ...baseText, fontSize: 46, fontWeight: 700, lineHeight: 1.08 }, { preset: "SLIDE_UP", durationMs: 700, delayMs: 100 }),
          textElement("sales-1-copy", "Copy", "A premium sales narrative for buyers who need clarity, confidence, and proof quickly.", { x: 8, y: 50, w: 40, h: 12 }, { color: "#bfdbfe", fontSize: 18, lineHeight: 1.5 }, { preset: "FADE_IN", durationMs: 800, delayMs: 220 }),
          shapeElement("sales-1-chip", "Chip", "Pipeline acceleration system", { x: 8, y: 68, w: 24, h: 8 }, { background: "rgba(14,165,233,0.18)", borderRadius: 999, color: "#e0f2fe", fontSize: 15, fontWeight: 600, border: "1px solid rgba(125,211,252,0.24)" }, { preset: "ZOOM_IN", durationMs: 700, delayMs: 300 }),
          shapeElement("sales-1-panel", "Panel", "86% stakeholder alignment", { x: 63, y: 20, w: 22, h: 26 }, { background: "rgba(255,255,255,0.06)", borderRadius: 24, color: "#f8fafc", fontSize: 24, fontWeight: 700 }, { preset: "SLIDE_LEFT", durationMs: 900, delayMs: 160 }),
          shapeElement("sales-1-panel2", "Panel 2", "14-day onboarding", { x: 56, y: 52, w: 30, h: 16 }, { background: "rgba(255,255,255,0.06)", borderRadius: 24, color: "#e0f2fe", fontSize: 22, fontWeight: 700 }, { preset: "SLIDE_LEFT", durationMs: 950, delayMs: 240 }),
        ],
      },
      {
        id: "sales-2",
        title: "Problem",
        background: { base: "#04111c", gradientFrom: "#082f49", gradientTo: "#111827" },
        transition: { type: "slide", durationMs: 700 },
        elements: [
          textElement("sales-2-title", "Title", "The gap between product confidence and buyer clarity", { x: 8, y: 14, w: 44, h: 12 }, { ...baseText, fontSize: 40, fontWeight: 700 }, { preset: "SLIDE_UP", durationMs: 700, delayMs: 0 }),
          textElement("sales-2-b1", "Bullet 1", "Too much product detail, not enough commercial framing.", { x: 8, y: 36, w: 44, h: 8 }, { color: "#e0f2fe", fontSize: 18 }, { preset: "STAGGER", durationMs: 700, delayMs: 120 }),
          textElement("sales-2-b2", "Bullet 2", "Decision-makers lose the value thread across long decks.", { x: 8, y: 48, w: 44, h: 8 }, { color: "#e0f2fe", fontSize: 18 }, { preset: "STAGGER", durationMs: 700, delayMs: 220 }),
          textElement("sales-2-b3", "Bullet 3", "Reps rebuild the same story every quarter.", { x: 8, y: 60, w: 44, h: 8 }, { color: "#e0f2fe", fontSize: 18 }, { preset: "STAGGER", durationMs: 700, delayMs: 320 }),
        ],
      },
      {
        id: "sales-3",
        title: "Offer",
        background: { base: "#020617", gradientFrom: "#0f172a", gradientTo: "#082f49" },
        transition: { type: "fade", durationMs: 700 },
        elements: [
          textElement("sales-3-title", "Title", "What buyers get", { x: 8, y: 14, w: 28, h: 12 }, { ...baseText, fontSize: 40, fontWeight: 700 }, { preset: "SLIDE_UP", durationMs: 700, delayMs: 60 }),
          shapeElement("sales-3-card1", "Card 1", "Commercial story", { x: 8, y: 38, w: 24, h: 18 }, { background: "rgba(15,23,42,0.9)", borderRadius: 24, border: "1px solid rgba(125,211,252,0.2)", color: "#f8fafc", fontSize: 24, fontWeight: 700 }, { preset: "FADE_IN", durationMs: 700, delayMs: 140 }),
          shapeElement("sales-3-card2", "Card 2", "Proof points", { x: 36, y: 46, w: 24, h: 18 }, { background: "rgba(15,23,42,0.9)", borderRadius: 24, border: "1px solid rgba(125,211,252,0.2)", color: "#f8fafc", fontSize: 24, fontWeight: 700 }, { preset: "FADE_IN", durationMs: 700, delayMs: 240 }),
          shapeElement("sales-3-card3", "Card 3", "Clear next step", { x: 64, y: 54, w: 24, h: 18 }, { background: "rgba(15,23,42,0.9)", borderRadius: 24, border: "1px solid rgba(125,211,252,0.2)", color: "#f8fafc", fontSize: 24, fontWeight: 700 }, { preset: "FADE_IN", durationMs: 700, delayMs: 340 }),
        ],
      },
      {
        id: "sales-4",
        title: "Impact",
        background: { base: "#020617", gradientFrom: "#082f49", gradientTo: "#0f172a" },
        transition: { type: "fade", durationMs: 700 },
        elements: [
          textElement("sales-4-title", "Title", "Impact in the pipeline", { x: 8, y: 14, w: 30, h: 12 }, { ...baseText, fontSize: 40, fontWeight: 700 }, { preset: "SLIDE_UP", durationMs: 700, delayMs: 0 }),
          shapeElement("sales-4-big", "Big metric", "+18% win rate", { x: 8, y: 38, w: 32, h: 28 }, { background: "rgba(14,165,233,0.14)", border: "1px solid rgba(125,211,252,0.25)", borderRadius: 28, color: "#f8fafc", fontSize: 36, fontWeight: 700 }, { preset: "ZOOM_IN", durationMs: 760, delayMs: 140 }),
          textElement("sales-4-copy", "Copy", "Designed for executive buyers who need proof, pace, and a clear next decision in under 15 minutes.", { x: 48, y: 40, w: 34, h: 16 }, { color: "#e0f2fe", fontSize: 20, lineHeight: 1.5 }, { preset: "FADE_IN", durationMs: 700, delayMs: 220 }),
        ],
      },
      {
        id: "sales-5",
        title: "Closing",
        background: { base: "#030712", gradientFrom: "#082f49", gradientTo: "#0f172a" },
        transition: { type: "fade", durationMs: 700 },
        elements: [
          textElement("sales-5-title", "Title", "Move the deal forward with a cleaner story.", { x: 8, y: 26, w: 46, h: 16 }, { ...baseText, fontSize: 46, fontWeight: 700, lineHeight: 1.08 }, { preset: "SLIDE_UP", durationMs: 700, delayMs: 80 }),
          shapeElement("sales-5-chip", "Chip", "Book stakeholder walkthrough", { x: 8, y: 62, w: 24, h: 8 }, { background: "#0ea5e9", borderRadius: 999, color: "#ffffff", fontSize: 16, fontWeight: 700 }, { preset: "ZOOM_IN", durationMs: 700, delayMs: 220 }),
        ],
      },
    ],
  },
  {
    key: "strategy-proposal",
    name: "Strategy Proposal",
    audience: "Consultancies and transformation teams",
    description: "A sober, high-trust format for proposals, roadmaps, and executive recommendations.",
    accent: "#f59e0b",
    slides: [
      {
        id: "strategy-1",
        title: "Cover",
        background: { base: "#120d08", gradientFrom: "#292524", gradientTo: "#111827" },
        transition: { type: "fade", durationMs: 700 },
        elements: [
          textElement("strategy-1-title", "Title", "A premium proposal format for complex decisions.", { x: 8, y: 24, w: 50, h: 18 }, { ...baseText, fontSize: 46, fontWeight: 700, lineHeight: 1.08 }, { preset: "SLIDE_UP", durationMs: 700, delayMs: 80 }),
          textElement("strategy-1-copy", "Copy", "Built for board-ready recommendations, sharper sequencing, and more confident buy-in.", { x: 8, y: 50, w: 40, h: 12 }, { color: "#fde68a", fontSize: 18, lineHeight: 1.5 }, { preset: "FADE_IN", durationMs: 800, delayMs: 200 }),
          shapeElement("strategy-1-chip", "Chip", "Proposal / Roadmap / Executive Summary", { x: 8, y: 68, w: 32, h: 8 }, { background: "rgba(245,158,11,0.16)", border: "1px solid rgba(251,191,36,0.28)", borderRadius: 999, color: "#fef3c7", fontSize: 15, fontWeight: 600 }, { preset: "ZOOM_IN", durationMs: 700, delayMs: 300 }),
        ],
      },
      {
        id: "strategy-2",
        title: "Context",
        background: { base: "#111827", gradientFrom: "#1f2937", gradientTo: "#120d08" },
        transition: { type: "slide", durationMs: 700 },
        elements: [
          textElement("strategy-2-title", "Title", "Context for the recommendation", { x: 8, y: 14, w: 42, h: 12 }, { ...baseText, fontSize: 40, fontWeight: 700 }, { preset: "SLIDE_UP", durationMs: 700, delayMs: 0 }),
          textElement("strategy-2-b1", "Bullet 1", "Fragmented initiatives have diluted operating focus.", { x: 8, y: 36, w: 42, h: 8 }, { color: "#f8fafc", fontSize: 18 }, { preset: "STAGGER", durationMs: 700, delayMs: 120 }),
          textElement("strategy-2-b2", "Bullet 2", "Leadership needs a phased plan with visible milestones.", { x: 8, y: 48, w: 42, h: 8 }, { color: "#f8fafc", fontSize: 18 }, { preset: "STAGGER", durationMs: 700, delayMs: 220 }),
          textElement("strategy-2-b3", "Bullet 3", "Stakeholder alignment depends on clearer sequencing and ownership.", { x: 8, y: 60, w: 42, h: 8 }, { color: "#f8fafc", fontSize: 18 }, { preset: "STAGGER", durationMs: 700, delayMs: 320 }),
        ],
      },
      {
        id: "strategy-3",
        title: "Recommendation",
        background: { base: "#111827", gradientFrom: "#120d08", gradientTo: "#1f2937" },
        transition: { type: "fade", durationMs: 700 },
        elements: [
          textElement("strategy-3-title", "Title", "Recommended program", { x: 8, y: 14, w: 32, h: 10 }, { ...baseText, fontSize: 40, fontWeight: 700 }, { preset: "SLIDE_UP", durationMs: 700, delayMs: 0 }),
          shapeElement("strategy-3-card1", "Card 1", "1 Diagnose", { x: 8, y: 38, w: 24, h: 18 }, { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: 24, color: "#fef3c7", fontSize: 28, fontWeight: 700 }, { preset: "FADE_IN", durationMs: 700, delayMs: 140 }),
          shapeElement("strategy-3-card2", "Card 2", "2 Align", { x: 36, y: 46, w: 24, h: 18 }, { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: 24, color: "#fef3c7", fontSize: 28, fontWeight: 700 }, { preset: "FADE_IN", durationMs: 700, delayMs: 240 }),
          shapeElement("strategy-3-card3", "Card 3", "3 Execute", { x: 64, y: 54, w: 24, h: 18 }, { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: 24, color: "#fef3c7", fontSize: 28, fontWeight: 700 }, { preset: "FADE_IN", durationMs: 700, delayMs: 340 }),
        ],
      },
      {
        id: "strategy-4",
        title: "Roadmap",
        background: { base: "#0f172a", gradientFrom: "#1f2937", gradientTo: "#120d08" },
        transition: { type: "fade", durationMs: 700 },
        elements: [
          textElement("strategy-4-title", "Title", "90-day roadmap", { x: 8, y: 14, w: 26, h: 10 }, { ...baseText, fontSize: 40, fontWeight: 700 }, { preset: "SLIDE_UP", durationMs: 700, delayMs: 0 }),
          shapeElement("strategy-4-step1", "Step 1", "Weeks 1-3\nAssessment and baseline", { x: 8, y: 40, w: 24, h: 18 }, { background: "rgba(255,255,255,0.04)", borderRadius: 24, color: "#f8fafc", fontSize: 20, fontWeight: 600 }, { preset: "STAGGER", durationMs: 700, delayMs: 120 }),
          shapeElement("strategy-4-step2", "Step 2", "Weeks 4-8\nDesign and approvals", { x: 36, y: 48, w: 24, h: 18 }, { background: "rgba(255,255,255,0.04)", borderRadius: 24, color: "#f8fafc", fontSize: 20, fontWeight: 600 }, { preset: "STAGGER", durationMs: 700, delayMs: 220 }),
          shapeElement("strategy-4-step3", "Step 3", "Weeks 9-12\nImplementation sprint", { x: 64, y: 56, w: 24, h: 18 }, { background: "rgba(255,255,255,0.04)", borderRadius: 24, color: "#f8fafc", fontSize: 20, fontWeight: 600 }, { preset: "STAGGER", durationMs: 700, delayMs: 320 }),
        ],
      },
      {
        id: "strategy-5",
        title: "Closing",
        background: { base: "#120d08", gradientFrom: "#1f2937", gradientTo: "#0f172a" },
        transition: { type: "fade", durationMs: 700 },
        elements: [
          textElement("strategy-5-title", "Title", "Designed for serious decisions.", { x: 8, y: 28, w: 42, h: 14 }, { ...baseText, fontSize: 46, fontWeight: 700 }, { preset: "SLIDE_UP", durationMs: 700, delayMs: 60 }),
          shapeElement("strategy-5-chip", "Chip", "Next step: executive workshop", { x: 8, y: 64, w: 26, h: 8 }, { background: "#f59e0b", borderRadius: 999, color: "#111827", fontSize: 16, fontWeight: 700 }, { preset: "ZOOM_IN", durationMs: 700, delayMs: 220 }),
        ],
      },
    ],
  },
];

export function getTemplateByKey(key: string) {
  return presentationTemplates.find((template) => template.key === key);
}
