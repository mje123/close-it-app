import { Router, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db/init';
import { authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth';
import { calculateBuyer, calculateSeller, BuyerInputs, SellerInputs } from '../utils/calculations';

const router = Router();

const buyerInputSchema = z.object({
  purchasePrice: z.number().positive(),
  downPayment: z.number().min(0),
  interestRate: z.number().min(0).max(25),
  loanType: z.enum(['conventional', 'fha', 'va', 'cash']),
  loanTerm: z.number().int().positive(),
  locationState: z.string(),
  locationCounty: z.string(),
  propertyType: z.string().default('Single Family Home'),
  propertyUse: z.string().default('Primary Residence'),
  closingDate: z.string(),
  hoa: z.number().min(0).default(0),
  brokerFee: z.number().min(0).default(0),
  sellerCredit: z.number().min(0).default(0),
  otherCredits: z.number().min(0).default(0),
  otherCharges: z.number().min(0).default(0)
});

const sellerInputSchema = z.object({
  salesPrice: z.number().positive(),
  locationState: z.string(),
  locationCounty: z.string(),
  propertyType: z.string().default('Single Family Home'),
  commission: z.number().min(0).max(20).default(6),
  mortgagePayoff: z.number().min(0).default(0),
  helocPayoff: z.number().min(0).default(0),
  settlementDate: z.string(),
  sellerCredit: z.number().min(0).default(0),
  otherCharges: z.number().min(0).default(0),
  waterEscrow: z.number().min(0).default(250),
  adminFee: z.number().min(0).default(0)
});

router.post('/calculate/buyer', optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const inputs = buyerInputSchema.parse(req.body) as BuyerInputs;
    const results = calculateBuyer(inputs);
    res.json({ inputs, results });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) res.status(400).json({ error: err.errors });
    else res.status(500).json({ error: 'Calculation failed' });
  }
});

router.post('/calculate/seller', optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const inputs = sellerInputSchema.parse(req.body) as SellerInputs;
    const results = calculateSeller(inputs);
    res.json({ inputs, results });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) res.status(400).json({ error: err.errors });
    else res.status(500).json({ error: 'Calculation failed' });
  }
});

router.post('/save', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { calcType, inputs, results, name } = req.body;
    const db = getDb();
    const { rows: [row] } = await db.query(
      `INSERT INTO calculations
        (user_id, calc_type, purchase_price, down_payment, interest_rate,
         location_state, location_county, loan_type, all_inputs, calculated_results, name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [
        req.userId, calcType,
        inputs.purchasePrice || inputs.salesPrice,
        inputs.downPayment || 0,
        inputs.interestRate || 0,
        inputs.locationState,
        inputs.locationCounty,
        inputs.loanType || null,
        JSON.stringify(inputs),
        JSON.stringify(results),
        name || `${calcType === 'buyer' ? 'Purchase' : 'Sale'} - ${new Date().toLocaleDateString()}`
      ]
    );
    res.json({ id: row.id, message: 'Saved successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to save' });
  }
});

router.get('/saved', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const { rows } = await db.query(
    'SELECT id, calc_type, name, location_state, location_county, purchase_price, created_at FROM calculations WHERE user_id = $1 ORDER BY created_at DESC',
    [req.userId]
  );
  res.json({ calculations: rows });
});

router.get('/saved/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  const { rows: [row] } = await db.query(
    'SELECT * FROM calculations WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
  if (!row) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({
    ...row,
    all_inputs: typeof row.all_inputs === 'string' ? JSON.parse(row.all_inputs) : row.all_inputs,
    calculated_results: typeof row.calculated_results === 'string' ? JSON.parse(row.calculated_results) : row.calculated_results,
  });
});

router.delete('/saved/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const db = getDb();
  await db.query('DELETE FROM calculations WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.json({ message: 'Deleted' });
});

export default router;
