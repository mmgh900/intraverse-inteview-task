"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Loader2, Zap, Sparkles } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function NotificationPane() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllRead } = useNotifications();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open && unreadCount > 0) markAllRead();
        }}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-gray-900" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-gray-700 bg-gray-900 shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-sm font-medium text-white">Notifications</span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30"
                >
                  <div className="mt-0.5">
                    {n.type === "mint" ? (
                      <Sparkles className="h-4 w-4 text-green-400" />
                    ) : (
                      <Zap className="h-4 w-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{timeAgo(n.timestamp)}</p>
                  </div>
                  <div className="mt-0.5">
                    {n.status === "pending" ? (
                      <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 text-green-400" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
