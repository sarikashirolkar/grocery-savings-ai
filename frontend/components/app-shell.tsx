"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { logout } from "@/lib/api";

const links = [
  { href: "/buy", label: "Buy" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/receipts", label: "Receipts" },
  { href: "/recommendations", label: "Recommendations" }
];


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <main className="pb-10">
      <header className="sticky top-0 z-20 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-taupe shadow-inset">
              <div className="h-3 w-3 rounded-[3px] bg-rose" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-semibold tracking-[-0.02em] text-taupe">Grocery Savings</span>
              <span className="rounded-sm border border-line px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.16em] text-steel">AI</span>
            </div>
          </div>
          <nav className="hidden flex-wrap items-center gap-6 lg:flex">
            {links.map((link) => (
              <Link
                className={pathname === link.href ? "border-b-2 border-rose pb-1 text-sm font-semibold text-taupe" : "pb-1 text-sm font-medium text-steel transition hover:text-taupe"}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
            <button
              className="text-sm text-steel transition hover:text-taupe"
              onClick={async () => {
                try {
                  await logout();
                } finally {
                  try {
                    window.localStorage.removeItem("grocery-token");
                  } catch {}
                }
                router.refresh();
                window.location.href = "/buy";
              }}
              type="button"
            >
              Sign Out
            </button>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 pt-8 md:px-8">{children}</div>
    </main>
  );
}
