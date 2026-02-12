"use client";

import dynamic from "next/dynamic";

const Web3ProviderInner = dynamic(
  () => import("@/providers/Web3ProviderInner").then((mod) => mod.Web3ProviderInner),
  { ssr: false }
);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return <Web3ProviderInner>{children}</Web3ProviderInner>;
}
