"use client";

import Link from "next/link";
import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { type FormState } from "@/lib/validation";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  title: string;
  eyebrow: string;
  subtitle: string;
  action: (
    state: FormState | void,
    formData: FormData,
  ) => Promise<FormState | void>;
};

const initialState: FormState = {};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-sm text-rose-300">{errors[0]}</p>;
}

export function AuthForm({ mode, title, eyebrow, subtitle, action }: AuthFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <div className="grid min-h-screen bg-[#050816] text-white lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden border-r border-white/10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.35),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.2),transparent_35%)]" />
        <div className="relative p-10">
          <Link href="/" className="text-sm font-semibold tracking-[0.28em] text-violet-200 uppercase">
            MotionDeck
          </Link>
        </div>
        <div className="relative space-y-6 px-10 pb-16">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">{eyebrow}</p>
          <h1 className="max-w-xl text-5xl font-semibold leading-tight tracking-tight">
            Premium presentation motion for teams that pitch for real.
          </h1>
          <p className="max-w-lg text-lg leading-8 text-slate-300">
            Build agency-grade decks, edit motion in-browser, and share private links that feel client ready from the first click.
          </p>
          <div className="grid max-w-lg grid-cols-3 gap-4 text-sm text-slate-200">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">Premium starter templates</div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">Element-level animation control</div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">Protected share links</div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/6 p-8 shadow-[0_30px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-violet-200">{eyebrow}</p>
          <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">{subtitle}</p>

          <form action={formAction} className="mt-8 space-y-5">
            {mode === "sign-up" ? (
              <label className="block space-y-2">
                <span className="text-sm text-slate-300">Name</span>
                <input
                  name="name"
                  type="text"
                  placeholder="Satyam Sharma"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-500 focus:border-violet-400"
                />
                <FieldError errors={state?.fieldErrors?.name} />
              </label>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Email</span>
              <input
                name="email"
                type="email"
                placeholder="you@agency.com"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-500 focus:border-violet-400"
              />
              <FieldError errors={state?.fieldErrors?.email} />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Password</span>
              <input
                name="password"
                type="password"
                placeholder="At least 8 characters"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-500 focus:border-violet-400"
              />
              <FieldError errors={state?.fieldErrors?.password} />
            </label>

            {state?.message ? <p className="text-sm text-rose-300">{state.message}</p> : null}

            <SubmitButton className="w-full">
              {mode === "sign-up" ? "Create workspace" : "Sign in"}
            </SubmitButton>
          </form>

          <p className="mt-6 text-sm text-slate-400">
            {mode === "sign-up" ? "Already have an account?" : "Need an account?"}{" "}
            <Link
              href={mode === "sign-up" ? "/sign-in" : "/sign-up"}
              className="font-medium text-violet-200 hover:text-violet-100"
            >
              {mode === "sign-up" ? "Sign in" : "Start free"}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
