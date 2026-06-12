"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";


export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/buy");
  }, [router]);

  return <div className="panel mx-auto mt-12 max-w-xl">Redirecting to the buying workflow...</div>;
}
