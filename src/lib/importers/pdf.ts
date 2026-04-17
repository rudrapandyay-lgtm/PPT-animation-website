import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import { type ParsedPptxDeck, type ParsedPptxElement } from "@/lib/importers/pptx";

type PdfTextItem = {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function groupTextItems(items: PdfTextItem[]) {
  const rows = new Map<number, PdfTextItem[]>();

  for (const item of items) {
    const text = item.str?.trim();

    if (!text || !item.transform) {
      continue;
    }

    const rowKey = Math.round(item.transform[5] / 16) * 16;
    const row = rows.get(rowKey) ?? [];
    row.push(item);
    rows.set(rowKey, row);
  }

  return [...rows.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, row]) => row.sort((a, b) => (a.transform?.[4] ?? 0) - (b.transform?.[4] ?? 0)));
}

export async function parsePdfBuffer(buffer: Buffer, fileName: string): Promise<ParsedPptxDeck> {
  const document = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const slides: ParsedPptxDeck["slides"] = [];

  for (let pageIndex = 1; pageIndex <= document.numPages; pageIndex += 1) {
    const page = await document.getPage(pageIndex);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    const rows = groupTextItems(textContent.items as PdfTextItem[]);

    const elements = rows
      .map<ParsedPptxElement>((row, rowIndex) => {
        const first = row[0];
        const x = ((first.transform?.[4] ?? 50) / viewport.width) * 100;
        const y = 100 - (((first.transform?.[5] ?? viewport.height - 40) / viewport.height) * 100) - 4;
        const text = row.map((item) => item.str?.trim()).filter(Boolean).join(" ");
        const fontHeight = first.height ?? 18;
        const height = clamp((fontHeight / viewport.height) * 100 + 3, 6, 16);

        return {
          id: `page-${pageIndex}-row-${rowIndex + 1}`,
          type: "TEXT",
          name: rowIndex === 0 ? "Title" : `Text ${rowIndex}`,
          text,
          position: {
            x: Number(clamp(x, 6, 84).toFixed(2)),
            y: Number(clamp(y, 8, 88).toFixed(2)),
            w: 82,
            h: Number(height.toFixed(2)),
          },
        };
      })
      .filter((element) => (element.text ?? "").trim().length > 0);

    slides.push({
      id: `page-${pageIndex}`,
      title: elements[0]?.text ?? `Page ${pageIndex}`,
      notes: undefined,
      elements,
    });
  }

  if (!slides.length) {
    throw new Error("No readable pages were found in this PDF.");
  }

  return {
    name: fileName.replace(/\.pdf$/i, ""),
    slides,
  };
}
