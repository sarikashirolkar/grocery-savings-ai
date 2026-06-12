"use client";

import { useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/api";
import { LoginForm } from "@/components/login-form";


export function AuthGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    void getCurrentUser()
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false))
      .finally(() => setMounted(true));
  }, []);

  if (!mounted || !authenticated) {
    return <LoginForm onLoggedIn={() => setAuthenticated(true)} />;
  }

  return <>{children}</>;
}
