"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "@/context/NotificationContext";
import { checkTxHashes } from "@/lib/api";
import type { WsEvent } from "@intraverse/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const WS_URL = API_URL.replace(/^http/, "ws");
const MAX_RECONNECT_DELAY = 30_000;
const POLL_INTERVAL = 5_000;

export function useWebSocket() {
  const queryClient = useQueryClient();
  const { markIndexed, pendingTxHashes } = useNotifications();
  const reconnectDelay = useRef(1000);
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data: WsEvent = JSON.parse(event.data);
        if (data.type === "tx_indexed") {
          markIndexed(data.hash);
          queryClient.invalidateQueries({ queryKey: ["analytics"] });
        }
      } catch {
        // ignore non-JSON messages (pings etc.)
      }
    },
    [markIndexed, queryClient]
  );

  // WebSocket connection
  useEffect(() => {
    mountedRef.current = true;

    function connect() {
      if (!mountedRef.current) return;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          reconnectDelay.current = 1000;
        };

        ws.onmessage = handleMessage;

        ws.onclose = () => {
          wsRef.current = null;
          if (!mountedRef.current) return;
          const delay = reconnectDelay.current;
          reconnectDelay.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
          reconnectTimer.current = setTimeout(connect, delay);
        };

        ws.onerror = () => {
          // onclose will fire after this, triggering reconnect
        };
      } catch {
        if (mountedRef.current) {
          reconnectTimer.current = setTimeout(connect, reconnectDelay.current);
        }
      }
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [handleMessage]);

  // Fallback polling: check pending tx hashes via API every 5s
  useEffect(() => {
    if (pendingTxHashes.size === 0) return;

    const poll = async () => {
      try {
        const hashes = Array.from(pendingTxHashes);
        const found = await checkTxHashes(hashes);
        if (found.length > 0) {
          for (const hash of found) {
            markIndexed(hash);
          }
          queryClient.invalidateQueries({ queryKey: ["analytics"] });
        }
      } catch {
        // silently retry next interval
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL);
    // Also run immediately
    poll();

    return () => clearInterval(interval);
  }, [pendingTxHashes, markIndexed, queryClient]);
}
