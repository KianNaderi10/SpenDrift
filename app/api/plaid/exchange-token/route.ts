import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { plaidClient } from '@/lib/plaid';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { format, subDays } from 'date-fns';

// Maps Plaid's category strings to SpenDrift's internal category set.
// Only the first matching entry wins (see mapCategory), so order matters for overlapping labels.
const CATEGORY_MAP: Record<string, string> = {
  'Food and Drink': 'dining',
  'Restaurants': 'dining',
  'Coffee Shop': 'coffee',
  'Groceries': 'groceries',
  'Supermarkets and Groceries': 'groceries',
  'Travel': 'travel',
  'Airlines and Aviation Services': 'travel',
  'Gas Stations': 'transport',
  'Taxi': 'transport',
  'Ride Share': 'transport',
  'Public Transportation Services': 'transport',
  'Transportation': 'transport',
  'Recreation': 'entertainment',
  'Entertainment': 'entertainment',
  'Gyms and Fitness Centers': 'health',
  'Healthcare Services': 'health',
  'Medical': 'health',
  'Pharmacies': 'health',
  'Shops': 'shopping',
  'Shopping': 'shopping',
  'Telecommunication Services': 'bills',
  'Utilities': 'bills',
  'Rent': 'bills',
  'Service': 'bills',
  'Income': 'income',
  'Payroll': 'income',
  'Transfer': 'other',
  'Deposit': 'income',
};

function mapCategory(plaidCategories: string[] | null): string {
  if (!plaidCategories) return 'other';
  for (const cat of plaidCategories) {
    const mapped = CATEGORY_MAP[cat];
    if (mapped) return mapped;
  }
  return 'other';
}

// Step 2 of the Plaid Link flow: exchange the one-time public_token for a persistent
// access_token, then immediately back-fill 90 days of transactions.
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { public_token } = await request.json();
    if (!public_token) return NextResponse.json({ error: 'public_token required' }, { status: 400 });

    const exchangeRes = await plaidClient.itemPublicTokenExchange({ public_token });
    const accessToken = exchangeRes.data.access_token;
    const itemId = exchangeRes.data.item_id;

    await connectDB();
    await User.findByIdAndUpdate(session.user.id, { plaidAccessToken: accessToken, plaidItemId: itemId });

    const today = new Date();
    const startDate = format(subDays(today, 90), 'yyyy-MM-dd');
    const endDate = format(today, 'yyyy-MM-dd');

    const txRes = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    });

    const plaidTxs = txRes.data.transactions ?? [];

    // Batch-check which IDs are already imported (one query instead of N)
    const incomingIds = plaidTxs.map(tx => tx.transaction_id);
    let existingIds = new Set<string>();
    if (incomingIds.length > 0) {
      const existing = await Transaction.find(
        { plaidTransactionId: { $in: incomingIds } },
        { plaidTransactionId: 1 }
      ).lean() as { plaidTransactionId: string }[];
      existingIds = new Set(existing.map(tx => tx.plaidTransactionId));
    }

    const toInsert = plaidTxs
      .filter(tx => !existingIds.has(tx.transaction_id))
      .map(tx => ({
        userId: session.user.id,
        // Plaid: positive = debit (expense). SpenDrift: negative = expense, positive = income.
        amount: Math.round(-tx.amount * 100),
        category: mapCategory(tx.category ?? null),
        description: tx.name ?? '',
        date: new Date(tx.date),
        plaidTransactionId: tx.transaction_id,
      }));

    let synced = 0;
    if (toInsert.length > 0) {
      try {
        await Transaction.insertMany(toInsert, { ordered: false });
        synced = toInsert.length;
      } catch (insertErr: unknown) {
        // ordered:false — some docs may have inserted despite the error
        const result = (insertErr as { insertedDocs?: unknown[] }).insertedDocs;
        synced = Array.isArray(result) ? result.length : 0;
        console.error('Partial Plaid insert error:', insertErr);
      }
    }

    return NextResponse.json({ synced });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 });
  }
}
