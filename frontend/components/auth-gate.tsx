"use client";

import { useEffect, useState } from "react";

import { LoginForm } from "@/components/login-form";


export function AuthGate({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem("grocery-token"));
    } catch {
      setToken(null);
    } finally {
      setMounted(true);
    }
  }, []);

  if (!mounted || !token) {
    return <LoginForm onLoggedIn={setToken} />;
  }

  return <>{children}</>;
}
