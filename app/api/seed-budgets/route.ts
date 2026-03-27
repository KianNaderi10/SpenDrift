import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Budget from '@/models/Budget';

const DEFAULT_BUDGETS = [
  { category: 'dining', limit: 50000 },
  { category: 'groceries', limit: 25000 },
  { category: 'coffee', limit: 6000 },
  { category: 'entertainment', limit: 40000 },
  { category: 'transport', limit: 15000 },
  { category: 'shopping', limit: 30000 },
  { category: 'health', limit: 10000 },
  { category: 'travel', limit: 50000 },
  { category: 'bills', limit: 100000 },
];

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const results = await Promise.all(
      DEFAULT_BUDGETS.map(b =>
        Budget.findOneAndUpdate(
          { userId: session.user.id, category: b.category },
          { limit: b.limit },
          { upsert: true, new: true }
        )
      )
    );
    return NextResponse.json({ seeded: results.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
