"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { login } from "@/lib/api";


type FormValues = {
  email: string;
  password: string;
};


export function LoginForm({ onLoggedIn }: { onLoggedIn: (token: string) => void }) {
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
      const response = await login(values.email, values.password);
      window.localStorage.setItem("grocery-token", response.access_token);
      onLoggedIn(response.access_token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed");
    }
  });

  return (
    <div className="mx-auto max-w-md panel">
      <p className="text-sm uppercase tracking-[0.3em] text-ink/50">Grocery Savings AI</p>
      <h1 className="mt-3 text-3xl font-semibold">Sign in to the demo workspace</h1>
      <p className="mt-2 text-sm text-slate-600">Use the seeded account or register through the API.</p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <input className="input" {...register("email", { required: true })} placeholder="Email" />
        <input className="input" type="password" {...register("password", { required: true })} placeholder="Password" />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button className="btn-primary w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
