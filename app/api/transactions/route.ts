import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Transaction from '@/models/Transaction';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    // 90-day window matches the Plaid import range so the dashboard shows a consistent history.
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const transactions = await Transaction.find({
      userId: session.user.id,
      date: { $gte: since },
    }).sort({ date: -1 }).limit(100);
    return NextResponse.json(transactions);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { amount, category, description, date } = await request.json();
    if (!amount || !category) {
      return NextResponse.json({ error: 'Amount and category are required' }, { status: 400 });
    }
    if (date && isNaN(new Date(date).getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }
    await connectDB();
    const tx = await Transaction.create({
      userId: session.user.id,
      amount,
      category,
      description: description ?? '',
      date: date ? new Date(date) : new Date(),
    });
    return NextResponse.json(tx, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
