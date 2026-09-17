"use client";

import { Loader2, Lock } from "lucide-react";
import { useActionState } from "react";
import { login } from "@/app/admin/actions";
import { cn } from "@/lib/cn";
import { focusRing, pressable, surface } from "@/lib/styles";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, null);

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <form action={formAction} className={cn(surface, "w-full max-w-sm p-6")}>
        <span className="grid size-11 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400">
          <Lock aria-hidden className="size-5" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-100">Admin</h1>
        <p className="mt-1 text-sm text-zinc-400">Enter the password to edit the website.</p>

        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          placeholder="Password"
          className="mt-5 min-h-[48px] w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/60 focus:outline-none"
        />

        {error ? (
          <p role="alert" className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className={cn(
            "mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-sm font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50",
            pressable,
            focusRing,
          )}
        >
          {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
          Sign in
        </button>
      </form>
    </main>
  );
}
