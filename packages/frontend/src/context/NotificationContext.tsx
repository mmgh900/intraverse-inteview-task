"use client";

import { createContext, useContext, useCallback, useState, useMemo } from "react";
import type { AppNotification } from "@intraverse/shared";

interface NotificationContextValue {
  notifications: AppNotification[];
  pendingTxHashes: Set<string>;
  unreadCount: number;
  addPendingTx: (txHash: string, type: "mint" | "upgrade", message: string) => void;
  markIndexed: (txHash: string) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readCount, setReadCount] = useState(0);

  const addPendingTx = useCallback(
    (txHash: string, type: "mint" | "upgrade", message: string) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.txHash === txHash)) return prev;
        return [
          {
            id: crypto.randomUUID(),
            type,
            txHash,
            status: "pending" as const,
            message,
            timestamp: Date.now(),
          },
          ...prev,
        ];
      });
    },
    []
  );

  const markIndexed = useCallback((txHash: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.txHash.toLowerCase() === txHash.toLowerCase() && n.status === "pending"
          ? { ...n, status: "indexed" as const }
          : n
      )
    );
  }, []);

  const markAllRead = useCallback(() => {
    setReadCount((prev) => prev + notifications.length);
  }, [notifications.length]);

  const pendingTxHashes = useMemo(
    () => new Set(notifications.filter((n) => n.status === "pending").map((n) => n.txHash)),
    [notifications]
  );

  const unreadCount = Math.max(0, notifications.length - readCount);

  const value = useMemo(
    () => ({
      notifications,
      pendingTxHashes,
      unreadCount,
      addPendingTx,
      markIndexed,
      markAllRead,
    }),
    [notifications, pendingTxHashes, unreadCount, addPendingTx, markIndexed, markAllRead]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
