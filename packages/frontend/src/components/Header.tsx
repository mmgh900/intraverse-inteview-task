"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { NetworkBanner } from "@/components/NetworkBanner";
import { NotificationPane } from "@/components/NotificationPane";

export function Header() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `text-[13px] font-medium transition-colors ${
      pathname === path
        ? "text-white"
        : "text-zinc-500 hover:text-zinc-300"
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-[15px] font-semibold tracking-tight text-white">
            Intraverse
          </Link>
          <nav className="flex items-center gap-5">
            <Link href="/" className={linkClass("/")}>
              Collection
            </Link>
            <Link href="/analytics" className={linkClass("/analytics")}>
              Analytics
            </Link>
            <div className="h-4 w-px bg-white/[0.08]" />
            <NotificationPane />
            <ConnectButton />
          </nav>
        </div>
      </header>
      <NetworkBanner />
    </>
  );
}
