import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Transaction from '@/models/Transaction';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const { amount, category, description, date } = await req.json();
    if (amount !== undefined && (typeof amount !== 'number' || isNaN(amount))) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    if (category !== undefined && (typeof category !== 'string' || !category.trim())) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    if (date !== undefined && isNaN(new Date(date).getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }
    await connectDB();
    const tx = await Transaction.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: { amount, category, description, date } },
      { new: true }
    );
    if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(tx);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    await connectDB();
    const tx = await Transaction.findOneAndDelete({ _id: id, userId: session.user.id });
    if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
