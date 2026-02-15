import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Intraverse dApp",
  description: "Mint & manage tokens on Somnia",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#0a0a0a] text-gray-100 antialiased`}>
        <Web3Provider>
          <Header />
          <main className="mx-auto max-w-7xl px-6 py-10">
            {children}
          </main>
        </Web3Provider>
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  );
}
