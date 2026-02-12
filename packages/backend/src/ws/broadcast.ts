import WebSocket from 'ws';
import type { Server } from 'http';
import type { WsEvent } from '@intraverse/shared';
import { logger } from '../utils/logger';

let wss: WebSocket.Server | null = null;

const HEARTBEAT_INTERVAL = 30_000;

export function initWebSocket(server: Server): void {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws: WebSocket) => {
    (ws as any).isAlive = true;

    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    ws.on('error', (err: Error) => {
      logger.error({ err }, 'WebSocket client error');
    });
  });

  // Heartbeat to detect dead connections
  const interval = setInterval(() => {
    if (!wss) return;
    for (const ws of wss.clients) {
      if (!(ws as any).isAlive) {
        ws.terminate();
        continue;
      }
      (ws as any).isAlive = false;
      ws.ping();
    }
  }, HEARTBEAT_INTERVAL);

  wss.on('close', () => {
    clearInterval(interval);
  });

  logger.info('WebSocket server initialized');
}

export function broadcastEvent(event: WsEvent): void {
  if (!wss) return;

  const data = JSON.stringify(event);
  let sent = 0;

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
      sent++;
    }
  }

  if (sent > 0) {
    logger.debug({ event: event.type, hash: event.hash, clients: sent }, 'Broadcast event');
  }
}
