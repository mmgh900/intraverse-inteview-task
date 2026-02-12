export interface TransactionRecord {
  hash: string;
  blockNumber: number;
  timestamp: string;
  from: string;
  to: string;
  method: string | null;
  gasUsed: string;
  effectiveGasPrice: string;
}

export interface AnalyticsSummary {
  totalTxCount: number;
  totalGasUsed: string;
  totalGasCost: string;
  firstTxDate: string | null;
  lastTxDate: string | null;
}

export interface DailyStats {
  date: string;
  txCount: number;
  gasUsed: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface AppNotification {
  id: string;
  type: 'mint' | 'upgrade';
  txHash: string;
  status: 'pending' | 'indexed';
  message: string;
  timestamp: number;
}

export interface WsEvent {
  type: 'tx_indexed';
  hash: string;
  method: string;
  blockNumber: number;
}
