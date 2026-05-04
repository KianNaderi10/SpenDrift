import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Transaction from '@/models/Transaction';
import { computeArchetype } from '@/lib/archetype';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [thisMonthTxs, lastMonthTxs, allTxs] = await Promise.all([
      Transaction.find({ userId: session.user.id, date: { $gte: thisMonthStart } }),
      Transaction.find({ userId: session.user.id, date: { $gte: lastMonthStart, $lt: thisMonthStart } }),
      Transaction.find({ userId: session.user.id }).sort({ date: -1 }).limit(500),
    ]);

    // Category totals — expenses as positive cents, income tracked separately under 'income' key
    const thisTotals: Record<string, number> = {};
    for (const tx of thisMonthTxs) {
      const cat = tx.category;
      const amt = Math.abs(tx.amount);
      if (tx.amount < 0 || cat === 'income') thisTotals[cat] = (thisTotals[cat] ?? 0) + amt;
    }
    const lastTotals: Record<string, number> = {};
    for (const tx of lastMonthTxs) {
      const cat = tx.category;
      const amt = Math.abs(tx.amount);
      if (tx.amount < 0 || cat === 'income') lastTotals[cat] = (lastTotals[cat] ?? 0) + amt;
    }

    // Drift percentages per category
    const drift: Record<string, number> = {};
    const allCats = new Set([...Object.keys(thisTotals), ...Object.keys(lastTotals)]);
    for (const cat of allCats) {
      const t = thisTotals[cat] ?? 0;
      const l = lastTotals[cat] ?? 0;
      if (l === 0) drift[cat] = t > 0 ? 100 : 0;
      else drift[cat] = Math.round(((t - l) / l) * 100);
    }

    const archetype = computeArchetype(thisTotals);

    // All-time badge stats (derived from allTxs — no date filter, up to 500 records)
    const allExpenses = allTxs.filter((tx: { amount: number; category: string; description: string }) => tx.amount < 0);
    const totalTxCount = allTxs.length;
    const totalWithDesc = allTxs.filter((tx: { description: string }) => tx.description && tx.description.trim().length > 0).length;
    const maxExpense = allExpenses.length > 0 ? Math.max(...allExpenses.map((tx: { amount: number }) => Math.abs(tx.amount))) : 0;
    const hasTravelEver = allExpenses.some((tx: { category: string }) => tx.category === 'travel');
    const hasIncomeEver = allTxs.some((tx: { amount: number }) => tx.amount > 0);
    const distinctCatCount = new Set(allExpenses.map((tx: { category: string }) => tx.category)).size;

    // Top drift insights (expenses only — income drift is not a spending insight)
    const insights = Object.entries(drift)
      .filter(([cat]) => cat !== 'income')
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 3)
      .map(([cat, pct]) => ({
        category: cat,
        drift: pct,
        thisMonth: thisTotals[cat] ?? 0,
        lastMonth: lastTotals[cat] ?? 0,
      }));

    // Pattern: weekend vs weekday spending
    let weekendTotal = 0, weekdayTotal = 0;
    let weekendCount = 0, weekdayCount = 0;
    for (const tx of allTxs) {
      if (tx.amount < 0) {
        const day = new Date(tx.date).getDay();
        if (day === 0 || day === 6) {
          weekendTotal += Math.abs(tx.amount);
          weekendCount++;
        } else {
          weekdayTotal += Math.abs(tx.amount);
          weekdayCount++;
        }
      }
    }
    const weekendAvg = weekendCount > 0 ? weekendTotal / weekendCount : 0;
    const weekdayAvg = weekdayCount > 0 ? weekdayTotal / weekdayCount : 0;
    const weekendDiff = weekdayAvg > 0 ? Math.round(((weekendAvg - weekdayAvg) / weekdayAvg) * 100) : 0;

    // Daily spending last 30 days (streak needs up to 31, chart uses last 7)
    const daily: Record<string, number> = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    for (const tx of allTxs) {
      if (tx.amount < 0 && new Date(tx.date) >= thirtyDaysAgo) {
        const key = new Date(tx.date).toISOString().split('T')[0];
        daily[key] = (daily[key] ?? 0) + Math.abs(tx.amount);
      }
    }

    return NextResponse.json({
      thisMonthTotals: thisTotals,
      lastMonthTotals: lastTotals,
      drift,
      archetype,
      insights,
      weekendDiff,
      dailySpending: daily,
      totalTxCount,
      totalWithDesc,
      maxExpense,
      hasTravelEver,
      hasIncomeEver,
      distinctCatCount,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
