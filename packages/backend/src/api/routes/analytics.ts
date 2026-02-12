import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getSummary, getDailyStats, getTransactionsPaginated, checkTxHashes } from '../../db/queries/analytics';

const router = Router();

const dailyQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
}).refine(
  (data) => data.from <= data.to,
  { message: 'from must be <= to' }
).refine(
  (data) => {
    const fromDate = new Date(data.from);
    const toDate = new Date(data.to);
    const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 365;
  },
  { message: 'Date range must not exceed 365 days' }
);

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

router.get('/summary', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await getSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

router.get('/daily', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = dailyQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation error', details: parsed.error.issues });
      return;
    }
    const { from, to } = parsed.data;
    const data = await getDailyStats(from, to);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get('/txs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation error', details: parsed.error.issues });
      return;
    }
    const { limit, offset } = parsed.data;
    const { data, total } = await getTransactionsPaginated(limit, offset);
    res.json({ data, total, limit, offset });
  } catch (err) {
    next(err);
  }
});

router.post('/tx/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ hashes: z.array(z.string()).max(50) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation error', details: parsed.error.issues });
      return;
    }
    const found = await checkTxHashes(parsed.data.hashes);
    res.json({ found });
  } catch (err) {
    next(err);
  }
});

export { router as analyticsRouter };
