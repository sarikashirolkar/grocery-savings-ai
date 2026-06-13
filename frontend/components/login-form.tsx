"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { login } from "@/lib/api";


type FormValues = {
  email: string;
  password: string;
};


export function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      email: "demo@grocerysavings.ai",
      password: "Demo@12345"
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values.email, values.password);
      onLoggedIn();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed");
    }
  });

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[1.08fr_0.92fr]">
      <section className="flex flex-col justify-between bg-taupe px-8 py-10 text-card md:px-14 md:py-14">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-card">
            <div className="h-3 w-3 rounded-[3px] bg-rose" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl font-semibold">Grocery Savings</span>
            <span className="rounded-sm border border-blush/40 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.16em] text-blush">AI</span>
          </div>
        </div>
        <div className="py-12">
          <p className="eyebrow text-blush">Primary workflow</p>
          <h1 className="mt-4 max-w-xl font-serif text-5xl font-medium leading-tight tracking-[-0.03em] md:text-6xl">
            Find the best price for your groceries!
          </h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-card/75">
            Use the seeded workspace to explore receipt-driven predictions, item-by-item price comparisons, and the ledger-style savings dashboard from the uploaded design pack.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            ["8.5%", "avg. saved / cycle"],
            ["5", "outlets compared"],
            ["₹1,486", "lifetime saved"]
          ].map(([value, label]) => (
            <div key={label}>
              <div className="font-serif text-3xl">{value}</div>
              <div className="mt-1 text-[0.65rem] uppercase tracking-[0.16em] text-card/55">{label}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="flex items-center justify-center px-6 py-10 md:px-10">
        <div className="w-full max-w-md">
          <p className="eyebrow text-rose">Demo workspace</p>
          <h2 className="mt-3 font-serif text-4xl font-medium tracking-[-0.02em] text-taupe">Sign in to continue</h2>
          <p className="mt-3 text-sm leading-6 text-steel">The seeded account is pre-filled. Sign in to work with the updated shopping, dashboard, and receipts flows.</p>
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="eyebrow mb-2 block">Email</span>
              <input className="input" {...register("email", { required: true })} placeholder="Email" />
            </label>
            <label className="block">
              <span className="eyebrow mb-2 block">Password</span>
              <input className="input" type="password" {...register("password", { required: true })} placeholder="Password" />
            </label>
            {error ? <p className="text-sm text-roseDeep">{error}</p> : null}
            <button className="btn-primary w-full py-3" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
