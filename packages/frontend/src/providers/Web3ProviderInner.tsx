"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { somniaChain } from "@/lib/chain";
import type { Transport } from "viem";
import { NotificationProvider } from "@/context/NotificationContext";
import { useWebSocket } from "@/hooks/useWebSocket";

const config = createConfig({
  chains: [somniaChain],
  transports: {
    [somniaChain.id]: http(),
  } as Record<number, Transport>,
  ssr: true,
});

const queryClient = new QueryClient();

function WebSocketConnector({ children }: { children: React.ReactNode }) {
  useWebSocket();
  return <>{children}</>;
}

export function Web3ProviderInner({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <RainbowKitProvider theme={darkTheme()}>
            <WebSocketConnector>
              {children}
            </WebSocketConnector>
          </RainbowKitProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
