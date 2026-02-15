"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
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
        className="relative p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-white/[0.06] bg-[#111] shadow-2xl z-50 overflow-hidden fade-in">
          <div className="px-4 py-3 border-b border-white/[0.04]">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Notifications
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-xs text-zinc-600">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-zinc-300">{n.message}</p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">{timeAgo(n.timestamp)}</p>
                  </div>
                  <div className="mt-0.5 flex-shrink-0">
                    {n.status === "pending" ? (
                      <Loader2 className="h-3.5 w-3.5 text-zinc-500 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
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
