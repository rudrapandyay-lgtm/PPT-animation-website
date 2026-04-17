import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

export type ParsedPptxElement = {
  id: string;
  type: "TEXT" | "IMAGE" | "SHAPE";
  name: string;
  text?: string;
  src?: string;
  alt?: string;
  style?: Record<string, string | number>;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
};

type ParsedPptxSlide = {
  id: string;
  title: string;
  notes?: string;
  elements: ParsedPptxElement[];
};

export type ParsedPptxDeck = {
  name: string;
  slides: ParsedPptxSlide[];
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseTagValue: false,
  trimValues: false,
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function extractText(node: unknown): string[] {
  if (!node) {
    return [];
  }

  if (typeof node === "string") {
    const trimmed = node.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(node)) {
    return node.flatMap((item) => extractText(item));
  }

  if (typeof node === "object") {
    const record = node as Record<string, unknown>;
    const ownText = typeof record["a:t"] === "string" ? [String(record["a:t"]).trim()] : [];
    return [
      ...ownText,
      ...Object.values(record).flatMap((value) => extractText(value)),
    ].filter(Boolean);
  }

  return [];
}

function slidePathFromRelationship(target: string) {
  const normalized = target.replace(/^\.\.\//, "");
  return normalized.startsWith("ppt/") ? normalized : `ppt/${normalized}`;
}

function relationshipPathForSlide(slidePath: string) {
  const parsed = /^(.*)\/([^/]+)$/.exec(slidePath);
  if (!parsed) {
    return "";
  }

  return `${parsed[1]}/_rels/${parsed[2]}.rels`;
}

function resolveRelativePath(basePath: string, target: string) {
  const baseParts = basePath.split("/");
  baseParts.pop();

  for (const segment of target.split("/")) {
    if (!segment || segment === ".") {
      continue;
    }

    if (segment === "..") {
      baseParts.pop();
      continue;
    }

    baseParts.push(segment);
  }

  return baseParts.join("/");
}

function extensionToMime(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

async function fileToDataUrl(zip: JSZip, assetPath: string) {
  const file = zip.file(assetPath);
  if (!file) {
    return null;
  }

  const base64 = await file.async("base64");
  return `data:${extensionToMime(assetPath)};base64,${base64}`;
}

async function parseChartTitle(zip: JSZip, chartPath: string) {
  const chartXml = await zip.file(chartPath)?.async("string");
  if (!chartXml) {
    return null;
  }

  const chartDoc = xmlParser.parse(chartXml) as Record<string, unknown>;
  const chartRoot = chartDoc["c:chartSpace"] as Record<string, unknown> | undefined;
  const chart = chartRoot?.["c:chart"] as Record<string, unknown> | undefined;
  const titleText = extractText(chart?.["c:title"]).join(" ").replace(/\s+/g, " ").trim();
  const plotArea = chart?.["c:plotArea"] as Record<string, unknown> | undefined;
  const chartFamilies = [
    "c:barChart",
    "c:lineChart",
    "c:pieChart",
    "c:areaChart",
    "c:scatterChart",
    "c:doughnutChart",
  ];
  const seriesSummaries: string[] = [];

  for (const family of chartFamilies) {
    const familyNode = plotArea?.[family];
    for (const series of asArray(familyNode as Record<string, unknown> | Record<string, unknown>[] | undefined)) {
      const record = series as Record<string, unknown>;
      const seriesName = extractText(record["c:tx"]).join(" ").replace(/\s+/g, " ").trim();
      const categoryValues = extractText(record["c:cat"]);
      const pointValues = extractText(record["c:val"]);
      const summaryParts = [seriesName || "Series"];
      if (categoryValues.length) {
        summaryParts.push(`cats: ${categoryValues.slice(0, 4).join(", ")}`);
      }
      if (pointValues.length) {
        summaryParts.push(`vals: ${pointValues.slice(0, 4).join(", ")}`);
      }
      seriesSummaries.push(summaryParts.join(" | "));
    }
  }

  const summary = seriesSummaries.slice(0, 3).join("\n");
  return [titleText || "Chart", summary].filter(Boolean).join("\n");
}

function parseRgbColor(node: Record<string, unknown> | undefined) {
  const srgb = node?.["a:srgbClr"] as Record<string, unknown> | undefined;
  if (typeof srgb?.val === "string") {
    return `#${srgb.val}`;
  }

  const scheme = node?.["a:schemeClr"] as Record<string, unknown> | undefined;
  if (typeof scheme?.val === "string") {
    return scheme.val;
  }

  return undefined;
}

function parseShapeStyle(shape: Record<string, unknown>) {
  const spPr = (shape["p:spPr"] as Record<string, unknown> | undefined) ?? shape;
  const solidFill = parseRgbColor((spPr["a:solidFill"] as Record<string, unknown> | undefined));
  const line = (spPr["a:ln"] as Record<string, unknown> | undefined) ?? {};
  const lineColor = parseRgbColor((line["a:solidFill"] as Record<string, unknown> | undefined));
  const radiusNode = (spPr["a:prstGeom"] as Record<string, unknown> | undefined)?.prst;

  return Object.fromEntries(
    Object.entries({
    background: solidFill ? solidFill : undefined,
    border: lineColor ? `2px solid ${lineColor}` : undefined,
    borderRadius: typeof radiusNode === "string" && radiusNode.includes("Round") ? 24 : 12,
    }).filter(([, value]) => value !== undefined),
  ) as Record<string, string | number>;
}

function hasVisibleShapeStyle(shape: Record<string, unknown>) {
  const style = parseShapeStyle(shape);
  return Boolean(style.background || style.border);
}

async function parseSpeakerNotes(zip: JSZip, slidePath: string, relationships: Map<string, string>) {
  const notesRelation = [...relationships.entries()].find(([, target]) => target.includes("notesSlides/"));
  if (!notesRelation) {
    return undefined;
  }

  const notesXml = await zip.file(notesRelation[1])?.async("string");
  if (!notesXml) {
    return undefined;
  }

  const notesDoc = xmlParser.parse(notesXml) as Record<string, unknown>;
  const notesRoot = notesDoc["p:notes"] as Record<string, unknown> | undefined;
  const notesText = extractText(notesRoot).join(" ").replace(/\s+/g, " ").trim();
  return notesText || undefined;
}

function parsePosition(shape: Record<string, unknown>, slideWidth: number, slideHeight: number) {
  const xfrm =
    ((shape["p:spPr"] as Record<string, unknown> | undefined)?.["a:xfrm"] as
      | Record<string, unknown>
      | undefined) ??
    ((shape["p:xfrm"] as Record<string, unknown> | undefined) as Record<string, unknown> | undefined);
  const off = (xfrm?.["a:off"] as Record<string, unknown> | undefined) ?? {};
  const ext = (xfrm?.["a:ext"] as Record<string, unknown> | undefined) ?? {};

  const x = slideWidth ? (toNumber(off.x) / slideWidth) * 100 : 8;
  const y = slideHeight ? (toNumber(off.y) / slideHeight) * 100 : 10;
  const w = slideWidth ? (toNumber(ext.cx, slideWidth * 0.42) / slideWidth) * 100 : 40;
  const h = slideHeight ? (toNumber(ext.cy, slideHeight * 0.12) / slideHeight) * 100 : 12;

  return {
    x: Number(Math.min(Math.max(x, 0), 92).toFixed(2)),
    y: Number(Math.min(Math.max(y, 0), 94).toFixed(2)),
    w: Number(Math.min(Math.max(w, 8), 92).toFixed(2)),
    h: Number(Math.min(Math.max(h, 6), 80).toFixed(2)),
  };
}

export async function parsePptxBuffer(buffer: Buffer, fileName: string): Promise<ParsedPptxDeck> {
  const zip = await JSZip.loadAsync(buffer);
  const presentationXml = await zip.file("ppt/presentation.xml")?.async("string");
  const relationshipsXml = await zip.file("ppt/_rels/presentation.xml.rels")?.async("string");

  if (!presentationXml || !relationshipsXml) {
    throw new Error("Could not read PPTX structure.");
  }

  const presentationDoc = xmlParser.parse(presentationXml) as Record<string, unknown>;
  const relationshipsDoc = xmlParser.parse(relationshipsXml) as Record<string, unknown>;

  const presentation = presentationDoc["p:presentation"] as Record<string, unknown> | undefined;
  const slideSize = (presentation?.["p:sldSz"] as Record<string, unknown> | undefined) ?? {};
  const slideWidth = toNumber(slideSize.cx, 9144000);
  const slideHeight = toNumber(slideSize.cy, 5143500);

  const slideRefs = asArray(
    ((presentation?.["p:sldIdLst"] as Record<string, unknown> | undefined)?.["p:sldId"] as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | undefined),
  );

  const relationshipEntries = asArray(
    ((relationshipsDoc.Relationships as Record<string, unknown> | undefined)?.Relationship as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | undefined),
  );

  const relationshipMap = new Map<string, string>();
  for (const relationship of relationshipEntries) {
    if (typeof relationship.Id === "string" && typeof relationship.Target === "string") {
      relationshipMap.set(relationship.Id, slidePathFromRelationship(relationship.Target));
    }
  }

  const slides: ParsedPptxSlide[] = [];

  for (let slideIndex = 0; slideIndex < slideRefs.length; slideIndex += 1) {
    const relationshipId = String(slideRefs[slideIndex]?.["r:id"] ?? "");
    const slidePath = relationshipMap.get(relationshipId);

    if (!slidePath) {
      continue;
    }

    const slideXml = await zip.file(slidePath)?.async("string");

    if (!slideXml) {
      continue;
    }

    const slideRelsXml = await zip.file(relationshipPathForSlide(slidePath))?.async("string");
    const slideRelationshipEntries = slideRelsXml
      ? asArray(
          ((xmlParser.parse(slideRelsXml) as Record<string, unknown>).Relationships as
            | Record<string, unknown>
            | undefined)?.Relationship as
            | Record<string, unknown>
            | Record<string, unknown>[]
            | undefined,
        )
      : [];
    const slideRelationshipMap = new Map<string, string>();
    for (const relationship of slideRelationshipEntries) {
      if (typeof relationship.Id === "string" && typeof relationship.Target === "string") {
        slideRelationshipMap.set(
          relationship.Id,
          resolveRelativePath(slidePath, relationship.Target),
        );
      }
    }

    const slideDoc = xmlParser.parse(slideXml) as Record<string, unknown>;
    const slideRoot = slideDoc["p:sld"] as Record<string, unknown> | undefined;
    const shapeTree = (((slideRoot?.["p:cSld"] as Record<string, unknown> | undefined)?.["p:spTree"] as
      | Record<string, unknown>
      | undefined) ?? {}) as Record<string, unknown>;
    const shapes = asArray(shapeTree["p:sp"] as Record<string, unknown> | Record<string, unknown>[] | undefined);

    const elements: ParsedPptxElement[] = [];

    for (let shapeIndex = 0; shapeIndex < shapes.length; shapeIndex += 1) {
      const shape = shapes[shapeIndex];
      const textParts = extractText(shape["p:txBody"]).map((part) => part.trim()).filter(Boolean);
      const text = textParts.join(" ").replace(/\s+/g, " ").trim();

      if (!text) {
        continue;
      }

      const nvSpPr = (shape["p:nvSpPr"] as Record<string, unknown> | undefined)?.["p:cNvPr"] as
        | Record<string, unknown>
        | undefined;

      elements.push({
        id: `slide-${slideIndex + 1}-element-${shapeIndex + 1}`,
        type: "TEXT",
        name: typeof nvSpPr?.name === "string" ? nvSpPr.name : `Text ${shapeIndex + 1}`,
        text,
        style: parseShapeStyle(shape),
        position: parsePosition(shape, slideWidth, slideHeight),
      });
    }

    for (let shapeIndex = 0; shapeIndex < shapes.length; shapeIndex += 1) {
      const shape = shapes[shapeIndex];
      const textParts = extractText(shape["p:txBody"]).map((part) => part.trim()).filter(Boolean);

      if (textParts.length || !hasVisibleShapeStyle(shape)) {
        continue;
      }

      const nvSpPr = (shape["p:nvSpPr"] as Record<string, unknown> | undefined)?.["p:cNvPr"] as
        | Record<string, unknown>
        | undefined;
      elements.push({
        id: `slide-${slideIndex + 1}-shape-${shapeIndex + 1}`,
        type: "SHAPE",
        name: typeof nvSpPr?.name === "string" ? nvSpPr.name : `Shape ${shapeIndex + 1}`,
        text: typeof nvSpPr?.name === "string" ? nvSpPr.name : "Shape",
        style: parseShapeStyle(shape),
        position: parsePosition(shape, slideWidth, slideHeight),
      });
    }

    const pictures = asArray(
      shapeTree["p:pic"] as Record<string, unknown> | Record<string, unknown>[] | undefined,
    );
    for (let pictureIndex = 0; pictureIndex < pictures.length; pictureIndex += 1) {
      const picture = pictures[pictureIndex];
      const nvPicPr = (picture["p:nvPicPr"] as Record<string, unknown> | undefined)?.["p:cNvPr"] as
        | Record<string, unknown>
        | undefined;
      const embedId = (((picture["p:blipFill"] as Record<string, unknown> | undefined)?.["a:blip"] as
        | Record<string, unknown>
        | undefined)?.["r:embed"] ?? "") as string;
      const assetPath = slideRelationshipMap.get(embedId);
      const src = assetPath ? await fileToDataUrl(zip, assetPath) : null;
      if (!src) {
        continue;
      }

      elements.push({
        id: `slide-${slideIndex + 1}-image-${pictureIndex + 1}`,
        type: "IMAGE",
        name: typeof nvPicPr?.name === "string" ? nvPicPr.name : `Image ${pictureIndex + 1}`,
        src,
        alt: typeof nvPicPr?.descr === "string" ? nvPicPr.descr : typeof nvPicPr?.name === "string" ? nvPicPr.name : `Imported image ${pictureIndex + 1}`,
        style: { borderRadius: 20, boxShadow: "0 25px 60px rgba(2,6,23,0.35)" },
        position: parsePosition(picture, slideWidth, slideHeight),
      });
    }

    const graphicFrames = asArray(
      shapeTree["p:graphicFrame"] as Record<string, unknown> | Record<string, unknown>[] | undefined,
    );
    for (let frameIndex = 0; frameIndex < graphicFrames.length; frameIndex += 1) {
      const frame = graphicFrames[frameIndex];
      const chartId = (((((frame["a:graphic"] as Record<string, unknown> | undefined)?.["a:graphicData"] as
        | Record<string, unknown>
        | undefined)?.["c:chart"] as Record<string, unknown> | undefined)?.["r:id"] ?? "") as string);
      if (!chartId) {
        continue;
      }

      const chartPath = slideRelationshipMap.get(chartId);
      const label = chartPath ? await parseChartTitle(zip, chartPath) : null;

      elements.push({
        id: `slide-${slideIndex + 1}-chart-${frameIndex + 1}`,
        type: "SHAPE",
        name: `Chart ${frameIndex + 1}`,
        text: label ?? `Chart ${frameIndex + 1}`,
        style: {
          background: "rgba(15,23,42,0.88)",
          border: "1px solid rgba(148,163,184,0.24)",
          borderRadius: 24,
        },
        position: parsePosition(frame, slideWidth, slideHeight),
      });
    }

    const title = elements.find((element) => element.type === "TEXT" && element.text)?.text ?? `Slide ${slideIndex + 1}`;
    const notes = await parseSpeakerNotes(zip, slidePath, slideRelationshipMap);

    slides.push({
      id: `slide-${slideIndex + 1}`,
      title,
      notes,
      elements,
    });
  }

  if (!slides.length) {
    throw new Error("No readable slides were found in this PPTX.");
  }

  return {
    name: fileName.replace(/\.pptx$/i, ""),
    slides,
  };
}
