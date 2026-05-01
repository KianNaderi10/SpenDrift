import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { plaidClient } from '@/lib/plaid';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { format, subDays } from 'date-fns';

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

    const plaidTxs = txRes.data.transactions;
    let synced = 0;

    for (const tx of plaidTxs) {
      const exists = await Transaction.findOne({ plaidTransactionId: tx.transaction_id });
      if (exists) continue;

      const category = mapCategory(tx.category ?? null);
      // Plaid: positive = debit (expense). SpenDrift: negative = expense, positive = income.
      const amount = Math.round(-tx.amount * 100);

      await Transaction.create({
        userId: session.user.id,
        amount,
        category,
        description: tx.name,
        date: new Date(tx.date),
        plaidTransactionId: tx.transaction_id,
      });
      synced++;
    }

    return NextResponse.json({ synced });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 });
  }
}
