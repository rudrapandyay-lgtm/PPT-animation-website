"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

type ImportDeckCardProps = {
  recentImports: Array<{
    id: string;
    sourceFilename: string;
    sourceMimeType: string;
    status: string;
    createdAt: string;
    presentationId?: string;
    notes?: string | null;
  }>;
};

export function ImportDeckCard({ recentImports }: ImportDeckCardProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setMessage(null);

    const response = await fetch("/api/imports", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string; error?: string; presentationId?: string }
      | null;

    if (!response.ok) {
      setMessage(payload?.error ?? "Could not upload file.");
      return;
    }

    if (payload?.presentationId) {
      window.location.href = `/editor/${payload.presentationId}`;
      return;
    }

    setMessage(payload?.message ?? "Import uploaded.");
    window.location.reload();
  }

  return (
    <section className="mt-10 rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Import groundwork</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Upload a PPTX or PDF to import into MotionDeck.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            PPTX files import slide text and layout blocks. PDFs import page text into editable slides so you can keep refining the deck in the editor.
          </p>
        </div>
      </div>

      <form
        action={(formData) => startTransition(() => void handleSubmit(formData))}
        className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end"
      >
        <label className="block space-y-2">
          <span className="text-sm text-slate-300">Presentation file</span>
          <input
            name="file"
            type="file"
            accept=".pptx,.pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/pdf"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
            required
          />
        </label>

        <button
          type="submit"
          className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-200 disabled:opacity-40"
          disabled={isPending}
        >
          {isPending ? "Uploading..." : "Queue import"}
        </button>
      </form>

      {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}

      <div className="mt-6 space-y-3">
        {recentImports.length ? (
          recentImports.map((job) => (
            <div
              key={job.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/10 bg-slate-950/45 px-4 py-4"
            >
              <div>
                <p className="text-sm font-medium text-slate-100">{job.sourceFilename}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{job.sourceMimeType}</p>
                {job.notes ? <p className="mt-2 text-sm text-slate-400">{job.notes}</p> : null}
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-violet-200">{job.status}</p>
                <p className="mt-1 text-sm text-slate-400">{job.createdAt}</p>
                {job.presentationId ? (
                  <Link
                    href={`/editor/${job.presentationId}`}
                    className="mt-3 inline-flex rounded-full border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                  >
                    Open import
                  </Link>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/45 px-4 py-6 text-sm text-slate-400">
            No import jobs yet.
          </div>
        )}
      </div>
    </section>
  );
}
