"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { type FormState } from "@/lib/validation";

const initialState: FormState = {};

export function SharePasscodeForm({
  token,
  action,
}: {
  token: string;
  action: (
    state: FormState | void,
    formData: FormData,
  ) => Promise<FormState | void>;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input type="hidden" name="token" value={token} />
      <label className="block space-y-2">
        <span className="text-sm text-slate-300">Viewer passcode</span>
        <input
          name="passcode"
          type="password"
          placeholder="Enter access code"
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-300"
        />
      </label>
      {state?.message ? <p className="text-sm text-rose-300">{state.message}</p> : null}
      <SubmitButton className="w-full bg-amber-300 text-slate-950 hover:bg-amber-200">
        Unlock presentation
      </SubmitButton>
    </form>
  );
}
