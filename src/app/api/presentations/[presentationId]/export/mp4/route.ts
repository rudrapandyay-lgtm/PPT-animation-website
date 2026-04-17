import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import ffmpegPath from "ffmpeg-static";
import { chromium } from "playwright";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { renderPresentationHtml } from "@/lib/export/presentation-html";
import { getPresentationForEditor, toPresentationDocument } from "@/lib/presentation";

const execFileAsync = promisify(execFile);

export async function GET(
  _request: Request,
  context: RouteContext<"/api/presentations/[presentationId]/export/mp4">,
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { presentationId } = await context.params;
  const presentation = await getPresentationForEditor(presentationId, user.id);

  if (!presentation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!ffmpegPath) {
    return NextResponse.json({ error: "Bundled ffmpeg binary not available." }, { status: 500 });
  }

  const document = toPresentationDocument(presentation);
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "motiondeck-export-"));
  const concatPath = path.join(tempDir, "frames.txt");
  const outputPath = path.join(tempDir, "presentation.mp4");
  const slideDurationSeconds = 3;

  try {
    const browser = await chromium.launch({ headless: true });

    try {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
      });

      await page.setContent(renderPresentationHtml(document, { showToolbar: false, exportMode: true }), {
        waitUntil: "load",
      });
      await page.waitForTimeout(150);

      const framePaths: string[] = [];

      for (let slideIndex = 0; slideIndex < document.slides.length; slideIndex += 1) {
        const framePath = path.join(tempDir, `slide-${slideIndex + 1}.png`);
        await page.evaluate((index) => {
          const api = window as typeof window & { __setSlide?: (value: number) => void };
          api.__setSlide?.(index);
        }, slideIndex);
        await page.waitForTimeout(120);
        await page.screenshot({ path: framePath, clip: { x: 0, y: 0, width: 1280, height: 720 } });
        framePaths.push(framePath);
      }

      const concatFile = framePaths
        .map((framePath) => `file '${framePath.replace(/\\/g, "/")}'\nduration ${slideDurationSeconds}`)
        .concat(framePaths.length ? [`file '${framePaths[framePaths.length - 1].replace(/\\/g, "/")}'`] : [])
        .join("\n");

      await writeFile(concatPath, concatFile, "utf8");
    } finally {
      await browser.close();
    }

    await execFileAsync(ffmpegPath, [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatPath,
      "-vf",
      "fps=30,format=yuv420p",
      "-pix_fmt",
      "yuv420p",
      outputPath,
    ]);

    const buffer = await readFile(outputPath);
    const fileName = `${document.name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "presentation"}.mp4`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "MP4 export failed.",
      },
      { status: 500 },
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
