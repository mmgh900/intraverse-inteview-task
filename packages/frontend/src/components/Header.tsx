"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { NetworkBanner } from "@/components/NetworkBanner";
import { NotificationPane } from "@/components/NotificationPane";

export function Header() {
  return (
    <>
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-white">
            Intraverse
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Mint &amp; Manage
            </Link>
            <Link
              href="/analytics"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Analytics
            </Link>
            <NotificationPane />
            <ConnectButton />
          </nav>
        </div>
      </header>
      <NetworkBanner />
    </>
  );
}
