import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Budget from '@/models/Budget';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const budgets = await Budget.find({ userId: session.user.id });
    return NextResponse.json(budgets);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { category, limit } = await request.json();
    if (!category || limit == null) {
      return NextResponse.json({ error: 'Category and limit are required' }, { status: 400 });
    }
    await connectDB();
    // Upsert so the same endpoint handles both creating a new budget and updating an existing one.
    // The unique index on {userId, category} ensures only one budget exists per category per user.
    const budget = await Budget.findOneAndUpdate(
      { userId: session.user.id, category },
      { limit },
      { upsert: true, new: true }
    );
    return NextResponse.json(budget, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
