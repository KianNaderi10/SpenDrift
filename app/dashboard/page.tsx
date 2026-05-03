'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ARCHETYPES, computeArchetype } from '@/lib/archetype';
import { format, subDays } from 'date-fns';
import { useTheme } from '../theme-context';
import PlaidLinkButton from '../components/PlaidLinkButton';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Transaction {
  _id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface Budget {
  _id: string;
  category: string;
  limit: number;
}

interface Insights {
  thisMonthTotals: Record<string, number>;
  lastMonthTotals: Record<string, number>;
  drift: Record<string, number>;
  archetype: string;
  insights: { category: string; drift: number; thisMonth: number; lastMonth: number }[];
  weekendDiff: number;
  dailySpending: Record<string, number>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'dining', emoji: '🍜', label: 'Dining' },
  { id: 'groceries', emoji: '🛒', label: 'Groceries' },
  { id: 'coffee', emoji: '☕', label: 'Coffee' },
  { id: 'entertainment', emoji: '🎮', label: 'Entertainment' },
  { id: 'transport', emoji: '🚗', label: 'Transport' },
  { id: 'shopping', emoji: '🛍️', label: 'Shopping' },
  { id: 'health', emoji: '💊', label: 'Health' },
  { id: 'travel', emoji: '✈️', label: 'Travel' },
  { id: 'bills', emoji: '🏠', label: 'Bills' },
  { id: 'income', emoji: '💰', label: 'Income' },
  { id: 'other', emoji: '📦', label: 'Other' },
];

const CAT_COLORS: Record<string, string> = {
  dining: '#d97706',
  groceries: '#16a34a',
  coffee: '#ea580c',
  entertainment: '#7c3aed',
  transport: '#2563eb',
  shopping: '#db2777',
  health: '#059669',
  travel: '#0891b2',
  bills: '#64748b',
  income: '#16a34a',
  other: '#94a3b8',
};

const ARCHETYPE_ORDER = [
  'homebody', 'foodie', 'shopaholic', 'explorer', 'socialite', 'gamer',
  'techjunkie', 'creative', 'scholar', 'wellness', 'petparent', 'roadwarrior',
  'familyfirst', 'philanthropist', 'impulsebuyer', 'gambler', 'statusseeker',
  'speculator', 'minimalist', 'wealthbuilder',
];

function fmt(cents: number): string {
  return `$${(Math.abs(cents) / 100).toFixed(2)}`;
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────

function DonutChart({ totals, C }: { totals: Record<string, number>; C: ReturnType<typeof makeC> }) {
  const entries = Object.entries(totals)
    .filter(([k]) => k !== 'income')
    .sort((a, b) => b[1] - a[1]);
  const top4 = entries.slice(0, 4);
  const otherAmt = entries.slice(4).reduce((s, [, v]) => s + v, 0);
  const segments = [...top4, ...(otherAmt > 0 ? [['other', otherAmt] as [string, number]] : [])];
  const total = segments.reduce((s, [, v]) => s + v, 0);

  if (total === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>No expense data yet</span>
      </div>
    );
  }

  const cx = 80, cy = 80, r = 68, innerR = 44;
  let cumAngle = -Math.PI / 2;
  const paths: { d: string; color: string; cat: string; pct: number; amt: number }[] = [];

  for (const [cat, amt] of segments) {
    const pct = amt / total;
    const angle = pct * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    const x2 = cx + r * Math.cos(cumAngle + angle);
    const y2 = cy + r * Math.sin(cumAngle + angle);
    const ix1 = cx + innerR * Math.cos(cumAngle);
    const iy1 = cy + innerR * Math.sin(cumAngle);
    const ix2 = cx + innerR * Math.cos(cumAngle + angle);
    const iy2 = cy + innerR * Math.sin(cumAngle + angle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const d = `M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
    paths.push({ d, color: CAT_COLORS[cat] ?? '#94a3b8', cat, pct, amt });
    cumAngle += angle;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width={160} height={160} viewBox="0 0 160 160" style={{ flexShrink: 0 }}>
        {paths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill={p.color}
            opacity={0.92}
            style={{ transition: 'opacity 0.2s' }}
          />
        ))}
        <circle cx={80} cy={80} r={innerR - 2} fill={C.card} />
        <text x={80} y={76} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight={600}>Total</text>
        <text x={80} y={92} textAnchor="middle" fill={C.text} fontSize={14} fontWeight={700}>{fmt(total)}</text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {paths.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.muted, flex: 1, textTransform: 'capitalize' }}>{p.cat}</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{Math.round(p.pct * 100)}%</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text, minWidth: 56, textAlign: 'right' }}>{fmt(p.amt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Color helper type ────────────────────────────────────────────────────────

function makeC(isDark: boolean) {
  return {
    isDark,
    bg: isDark ? '#0a0a0a' : '#fafafa',
    card: isDark ? '#1a1a1a' : '#ffffff',
    border: isDark ? 'rgba(255,255,255,0.08)' : '#e5e5e5',
    text: isDark ? '#fafafa' : '#0a0a0a',
    muted: isDark ? '#8a8a8a' : '#6b6b6b',
    accent: isDark ? '#22c55e' : '#16a34a',
    accentText: '#ffffff',
    inputBg: isDark ? '#1f1f1f' : '#ffffff',
    sidebarBg: isDark ? '#111111' : '#ffffff',
    hoverBg: isDark ? 'rgba(255,255,255,0.04)' : '#f5f5f5',
    stripeBg: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
    green: isDark ? '#22c55e' : '#16a34a',
    red: '#dc2626',
    greenDim: 'rgba(22,163,74,0.12)',
    redDim: 'rgba(220,38,38,0.10)',
    amber: '#d97706',
    amberDim: 'rgba(217,119,6,0.10)',
  };
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ transactions, budgets, insights, userName, onRefresh, onNavigate, C }: {
  transactions: Transaction[];
  budgets: Budget[];
  insights: Insights | null;
  userName: string;
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
  C: ReturnType<typeof makeC>;
}) {
  const archetype = insights?.archetype ?? 'homebody';
  const arc = ARCHETYPES[archetype] ?? ARCHETYPES.homebody;
  const totals = insights?.thisMonthTotals ?? {};
  const recent = transactions.slice(0, 8);

  const arcIdx = ARCHETYPE_ORDER.indexOf(archetype);
  const progress = arc.next ? Math.min(90, 15 + arcIdx * 18) : 100;

  const totalSpent = Object.entries(totals)
    .filter(([k]) => k !== 'income')
    .reduce((s, [, v]) => s + v, 0);
  const totalIncome = totals['income'] ?? 0;
  const net = totalIncome - totalSpent;

  const lastTotals = insights?.lastMonthTotals ?? {};
  const lastSpent = Object.entries(lastTotals).filter(([k]) => k !== 'income').reduce((s, [, v]) => s + v, 0);
  const lastIncome = lastTotals['income'] ?? 0;
  const lastNet = lastIncome - lastSpent;

  function trendPct(curr: number, prev: number) {
    if (prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 100);
  }
  const spentTrend = trendPct(totalSpent, lastSpent);
  const incomeTrend = trendPct(totalIncome, lastIncome);
  const netTrend = trendPct(net, lastNet);

  const budgetPcts = budgets.map(b => {
    const spent = totals[b.category] ?? 0;
    return Math.min(100, Math.round((spent / b.limit) * 100));
  });
  const avgBudgetUsed = budgetPcts.length > 0 ? Math.round(budgetPcts.reduce((s, v) => s + v, 0) / budgetPcts.length) : 0;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const key = format(d, 'yyyy-MM-dd');
    return { label: format(d, 'EEE'), key, amount: insights?.dailySpending[key] ?? 0 };
  });
  const maxDaily = Math.max(...days.map(d => d.amount), 1);

  const topCatEntry = Object.entries(totals)
    .filter(([k]) => k !== 'income')
    .sort((a, b) => b[1] - a[1])[0];
  const topCat = topCatEntry ? { id: topCatEntry[0], amount: topCatEntry[1] } : null;
  const topCatLast = topCat ? (lastTotals[topCat.id] ?? 0) : 0;
  const topCatTrend = topCat ? trendPct(topCat.amount, topCatLast) : null;
  const topCatInfo = topCat ? CATEGORIES.find(c => c.id === topCat.id) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 3, fontWeight: 600, letterSpacing: 0.5 }}>{format(new Date(), 'MMMM yyyy').toUpperCase()}</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text }}>Overview</h1>
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: '50%',
          background: 'rgba(22,163,74,0.1)',
          border: '2px solid #16a34a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, color: '#16a34a',
        }}>
          {userName?.[0]?.toUpperCase() ?? 'U'}
        </div>
      </div>

      {/* Stat cards — 4 in a row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        {/* Total Spent */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>TOTAL SPENT</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: C.red }}>{fmt(totalSpent)}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>vs last month</span>
            {spentTrend !== null && (
              <span style={{ fontSize: 11, fontWeight: 700, color: spentTrend > 0 ? C.red : C.green }}>
                {spentTrend > 0 ? '↑' : '↓'}{Math.abs(spentTrend)}%
              </span>
            )}
          </div>
        </div>
        {/* Total Income */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>TOTAL INCOME</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: C.green }}>{fmt(totalIncome)}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>vs last month</span>
            {incomeTrend !== null && (
              <span style={{ fontSize: 11, fontWeight: 700, color: incomeTrend >= 0 ? C.green : C.red }}>
                {incomeTrend >= 0 ? '↑' : '↓'}{Math.abs(incomeTrend)}%
              </span>
            )}
          </div>
        </div>
        {/* Net */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>NET</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: net >= 0 ? C.green : C.red }}>
            {net >= 0 ? '+' : '-'}{fmt(Math.abs(net))}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{net >= 0 ? 'Surplus' : 'Deficit'}</span>
            {netTrend !== null && (
              <span style={{ fontSize: 11, fontWeight: 700, color: netTrend >= 0 ? C.green : C.red }}>
                {netTrend >= 0 ? '↑' : '↓'}{Math.abs(netTrend)}%
              </span>
            )}
          </div>
        </div>
        {/* Budget */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>BUDGET USED</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: avgBudgetUsed >= 90 ? C.red : avgBudgetUsed >= 70 ? C.amber : C.green }}>
            {budgets.length > 0 ? `${avgBudgetUsed}%` : '—'}
          </p>
          {budgets.length > 0 && (
            <div style={{ marginTop: 8, height: 4, background: C.hoverBg, borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${avgBudgetUsed}%`, background: avgBudgetUsed >= 90 ? C.red : avgBudgetUsed >= 70 ? C.amber : C.green, borderRadius: 2, transition: 'width 0.8s ease' }} />
            </div>
          )}
        </div>
      </div>

      {/* 7-day spending bar chart — full width */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Daily Spending — Last 7 Days</p>
          <p style={{ fontSize: 12, color: C.muted }}>{fmt(days.reduce((s, d) => s + d.amount, 0))} total</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
          {days.map((d) => {
            const pct = d.amount / maxDaily;
            const isToday = d.label === format(new Date(), 'EEE');
            return (
              <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>{d.amount > 0 ? fmt(d.amount).replace('$', '') : ''}</div>
                <div style={{
                  width: '100%', borderRadius: 4,
                  height: `${Math.max(pct * 56, d.amount > 0 ? 4 : 2)}px`,
                  background: isToday ? '#16a34a' : d.amount > 0 ? `${C.green}60` : C.hoverBg,
                  transition: 'height 0.6s ease',
                }} />
                <div style={{ fontSize: 10, color: isToday ? '#16a34a' : C.muted, fontWeight: isToday ? 700 : 400 }}>{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Donut + Top category side-by-side */}
      <div style={{ display: 'grid', gridTemplateColumns: topCat ? '3fr 2fr' : '1fr', gap: 20 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Spending Breakdown</p>
          <DonutChart totals={totals} C={C} />
        </div>

        {topCat && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Top Category</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: `${CAT_COLORS[topCat.id] ?? '#94a3b8'}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>
                {topCatInfo?.emoji ?? '📦'}
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: 0.5, marginBottom: 3 }}>THIS MONTH</p>
                <p style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{topCatInfo?.label ?? topCat.id}</p>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 28, fontWeight: 800, color: C.text }}>{fmt(topCat.amount)}</p>
              {topCatTrend !== null && (
                <p style={{ fontSize: 12, fontWeight: 700, color: topCatTrend > 0 ? C.red : C.green, marginTop: 4 }}>
                  {topCatTrend > 0 ? '↑' : '↓'} {Math.abs(topCatTrend)}% vs last month
                </p>
              )}
            </div>
            {/* Mini bar — this cat as share of total */}
            {totalSpent > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: C.muted }}>Share of total spending</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{Math.round((topCat.amount / totalSpent) * 100)}%</span>
                </div>
                <div style={{ height: 5, background: C.hoverBg, borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${Math.round((topCat.amount / totalSpent) * 100)}%`, background: CAT_COLORS[topCat.id] ?? '#94a3b8', borderRadius: 3, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Budget + Recent Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: budgets.length === 0 ? '1fr 1fr' : '3fr 2fr', gap: 20 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Budget Status</p>
          {budgets.length === 0 ? (
            <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 28 }}>📊</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>No budgets set</p>
              <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>Set spending limits per category to track how you're doing each month.</p>
              <button
                onClick={() => onNavigate('log')}
                style={{ marginTop: 4, background: C.accent, color: C.accentText, border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Set a Budget
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {budgets.map(b => {
                const spent = totals[b.category] ?? 0;
                const pct = Math.min(100, Math.round((spent / b.limit) * 100));
                const driftPct = insights?.drift[b.category] ?? 0;
                const barColor = pct >= 100 ? C.red : pct >= 70 ? C.amber : C.green;
                const catInfo = CATEGORIES.find(c => c.id === b.category);
                return (
                  <div key={b._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 15 }}>{catInfo?.emoji ?? '📦'}</span>
                        <span style={{ fontSize: 13, color: C.text, fontWeight: 600, textTransform: 'capitalize' }}>{b.category}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {driftPct !== 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: driftPct > 0 ? C.redDim : C.greenDim, color: driftPct > 0 ? C.red : C.green, border: `1px solid ${driftPct > 0 ? 'rgba(220,38,38,0.2)' : 'rgba(22,163,74,0.2)'}` }}>
                            {driftPct > 0 ? '+' : ''}{driftPct}%
                          </span>
                        )}
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{fmt(spent)} / {fmt(b.limit)}</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: C.hoverBg, borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 0.8s ease', animation: 'fillBar 0.8s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Recent</p>
          {recent.length === 0 ? (
            <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 32 }}>🧾</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>No transactions yet</p>
              <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>Log your first purchase to start building your spending profile.</p>
              <button
                onClick={() => onNavigate('log')}
                style={{ marginTop: 4, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                + Add Transaction
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recent.map((tx, i) => {
                const cat = CATEGORIES.find(c => c.id === tx.category);
                const isIncome = tx.amount > 0;
                return (
                  <div key={tx._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < recent.length - 1 ? `1px solid ${C.hoverBg}` : 'none' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${CAT_COLORS[tx.category] ?? '#94a3b8'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                      {cat?.emoji ?? '📦'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tx.description || tx.category}
                      </p>
                      <p style={{ fontSize: 11, color: '#94a3b8' }}>{format(new Date(tx.date), 'MMM d')}</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isIncome ? C.green : C.red, flexShrink: 0 }}>
                      {isIncome ? '+' : '-'}{fmt(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Archetype Hero Card */}
      <div style={{ borderRadius: 16, padding: '20px 24px', background: `${arc.color}22`, borderTop: `1px solid ${arc.color}60`, borderRight: `1px solid ${arc.color}60`, borderBottom: `1px solid ${arc.color}60`, borderLeft: `6px solid ${arc.color}`, boxShadow: `0 4px 16px ${arc.color}20`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', fontSize: 80, opacity: 0.18, pointerEvents: 'none', userSelect: 'none' }}>
          {arc.emoji}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 42, lineHeight: 1 }}>{arc.emoji}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: arc.color, letterSpacing: 1, marginBottom: 3 }}>YOUR ARCHETYPE</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 5 }}>{arc.name}</h2>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{arc.description}</p>
          </div>
        </div>
        {arc.next && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Evolution to {arc.nextName}</span>
              <span style={{ fontSize: 12, color: arc.color, fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: C.hoverBg, borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: arc.color, borderRadius: 3, transition: 'width 1s ease' }} />
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>{arc.tip}</p>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: `${arc.color}20`, border: `1px solid ${arc.color}50`, borderRadius: 20, padding: '6px 12px' }}>
            <span style={{ fontSize: 14 }}>{arc.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: arc.color }}>{arc.name}</span>
          </div>
          <span style={{ fontSize: 12, color: C.muted }}>#{arcIdx + 1} of {ARCHETYPE_ORDER.length} archetypes</span>
          {arc.next && <span style={{ fontSize: 12, color: C.muted }}>· Next: <span style={{ color: C.text, fontWeight: 600 }}>{arc.nextName}</span></span>}
        </div>
      </div>

      {/* Connect Bank */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>🏦</span>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Connect Bank Account</p>
        </div>
        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>
          Link your bank to automatically import transactions. Uses Plaid — your credentials are never stored.
        </p>
        <PlaidLinkButton onSuccess={onRefresh} C={C} />
      </div>
    </div>
  );
}

// ─── Drift Tab ────────────────────────────────────────────────────────────────

function DriftTab({ insights, C }: { insights: Insights | null; C: ReturnType<typeof makeC> }) {
  if (!insights) {
    return <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8' }}>Loading insights...</div>;
  }

  const { insights: topInsights, drift, thisMonthTotals, lastMonthTotals, weekendDiff, dailySpending } = insights;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const key = format(d, 'yyyy-MM-dd');
    return { label: format(d, 'EEE'), key, amount: dailySpending[key] ?? 0 };
  });
  const maxDaily = Math.max(...days.map(d => d.amount), 1);
  const avgDaily = days.reduce((s, d) => s + d.amount, 0) / 7;

  // Only show categories with spend in at least one month
  const cats = Object.keys({ ...thisMonthTotals, ...lastMonthTotals })
    .filter(k => k !== 'income' && ((thisMonthTotals[k] ?? 0) > 0 || (lastMonthTotals[k] ?? 0) > 0));

  const totalSpentThis = Object.entries(thisMonthTotals).filter(([k]) => k !== 'income').reduce((s, [, v]) => s + v, 0);
  const totalSpentLast = Object.entries(lastMonthTotals).filter(([k]) => k !== 'income').reduce((s, [, v]) => s + v, 0);
  const overallDrift = totalSpentLast > 0 ? Math.round(((totalSpentThis - totalSpentLast) / totalSpentLast) * 100) : null;

  const peakDay = days.reduce((best, d) => d.amount > best.amount ? d : best, days[0]);
  const quietDay = days.filter(d => d.amount > 0).reduce((low, d) => d.amount < low.amount ? d : low, days.filter(d => d.amount > 0)[0] ?? days[0]);

  // End-of-month projection
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dailyAvgThisMonth = dayOfMonth > 0 ? totalSpentThis / dayOfMonth : 0;
  const projectedTotal = Math.round(dailyAvgThisMonth * daysInMonth);
  const daysLeft = daysInMonth - dayOfMonth;

  // Cumulative pace: how much had been spent by this day last month
  // Approximate: last month total × (dayOfMonth / daysInLastMonth)
  const daysInLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  const lastMonthPaceAtThisPoint = totalSpentLast > 0 ? Math.round(totalSpentLast * (dayOfMonth / daysInLastMonth)) : 0;

  // Savings rate
  const incomeThis = thisMonthTotals['income'] ?? 0;
  const incomeLast = lastMonthTotals['income'] ?? 0;
  const savingsRateThis = incomeThis > 0 ? Math.round(((incomeThis - totalSpentThis) / incomeThis) * 100) : null;
  const savingsRateLast = incomeLast > 0 ? Math.round(((incomeLast - totalSpentLast) / incomeLast) * 100) : null;

  // Category max for bar scaling
  const catMax = Math.max(...cats.map(c => Math.max(thisMonthTotals[c] ?? 0, lastMonthTotals[c] ?? 0)), 1);

  // Logging streak — count consecutive days with spend going back from today
  const streak = (() => {
    let count = 0;
    for (let i = 0; i < 31; i++) {
      const key = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if ((dailySpending[key] ?? 0) > 0) count++;
      else break;
    }
    return count;
  })();

  const hasNoData = totalSpentThis === 0 && Object.keys(dailySpending).length === 0;

  if (hasNoData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>
        <div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 3, fontWeight: 600, letterSpacing: 0.5 }}>SPENDING DRIFT</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text }}>Drift Report</h1>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '48px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
          <div style={{ fontSize: 40 }}>📉</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>No drift data yet</p>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, maxWidth: 360 }}>
            Log at least a few transactions to start seeing your spending trends, daily patterns, and month-over-month drift.
          </p>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Head to the <strong>Log</strong> tab to add your first transaction.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 3, fontWeight: 600, letterSpacing: 0.5 }}>SPENDING DRIFT</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text }}>Drift Report</h1>
          {/* Headline summary */}
          {totalSpentThis > 0 && (
            <p style={{ fontSize: 14, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>
              You&apos;ve spent{' '}
              <span style={{ color: C.text, fontWeight: 700 }}>{fmt(totalSpentThis)}</span>
              {' '}this month
              {overallDrift !== null && (
                <span style={{ color: overallDrift > 0 ? C.red : C.green, fontWeight: 700 }}>
                  {' '}{overallDrift > 0 ? '↑' : '↓'}{Math.abs(overallDrift)}% vs last month
                </span>
              )}
              .
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '5px 12px' }}>
              <span style={{ fontSize: 13 }}>🔥</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{streak}-day streak</span>
            </div>
          )}
          <div style={{ background: C.hoverBg, border: `1px solid ${C.border}`, borderRadius: 20, padding: '5px 14px', fontSize: 12, color: C.muted, fontWeight: 600 }}>
            {format(subDays(new Date(), 6), 'MMM d')} – {format(new Date(), 'MMM d')}
          </div>
        </div>
      </div>

      {/* Projection + Pace + Savings rate — stat row */}
      {totalSpentThis > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: savingsRateThis !== null ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 14 }}>
          {/* End-of-month projection */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: 0.5, marginBottom: 8 }}>PROJECTED MONTH TOTAL</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: totalSpentLast > 0 && projectedTotal > totalSpentLast ? C.red : C.text }}>
              {fmt(projectedTotal)}
            </p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              {daysLeft} day{daysLeft !== 1 ? 's' : ''} left · avg {fmt(Math.round(dailyAvgThisMonth))}/day
            </p>
            {totalSpentLast > 0 && (
              <p style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: projectedTotal > totalSpentLast ? C.red : C.green }}>
                {projectedTotal > totalSpentLast ? '↑' : '↓'} {Math.abs(Math.round(((projectedTotal - totalSpentLast) / totalSpentLast) * 100))}% vs last month&apos;s {fmt(totalSpentLast)}
              </p>
            )}
          </div>

          {/* Cumulative pace */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: 0.5, marginBottom: 8 }}>PACE vs LAST MONTH</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{fmt(totalSpentThis)}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>by day {dayOfMonth} this month</p>
            {lastMonthPaceAtThisPoint > 0 && (
              <p style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: totalSpentThis > lastMonthPaceAtThisPoint ? C.red : C.green }}>
                {totalSpentThis > lastMonthPaceAtThisPoint ? '↑' : '↓'} {fmt(Math.abs(totalSpentThis - lastMonthPaceAtThisPoint))} {totalSpentThis > lastMonthPaceAtThisPoint ? 'ahead of' : 'behind'} last month&apos;s pace
              </p>
            )}
          </div>

          {/* Savings rate */}
          {savingsRateThis !== null && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: 0.5, marginBottom: 8 }}>SAVINGS RATE</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: savingsRateThis >= 0 ? C.green : C.red }}>
                {savingsRateThis}%
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>of income saved this month</p>
              {savingsRateLast !== null && (
                <p style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: savingsRateThis >= savingsRateLast ? C.green : C.red }}>
                  {savingsRateThis >= savingsRateLast ? '↑' : '↓'} {Math.abs(savingsRateThis - savingsRateLast)}pp vs last month&apos;s {savingsRateLast}%
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Daily Bar Chart — first for context */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Daily Spending — Last 7 Days</p>
          <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: C.green, display: 'inline-block' }} />
              <span style={{ color: C.muted }}>Under avg</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: C.red, display: 'inline-block' }} />
              <span style={{ color: C.muted }}>Over avg</span>
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 36, width: 48, flexShrink: 0 }}>
            {[maxDaily, maxDaily * 0.75, maxDaily * 0.5, maxDaily * 0.25, 0].map((v, i) => (
              <span key={i} style={{ fontSize: 10, color: '#94a3b8', textAlign: 'right', lineHeight: 1 }}>
                {v > 0 ? fmt(Math.round(v)) : '$0'}
              </span>
            ))}
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 36, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ height: 1, background: C.border, opacity: 0.6 }} />
              ))}
            </div>
            {avgDaily > 0 && (
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 36 + ((avgDaily / maxDaily) * 200), height: 1, background: '#f59e0b', borderTop: '1.5px dashed #f59e0b', opacity: 0.7, pointerEvents: 'none', zIndex: 2 }}>
                <span style={{ position: 'absolute', right: 0, top: -18, fontSize: 9, color: '#f59e0b', fontWeight: 700, whiteSpace: 'nowrap' }}>avg {fmt(Math.round(avgDaily))}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 200 }}>
              {days.map(d => {
                const barH = d.amount > 0 ? Math.max(8, (d.amount / maxDaily) * 200) : 4;
                const isToday = d.key === format(new Date(), 'yyyy-MM-dd');
                const isOver = d.amount > avgDaily && d.amount > 0;
                const barColor = isToday ? C.accent : isOver ? C.red : d.amount > 0 ? C.green : C.border;
                return (
                  <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: d.amount > 0 ? (isOver ? C.red : C.green) : 'transparent', marginBottom: 4, whiteSpace: 'nowrap' }}>
                      {d.amount > 0 ? fmt(d.amount) : ''}
                    </span>
                    <div style={{ width: '100%', height: barH, background: d.amount > 0 ? `linear-gradient(to top, ${barColor}cc, ${barColor})` : C.border, borderRadius: '6px 6px 2px 2px', transition: 'height 0.6s ease', boxShadow: d.amount > 0 ? `0 4px 12px ${barColor}40` : 'none' }}
                      title={d.amount > 0 ? `${d.label}: ${fmt(d.amount)}` : `${d.label}: $0`}
                    />
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              {days.map(d => {
                const isToday = d.key === format(new Date(), 'yyyy-MM-dd');
                return (
                  <div key={d.key} style={{ flex: 1, textAlign: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? C.text : C.muted }}>{d.label}</span>
                    {isToday && <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.accent, margin: '3px auto 0' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {days.some(d => d.amount > 0) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.hoverBg}` }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>7-day total: <strong style={{ color: C.text }}>{fmt(days.reduce((s, d) => s + d.amount, 0))}</strong></span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Daily avg: <strong style={{ color: C.text }}>{fmt(Math.round(avgDaily))}</strong></span>
          </div>
        )}
      </div>

      {/* Insight Cards — biggest drifters */}
      {topInsights.length > 0 && (
        <div>
        <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>BIGGEST CHANGES</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {topInsights.map((ins, i) => {
            const catInfo = CATEGORIES.find(c => c.id === ins.category);
            const up = ins.drift > 0;
            return (
              <div key={i} style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, borderLeft: `4px solid ${up ? C.red : C.green}`, borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: up ? C.redDim : C.greenDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {catInfo?.emoji ?? '📦'}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.text, textTransform: 'capitalize' }}>{ins.category}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8' }}>{fmt(ins.thisMonth)} this mo.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: up ? C.red : C.green }}>{up ? '+' : ''}{ins.drift}%</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>vs last month</span>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  {up ? '↑' : '↓'} {fmt(Math.abs(ins.thisMonth - ins.lastMonth))} {up ? 'more' : 'less'}
                </p>
              </div>
            );
          })}
        </div>
        </div>
      )}

      {/* Category comparison — visual paired bars */}
      {cats.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Category Breakdown</p>
            <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: C.accent, display: 'inline-block' }} />
                <span style={{ color: C.muted }}>This month</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: C.muted, display: 'inline-block', opacity: 0.4 }} />
                <span style={{ color: C.muted }}>Last month</span>
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {cats.sort((a, b) => (thisMonthTotals[b] ?? 0) - (thisMonthTotals[a] ?? 0)).map(cat => {
              const t = thisMonthTotals[cat] ?? 0;
              const l = lastMonthTotals[cat] ?? 0;
              const d = drift[cat] ?? 0;
              const catInfo = CATEGORIES.find(c => c.id === cat);
              const thisW = (t / catMax) * 100;
              const lastW = (l / catMax) * 100;
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 14 }}>{catInfo?.emoji ?? '📦'}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textTransform: 'capitalize' }}>{catInfo?.label ?? cat}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: C.muted }}>{fmt(l)}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>→ {fmt(t)}</span>
                      {d !== 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: d > 0 ? C.red : C.green, minWidth: 44, textAlign: 'right' }}>
                          {d > 0 ? '↑' : '↓'}{Math.abs(d)}%
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Stacked bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ height: 7, background: C.hoverBg, borderRadius: 4 }}>
                      <div style={{ height: '100%', width: `${thisW}%`, background: CAT_COLORS[cat] ?? C.accent, borderRadius: 4, transition: 'width 0.7s ease' }} />
                    </div>
                    <div style={{ height: 5, background: C.hoverBg, borderRadius: 4 }}>
                      <div style={{ height: '100%', width: `${lastW}%`, background: CAT_COLORS[cat] ?? C.muted, borderRadius: 4, opacity: 0.35, transition: 'width 0.7s ease' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pattern Cards — Weekend + Peak Day */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 22 }}>📅</span>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Weekend Pattern</p>
          </div>
          {weekendDiff !== 0 ? (
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
              You spend{' '}
              <span style={{ color: weekendDiff > 0 ? C.red : C.green, fontWeight: 700 }}>
                {Math.abs(weekendDiff)}% {weekendDiff > 0 ? 'more' : 'less'}
              </span>{' '}
              on weekends than weekdays.
            </p>
          ) : (
            <p style={{ fontSize: 13, color: '#94a3b8' }}>Log more transactions to detect patterns.</p>
          )}
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 22 }}>📈</span>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Peak Day</p>
          </div>
          {peakDay && peakDay.amount > 0 ? (
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
              Your biggest day this week was{' '}
              <span style={{ color: C.text, fontWeight: 700 }}>{peakDay.label}</span>
              {' '}at{' '}
              <span style={{ color: C.red, fontWeight: 700 }}>{fmt(peakDay.amount)}</span>
              {quietDay && quietDay.key !== peakDay.key && (
                <> — lightest was <span style={{ color: C.text, fontWeight: 700 }}>{quietDay.label}</span> at <span style={{ color: C.green, fontWeight: 700 }}>{fmt(quietDay.amount)}</span></>
              )}
              .
            </p>
          ) : (
            <p style={{ fontSize: 13, color: '#94a3b8' }}>Log transactions this week to see your peak spending day.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Log Tab ──────────────────────────────────────────────────────────────────

function LogTab({ onLogged, budgets, insights, transactions, onNavigate, C }: {
  onLogged: () => void;
  budgets: Budget[];
  insights: Insights | null;
  transactions: Transaction[];
  onNavigate: (tab: string) => void;
  C: ReturnType<typeof makeC>;
}) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('dining');
  const [description, setDescription] = useState('');
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isIncome, setIsIncome] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (res.ok) {
      onLogged();
    } else {
      toast.error('Failed to delete transaction');
    }
  }

  const DESC_SUGGESTIONS: Record<string, string[]> = {
    dining:        ['Lunch', 'Dinner', 'Takeout', 'Restaurant'],
    groceries:     ['Weekly shop', 'Supermarket', 'Corner store', 'Essentials'],
    coffee:        ['Morning coffee', 'Latte', 'Café', 'Espresso'],
    entertainment: ['Movie', 'Concert', 'Streaming', 'Night out'],
    transport:     ['Uber / Lyft', 'Gas', 'Parking', 'Bus / Train'],
    shopping:      ['Clothes', 'Online order', 'Gift', 'Accessories'],
    health:        ['Gym', 'Pharmacy', 'Doctor visit', 'Supplements'],
    travel:        ['Flight', 'Hotel', 'Airbnb', 'Activities'],
    bills:         ['Rent', 'Electricity', 'Internet', 'Phone'],
    other:         ['Miscellaneous', 'ATM / Cash', 'Subscription', 'Other'],
  };

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    const dollars = parseFloat(amount);
    if (!dollars || dollars <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    const cents = Math.round(dollars * 100);
    const finalAmount = isIncome ? cents : -cents;
    setLoading(true);
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: finalAmount, category: isIncome ? 'income' : category, description, date }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error('Failed to log transaction');
      return;
    }

    if (!isIncome) {
      const budget = budgets.find(b => b.category === category);
      if (budget) {
        const thisMonthSpent = (insights?.thisMonthTotals[category] ?? 0) + cents;
        const pct = (thisMonthSpent / budget.limit) * 100;
        if (pct >= 100) {
          toast.error(`🚨 Over budget on ${category}! ${Math.round(pct)}% used`);
        } else if (pct >= 80) {
          toast.warning(`⚠️ ${category} budget ${Math.round(pct)}% used`);
        } else {
          toast.success('Transaction logged!');
        }
      } else {
        toast.success('Transaction logged!');
      }
    } else {
      toast.success('Income logged!');
    }

    setAmount('');
    setDescription('');
    setDate(today);
    setShowDatePicker(false);
    onLogged();
    setTimeout(() => amountRef.current?.focus(), 50);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: C.inputBg,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 15,
    color: C.text,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const recentLogs = transactions.slice(0, 8);
  const archetype = insights?.archetype ?? 'homebody';
  const arc = ARCHETYPES[archetype] ?? ARCHETYPES.homebody;
  const thisMonthTotal = Object.entries(insights?.thisMonthTotals ?? {})
    .filter(([cat]) => cat !== 'income')
    .reduce((s, [, v]) => s + v, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 3, fontWeight: 600, letterSpacing: 0.5 }}>NEW ENTRY</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text }}>Log Transaction</h1>
        </div>
        {thisMonthTotal > 0 && (
          <div style={{ textAlign: 'right', paddingBottom: 2 }}>
            <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 2, letterSpacing: 0.5 }}>THIS MONTH</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.5px' }}>
              ${(thisMonthTotal / 100).toFixed(0)}
            </p>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="log-layout" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

      {/* Form */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <form onSubmit={handleLog} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Expense / Income Toggle */}
          <div style={{
            display: 'flex',
            background: C.hoverBg,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 4,
          }}>
            {[{ label: 'Expense', val: false }, { label: 'Income', val: true }].map(opt => (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  setIsIncome(opt.val);
                  if (!opt.val && category === 'income') setCategory('dining');
                  if (opt.val) setCategory('income');
                }}
                style={{
                  flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  background: isIncome === opt.val
                    ? (opt.val ? C.green : C.red)
                    : 'transparent',
                  color: isIncome === opt.val ? '#ffffff' : C.muted,
                  fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 7 }}>Amount</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                fontSize: 16, color: C.muted, fontWeight: 700, pointerEvents: 'none',
              }}>$</span>
              <input
                ref={amountRef}
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                placeholder="0.00"
                style={{ ...inputStyle, paddingLeft: 30, fontSize: 18, fontWeight: 700 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {[5, 10, 20, 50].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(String(val))}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${amount === String(val) ? C.accent : C.border}`,
                    background: amount === String(val) ? `${C.accent}15` : C.inputBg,
                    color: amount === String(val) ? C.accent : C.muted,
                    fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
                  }}
                >
                  ${val}
                </button>
              ))}
            </div>
          </div>

          {/* Category — visual chip grid (hidden for income) */}
          {!isIncome && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>Category</label>
              <div className="log-cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {CATEGORIES.filter(c => c.id !== 'income').map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    style={{
                      background: category === c.id ? `${CAT_COLORS[c.id] ?? C.accent}12` : C.inputBg,
                      border: `1.5px solid ${category === c.id ? (CAT_COLORS[c.id] ?? C.accent) : C.border}`,
                      borderRadius: 12,
                      padding: '9px 4px 7px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{c.emoji}</span>
                    <span className="log-cat-label" style={{ fontSize: 10, color: category === c.id ? (CAT_COLORS[c.id] ?? C.accent) : C.muted, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
                      {c.label}
                    </span>
                  </button>
                ))}
              </div>
              {/* Live budget bar for selected category */}
              {(() => {
                const budget = budgets.find(b => b.category === category);
                if (!budget) return null;
                const spent = insights?.thisMonthTotals[category] ?? 0;
                const pct = Math.min((spent / budget.limit) * 100, 100);
                const barColor = pct >= 100 ? C.red : pct >= 80 ? C.amber : C.green;
                const catLabel = CATEGORIES.find(c => c.id === category)?.label ?? category;
                return (
                  <div style={{ marginTop: 12, padding: '10px 12px', background: C.hoverBg, borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{catLabel} this month</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: barColor }}>
                        ${(spent / 100).toFixed(0)} / ${(budget.limit / 100).toFixed(0)}
                      </span>
                    </div>
                    <div style={{ height: 4, background: C.border, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width 0.4s ease' }} />
                    </div>
                    {pct >= 80 && (
                      <p style={{ fontSize: 10, color: barColor, fontWeight: 600, marginTop: 5 }}>
                        {pct >= 100 ? '🚨 Over budget' : `⚠️ ${Math.round(pct)}% used — ${Math.round(100 - pct)}% remaining`}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 7 }}>
              Description <span style={{ color: C.muted, fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What was this for?"
              style={inputStyle}
            />
            {!isIncome && (DESC_SUGGESTIONS[category] ?? []).length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {(DESC_SUGGESTIONS[category] ?? []).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDescription(s)}
                    style={{
                      padding: '4px 10px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      border: `1px solid ${description === s ? C.accent : C.border}`,
                      background: description === s ? `${C.accent}15` : C.inputBg,
                      color: description === s ? C.accent : C.muted,
                      transition: 'all 0.15s',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            {!showDatePicker && date === today ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>
                  📅 Today — {format(new Date(), 'MMM d, yyyy')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.accent, fontWeight: 700, padding: 0 }}
                >
                  Change date →
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Date</label>
                  {date !== today && (
                    <button
                      type="button"
                      onClick={() => { setDate(today); setShowDatePicker(false); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.muted, fontWeight: 600, padding: 0 }}
                    >
                      ← Back to today
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? C.muted : C.accent,
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              padding: '14px',
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Logging...' : `Log ${isIncome ? 'Income' : 'Expense'}`}
          </button>
        </form>
      </div>

      {/* Right Panel */}
      <div className="log-right-panel" style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Archetype Tip */}
        <div style={{
          background: `${arc.color}12`,
          borderTop: `1px solid ${arc.color}40`,
          borderRight: `1px solid ${arc.color}40`,
          borderBottom: `1px solid ${arc.color}40`,
          borderLeft: `4px solid ${arc.color}`,
          borderRadius: 16,
          padding: '18px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 24 }}>{arc.emoji}</span>
            <div>
              <p style={{ fontSize: 10, color: arc.color, fontWeight: 700, letterSpacing: 1, marginBottom: 2 }}>YOUR ARCHETYPE</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{arc.name}</p>
            </div>
          </div>
          <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, marginBottom: 12 }}>{arc.description}</p>
          <div style={{ background: `${arc.color}18`, borderRadius: 10, padding: '10px 14px' }}>
            <p style={{ fontSize: 11, color: arc.color, fontWeight: 700, marginBottom: 4 }}>💡 TIP TO EVOLVE</p>
            <p style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{arc.tip}</p>
          </div>
        </div>

        {/* Connect Bank — compact nudge */}
        <div style={{
          border: `1px dashed ${C.border}`,
          borderRadius: 14,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🏦</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Skip the manual entry</p>
              <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>Connect your bank to auto-import transactions via Plaid.</p>
            </div>
          </div>
          <PlaidLinkButton onSuccess={onLogged} C={C} />
        </div>

        {/* Recent Logs */}
        {recentLogs.length > 0 && (
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Recent Logs</p>
              <button
                type="button"
                onClick={() => onNavigate('overview')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: C.accent, fontWeight: 700, padding: 0 }}
              >
                See all →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentLogs.map((tx, i) => {
                const cat = CATEGORIES.find(c => c.id === tx.category);
                const isIncomeTx = tx.amount > 0;
                const isDeleting = deletingId === tx._id;
                return (
                  <div key={tx._id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 0',
                    borderBottom: i < recentLogs.length - 1 ? `1px solid ${C.hoverBg}` : 'none',
                    opacity: isDeleting ? 0.4 : 1,
                    transition: 'opacity 0.2s',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9,
                      background: `${CAT_COLORS[tx.category] ?? '#94a3b8'}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, flexShrink: 0,
                    }}>
                      {cat?.emoji ?? '📦'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tx.description || tx.category}
                      </p>
                      <p style={{ fontSize: 10, color: C.muted }}>{format(new Date(tx.date), 'MMM d')}</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isIncomeTx ? C.green : C.red, flexShrink: 0 }}>
                      {isIncomeTx ? '+' : '-'}{fmt(tx.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(tx._id)}
                      disabled={isDeleting}
                      title="Delete transaction"
                      style={{
                        background: 'none', border: 'none', cursor: isDeleting ? 'not-allowed' : 'pointer',
                        color: C.muted, fontSize: 14, padding: '2px 4px', lineHeight: 1,
                        borderRadius: 4, flexShrink: 0, transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => { if (!isDeleting) (e.currentTarget as HTMLButtonElement).style.color = '#dc2626'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = C.muted; }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab({ userName, userEmail, userCreatedAt, transactions, insights, budgets, onRefresh, C }: {
  userName: string;
  userEmail: string;
  userCreatedAt: string | null;
  transactions: Transaction[];
  insights: Insights | null;
  budgets: Budget[];
  onRefresh: () => void;
  C: ReturnType<typeof makeC>;
}) {
  const archetype = insights?.archetype ?? 'homebody';
  const arc = ARCHETYPES[archetype] ?? ARCHETYPES.homebody;
  const arcIdx = ARCHETYPE_ORDER.indexOf(archetype);

  const profileRouter = useRouter();

  // Budget editing state
  const [budgetValues, setBudgetValues] = useState<Record<string, string>>(
    Object.fromEntries(budgets.map(b => [b.category, String((b.limit / 100).toFixed(0))]))
  );
  const [savingBudget, setSavingBudget] = useState<string | null>(null);

  async function handleBudgetSave(category: string) {
    const dollars = parseFloat(budgetValues[category] ?? '0');
    if (!dollars || dollars <= 0) return;
    setSavingBudget(category);
    await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, limit: Math.round(dollars * 100) }),
    });
    setSavingBudget(null);
    toast.success(`${category} budget updated`);
    onRefresh();
  }

  let streak = 0;
  if (transactions.length > 0) {
    const txDates = new Set(transactions.map(tx => format(new Date(tx.date), 'yyyy-MM-dd')));
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let check = txDates.has(todayStr) ? new Date() : subDays(new Date(), 1);
    while (txDates.has(format(check, 'yyyy-MM-dd'))) {
      streak++;
      check = subDays(check, 1);
    }
  }

  const thisMonthTotal = Object.values(insights?.thisMonthTotals ?? {}).reduce((s, v) => s + v, 0);
  const lastMonthTotal = Object.values(insights?.lastMonthTotals ?? {}).reduce((s, v) => s + v, 0);
  const savedVsLast = lastMonthTotal - thisMonthTotal;
  const catsTracked = Object.keys(insights?.thisMonthTotals ?? {}).length;

  const now = new Date();
  const thisMonthIncome = transactions
    .filter(tx => { const d = new Date(tx.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && tx.amount > 0; })
    .reduce((s, tx) => s + tx.amount, 0);

  const topCategories = Object.entries(insights?.thisMonthTotals ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const biggestExpense = transactions.filter(tx => tx.amount < 0).sort((a, b) => a.amount - b.amount)[0] ?? null;

  const lastMonthArchetype = insights?.lastMonthTotals ? computeArchetype(insights.lastMonthTotals) : null;
  const lastArc = lastMonthArchetype ? (ARCHETYPES[lastMonthArchetype] ?? null) : null;

  // Money Story
  const thisMonthTxs = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const topCat = topCategories[0];
  const topCatInfo = topCat ? CATEGORIES.find(c => c.id === topCat[0]) : null;
  const topCatPct = topCat && thisMonthTotal > 0 ? Math.round((topCat[1] / thisMonthTotal) * 100) : 0;
  const spendDiff = thisMonthTotal - lastMonthTotal;
  const moneyStory = [
    `This month you were ${arc.name} ${arc.emoji}.`,
    topCat && topCatInfo ? `${topCatInfo.label} made up ${topCatPct}% of your spending.` : '',
    spendDiff > 0
      ? `You spent ${fmt(spendDiff)} more than last month — your habits are drifting.`
      : spendDiff < 0
      ? `You spent ${fmt(Math.abs(spendDiff))} less than last month. Nice work.`
      : transactions.length > 0 ? `Your spending matched last month exactly.` : '',
  ].filter(Boolean).join(' ');

  // Fun Stats
  const avgTx = thisMonthTxs.filter(tx => tx.amount < 0).length > 0
    ? thisMonthTotal / thisMonthTxs.filter(tx => tx.amount < 0).length
    : 0;
  const dayTotals: Record<string, number> = {};
  thisMonthTxs.filter(tx => tx.amount < 0).forEach(tx => {
    const day = new Date(tx.date).toLocaleDateString('en-US', { weekday: 'long' });
    dayTotals[day] = (dayTotals[day] ?? 0) + Math.abs(tx.amount);
  });
  const busiestDay = Object.entries(dayTotals).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
  const expenseTxCount = thisMonthTxs.filter(tx => tx.amount < 0).length;
  const funStats = [
    expenseTxCount > 0 ? { emoji: '🧾', stat: `${expenseTxCount} purchases`, desc: 'logged this month' } : null,
    avgTx > 0 ? { emoji: '📐', stat: fmt(Math.round(avgTx)), desc: 'average transaction' } : null,
    busiestDay ? { emoji: '📅', stat: busiestDay, desc: 'your biggest spending day' } : null,
    catsTracked > 0 ? { emoji: '🗂️', stat: `${catsTracked} categories`, desc: 'tracked this month' } : null,
    insights?.weekendDiff !== undefined && insights.weekendDiff !== 0
      ? { emoji: '🌙', stat: insights.weekendDiff > 0 ? 'Weekend spender' : 'Weekday spender', desc: `${Math.abs(insights.weekendDiff)}% more on ${insights.weekendDiff > 0 ? 'weekends' : 'weekdays'}` }
      : null,
  ].filter(Boolean) as { emoji: string; stat: string; desc: string }[];

  const txWithDesc   = transactions.filter(tx => tx.description && tx.description.trim().length > 0).length;
  const budgetsSet   = budgets.filter(b => b.limit > 0).length;
  const hasIncome    = transactions.some(tx => tx.amount > 0);
  const hasTravelSpend = transactions.some(tx => tx.category === 'travel' && tx.amount < 0);
  const biggestSingle = Math.max(...transactions.filter(tx => tx.amount < 0).map(tx => Math.abs(tx.amount)), 0);
  const uniqueMonths  = new Set(transactions.map(tx => format(new Date(tx.date), 'yyyy-MM'))).size;

  const badges: { emoji: string; label: string; desc: string; earned: boolean; progress: number; total: number }[] = [
    // Logging milestones
    { emoji: '🎯', label: 'First Log',        desc: 'Log your first transaction',      earned: transactions.length >= 1,   progress: Math.min(transactions.length, 1),   total: 1 },
    { emoji: '📊', label: 'Data Nerd',         desc: 'Log 20 transactions',             earned: transactions.length >= 20,  progress: Math.min(transactions.length, 20),  total: 20 },
    { emoji: '🏅', label: 'Half Century',      desc: 'Log 50 transactions',             earned: transactions.length >= 50,  progress: Math.min(transactions.length, 50),  total: 50 },
    { emoji: '💎', label: 'Century Club',      desc: 'Log 100 transactions',            earned: transactions.length >= 100, progress: Math.min(transactions.length, 100), total: 100 },
    // Streaks
    { emoji: '🔥', label: 'On a Roll',         desc: '7-day tracking streak',           earned: streak >= 7,                progress: Math.min(streak, 7),                total: 7 },
    { emoji: '🔄', label: 'Committed',         desc: '30-day tracking streak',          earned: streak >= 30,               progress: Math.min(streak, 30),               total: 30 },
    // Categories & breadth
    { emoji: '🌈', label: 'Category Explorer', desc: 'Spend across 5 categories',      earned: catsTracked >= 5,           progress: Math.min(catsTracked, 5),           total: 5 },
    { emoji: '🌍', label: 'Globe Trotter',     desc: 'Log a travel expense',            earned: hasTravelSpend,             progress: hasTravelSpend ? 1 : 0,             total: 1 },
    // Income & savings
    { emoji: '💰', label: 'Income Tracker',    desc: 'Log your first income',           earned: hasIncome,                  progress: hasIncome ? 1 : 0,                  total: 1 },
    { emoji: '💚', label: 'Power Saver',       desc: 'Spend less than last month',      earned: savedVsLast > 0,            progress: savedVsLast > 0 ? 1 : 0,           total: 1 },
    // Quality & budgets
    { emoji: '📝', label: 'Storyteller',       desc: 'Add descriptions to 10 logs',    earned: txWithDesc >= 10,           progress: Math.min(txWithDesc, 10),           total: 10 },
    { emoji: '🏦', label: 'Budget Boss',       desc: 'Set budgets for 3 categories',   earned: budgetsSet >= 3,            progress: Math.min(budgetsSet, 3),            total: 3 },
    // Archetype & personality
    { emoji: '✨', label: 'Identity Found',    desc: 'Earn your spending archetype',    earned: !!insights,                 progress: insights ? 1 : 0,                   total: 1 },
    { emoji: '🎭', label: 'Shape Shifter',     desc: 'Change archetype month-to-month', earned: !!lastArc && lastMonthArchetype !== archetype, progress: (!!lastArc && lastMonthArchetype !== archetype) ? 1 : 0, total: 1 },
    // Spending patterns
    { emoji: '💸', label: 'Big Spender',       desc: 'Single transaction over $100',   earned: biggestSingle >= 10000,     progress: biggestSingle >= 10000 ? 1 : 0,     total: 1 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 3, fontWeight: 600, letterSpacing: 0.5 }}>ACCOUNT</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text }}>Profile</h1>
        </div>
        <button
          onClick={() => profileRouter.push('/settings')}
          style={{
            background: 'none', border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            color: C.muted, transition: 'all 0.15s', marginBottom: 2,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.text; (e.currentTarget as HTMLButtonElement).style.borderColor = C.text; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = C.muted; (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
        >
          ⚙ Settings
        </button>
      </div>

      {/* Left-right layout on desktop */}
      <div className="profile-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* User card */}
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(22,163,74,0.1)',
                border: '2px solid #16a34a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, color: '#16a34a',
                flexShrink: 0,
              }}>
                {userName?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 3 }}>{userName}</h2>
                <p style={{ fontSize: 13, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</p>
                {userCreatedAt && (
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                    Member since {format(new Date(userCreatedAt), 'MMM yyyy')}
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{
                flex: 1, background: C.stripeBg, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '10px 12px', textAlign: 'center',
              }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{streak}</p>
                <p style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginTop: 2 }}>DAY STREAK 🔥</p>
              </div>
              <div style={{
                flex: 1, background: C.stripeBg, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '10px 12px', textAlign: 'center',
              }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{transactions.length}</p>
                <p style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginTop: 2 }}>TRANSACTIONS</p>
              </div>
            </div>
            {/* 7-day habit tracker */}
            {(() => {
              const txDateSet = new Set(transactions.map(tx => format(new Date(tx.date), 'yyyy-MM-dd')));
              const days = Array.from({ length: 7 }, (_, i) => {
                const d = subDays(new Date(), 6 - i);
                return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE'), isToday: i === 6 };
              });
              return (
                <div>
                  <p style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: 0.5, marginBottom: 8 }}>LAST 7 DAYS</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {days.map(day => (
                      <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                        <div style={{
                          width: '100%', aspectRatio: '1', borderRadius: 7,
                          background: txDateSet.has(day.date) ? C.green : C.hoverBg,
                          border: `1.5px solid ${txDateSet.has(day.date) ? C.green : C.border}`,
                          boxShadow: txDateSet.has(day.date) ? `0 0 6px ${C.green}50` : 'none',
                        }} />
                        <span style={{ fontSize: 9, color: day.isToday ? C.text : C.muted, fontWeight: day.isToday ? 700 : 400 }}>
                          {day.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Archetype card */}
          <div style={{
            background: `${arc.color}22`,
            borderTop: `1px solid ${arc.color}60`,
            borderRight: `1px solid ${arc.color}60`,
            borderBottom: `1px solid ${arc.color}60`,
            borderLeft: `6px solid ${arc.color}`,
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: `0 4px 16px ${arc.color}20`,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Watermark */}
            <div style={{
              position: 'absolute', right: 16, top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 64, opacity: 0.18, pointerEvents: 'none',
              userSelect: 'none',
            }}>
              {arc.emoji}
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: arc.color, letterSpacing: 1, marginBottom: 10 }}>CURRENT ARCHETYPE</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 38 }}>{arc.emoji}</span>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 3 }}>{arc.name}</h3>
                <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{arc.tip}</p>
              </div>
            </div>
          </div>

          {/* Evolution path */}
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>Archetype Path</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              {ARCHETYPE_ORDER.map((key, i) => {
                const a = ARCHETYPES[key];
                const isActive = key === archetype;
                const isPast = i < arcIdx;
                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: isActive ? `${a.color}20` : isPast ? C.hoverBg : C.stripeBg,
                      border: `2px solid ${isActive ? a.color : isPast ? '#cbd5e1' : C.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15,
                      boxShadow: isActive ? `0 0 8px ${a.color}60` : 'none',
                    }}>
                      {a.emoji}
                    </div>
                    <span style={{ fontSize: 9, color: isActive ? a.color : '#94a3b8', fontWeight: isActive ? 700 : 400, textAlign: 'center', lineHeight: 1.3 }}>
                      {a.name.replace('The ', '')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Archetype History */}
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Archetype History</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {lastArc ? (
                <>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{lastArc.emoji}</div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: lastArc.color }}>{lastArc.name}</p>
                    <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Last Month</p>
                  </div>
                  <div style={{ fontSize: 18, color: C.muted }}>→</div>
                </>
              ) : (
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>❓</div>
                  <p style={{ fontSize: 11, color: C.muted }}>No data yet</p>
                  <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Last Month</p>
                </div>
              )}
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>{arc.emoji}</div>
                <p style={{ fontSize: 11, fontWeight: 700, color: arc.color }}>{arc.name}</p>
                <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>This Month</p>
              </div>
            </div>
            {lastArc && lastMonthArchetype !== archetype && (
              <p style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginTop: 12, textAlign: 'center' }}>
                You evolved this month! 🎉
              </p>
            )}
            {lastArc && lastMonthArchetype === archetype && (
              <p style={{ fontSize: 11, color: C.muted, marginTop: 12, textAlign: 'center' }}>
                Consistent archetype — keep going.
              </p>
            )}
          </div>

          {/* Share + Next Badge */}
          <div style={{ display: 'flex', gap: 12 }}>
            <ShareArchetypeCard arc={arc} C={C} />
            <NextBadgeCard badges={badges} C={C} />
          </div>

        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stats grid */}
          <div className="profile-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Spent This Month', value: fmt(thisMonthTotal), color: C.red },
              { label: 'vs Last Month', value: savedVsLast >= 0 ? `${fmt(savedVsLast)} saved` : `${fmt(Math.abs(savedVsLast))} more`, color: savedVsLast >= 0 ? C.green : C.red },
              { label: 'Transactions', value: transactions.length.toString(), color: C.text },
              { label: 'Categories', value: catsTracked.toString(), color: '#7c3aed' },
            ].map(s => (
              <div key={s.label} style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>{s.label.toUpperCase()}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Income vs Expenses Bar */}
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Income vs Expenses</p>
            {(() => {
              const total = thisMonthIncome + thisMonthTotal;
              const incomePct = total > 0 ? (thisMonthIncome / total) * 100 : 50;
              const expensePct = 100 - incomePct;
              return (
                <>
                  <div style={{ display: 'flex', height: 12, borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ width: `${incomePct}%`, background: '#16a34a', transition: 'width 0.6s ease' }} />
                    <div style={{ width: `${expensePct}%`, background: '#ef4444', transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
                      <span style={{ fontSize: 12, color: C.muted }}>Income <span style={{ fontWeight: 700, color: '#16a34a' }}>{fmt(thisMonthIncome)}</span></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                      <span style={{ fontSize: 12, color: C.muted }}>Spent <span style={{ fontWeight: 700, color: '#ef4444' }}>{fmt(thisMonthTotal)}</span></span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Top Spending Categories */}
          {topCategories.length > 0 && (
            <div style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Top Categories This Month</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topCategories.map(([cat, amt], i) => {
                  const catInfo = CATEGORIES.find(c => c.id === cat);
                  const color = CAT_COLORS[cat] ?? '#94a3b8';
                  const pct = thisMonthTotal > 0 ? (amt / thisMonthTotal) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>
                          {catInfo?.emoji} {catInfo?.label ?? cat}
                        </span>
                        <span style={{ fontSize: 12, color: C.muted }}>{fmt(amt)} · {Math.round(pct)}%</span>
                      </div>
                      <div style={{ height: 6, background: C.hoverBg, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Biggest Single Expense */}
          {biggestExpense && (
            <div style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Biggest Expense</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${CAT_COLORS[biggestExpense.category] ?? '#94a3b8'}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
                }}>
                  {CATEGORIES.find(c => c.id === biggestExpense.category)?.emoji ?? '📦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {biggestExpense.description || biggestExpense.category}
                  </p>
                  <p style={{ fontSize: 11, color: C.muted }}>{format(new Date(biggestExpense.date), 'MMM d, yyyy')}</p>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#ef4444', flexShrink: 0 }}>
                  -{fmt(Math.abs(biggestExpense.amount))}
                </span>
              </div>
            </div>
          )}

          {/* Month at a Glance */}
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 14 }}>MONTH AT A GLANCE</p>
            <div className="profile-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Total Spent', value: fmt(thisMonthTotal), color: C.red },
                { label: 'Net', value: (() => { const net = thisMonthIncome - thisMonthTotal; return `${net >= 0 ? '+' : '-'}${fmt(Math.abs(net))}`; })(), color: thisMonthIncome >= thisMonthTotal ? C.green : C.red },
                { label: 'Purchases', value: `${expenseTxCount}`, color: C.text },
                { label: 'Peak Day', value: busiestDay ?? '—', color: C.amber },
              ].map(s => (
                <div key={s.label} style={{
                  background: C.hoverBg, borderRadius: 10, padding: '10px 12px',
                }}>
                  <p style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginBottom: 4, letterSpacing: 0.5 }}>{s.label.toUpperCase()}</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: s.color, letterSpacing: '-0.3px' }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Management */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16 }}>Monthly Budgets</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CATEGORIES.filter(c => c.id !== 'income').map(cat => {
                const color = CAT_COLORS[cat.id] ?? C.muted;
                const spent = insights?.thisMonthTotals[cat.id] ?? 0;
                const limitDollars = budgetValues[cat.id] ?? '';
                const limitCents = parseFloat(limitDollars) * 100 || 0;
                const pct = limitCents > 0 ? Math.min((spent / limitCents) * 100, 100) : 0;
                const barColor = pct >= 100 ? C.red : pct >= 80 ? C.amber : C.green;
                return (
                  <div key={cat.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 15 }}>{cat.emoji}</span>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: C.text }}>{cat.label}</span>
                      <span style={{ fontSize: 11, color: C.muted, marginRight: 4 }}>${(spent / 100).toFixed(0)} spent</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 12, color: C.muted }}>$</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={limitDollars}
                          onChange={e => setBudgetValues(v => ({ ...v, [cat.id]: e.target.value }))}
                          onBlur={() => { if (limitDollars) handleBudgetSave(cat.id); }}
                          onKeyDown={e => { if (e.key === 'Enter') { (e.currentTarget as HTMLInputElement).blur(); } }}
                          placeholder="—"
                          style={{ width: 56, background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 6px', fontSize: 12, color: C.text, outline: 'none', textAlign: 'right' }}
                        />
                        {savingBudget === cat.id && <span style={{ fontSize: 10, color: C.muted }}>...</span>}
                      </div>
                    </div>
                    {limitCents > 0 && (
                      <div style={{ height: 3, background: C.border, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width 0.4s ease' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 12 }}>Tab or press Enter to save a budget limit.</p>
          </div>
        </div>
      </div>

      {/* Spending Heatmap */}
      {(() => {
        const WEEKS = 14;
        const today = new Date();
        // Align to Sunday so grid starts on a full week boundary
        const startOffset = today.getDay(); // 0=Sun
        const gridStart = subDays(today, WEEKS * 7 - 1 + startOffset);

        // Build a map: date-string → total abs spend
        const daySpend: Record<string, number> = {};
        transactions.filter(tx => tx.amount < 0).forEach(tx => {
          const key = format(new Date(tx.date), 'yyyy-MM-dd');
          daySpend[key] = (daySpend[key] ?? 0) + Math.abs(tx.amount);
        });

        const maxSpend = Math.max(...Object.values(daySpend), 1);

        // Build grid: array of WEEKS columns, each with 7 day cells
        const totalDays = WEEKS * 7;
        const cells = Array.from({ length: totalDays }, (_, i) => {
          const d = subDays(today, totalDays - 1 - i + (today.getDay() === 6 ? 0 : today.getDay() + 1) % 7);
          // Simpler: just go day by day from gridStart
          const day = new Date(gridStart);
          day.setDate(gridStart.getDate() + i);
          const key = format(day, 'yyyy-MM-dd');
          const spend = daySpend[key] ?? 0;
          const isFuture = day > today;
          return { key, spend, isFuture, label: format(day, 'MMM d') };
        });

        // Week columns
        const weeks: typeof cells[] = [];
        for (let w = 0; w < WEEKS; w++) weeks.push(cells.slice(w * 7, w * 7 + 7));

        function cellColor(spend: number, isFuture: boolean) {
          if (isFuture) return 'transparent';
          if (spend === 0) return C.hoverBg;
          const intensity = spend / maxSpend;
          if (intensity < 0.25) return C.isDark ? '#14532d' : '#bbf7d0';
          if (intensity < 0.5)  return C.isDark ? '#166534' : '#4ade80';
          if (intensity < 0.75) return C.isDark ? '#15803d' : '#22c55e';
          return C.isDark ? '#16a34a' : '#15803d';
        }

        const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

        // Month labels: track month changes across weeks
        const weekMonths = weeks.map((week, wi) => {
          const idx = wi * 7;
          const d = new Date(gridStart);
          d.setDate(gridStart.getDate() + idx);
          return { month: d.getMonth(), label: format(d, 'MMM') };
        });
        const monthLabelRow: (string | null)[] = weekMonths.map((w, i) =>
          i === 0 || w.month !== weekMonths[i - 1].month ? w.label : null
        );

        return (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Spending Activity</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: C.muted }}>Less</span>
                {[C.hoverBg, C.isDark ? '#14532d' : '#bbf7d0', C.isDark ? '#166534' : '#4ade80', C.isDark ? '#15803d' : '#22c55e', C.isDark ? '#16a34a' : '#15803d'].map((col, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: col, border: `1px solid ${C.border}` }} />
                ))}
                <span style={{ fontSize: 10, color: C.muted }}>More</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {/* Day-of-week labels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 4, paddingTop: 18 }}>
                {DOW_LABELS.map((l, i) => (
                  <div key={i} style={{ width: 10, height: 10, fontSize: 8, color: C.muted, lineHeight: '10px', textAlign: 'center' }}>{i % 2 === 1 ? l : ''}</div>
                ))}
              </div>
              {/* Week columns */}
              <div style={{ flex: 1, overflowX: 'auto' }}>
                <div style={{ display: 'flex', gap: 3, minWidth: 0 }}>
                  {weeks.map((week, wi) => (
                    <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: '0 0 auto' }}>
                      <div style={{ height: 14, fontSize: 9, color: C.muted, whiteSpace: 'nowrap', overflow: 'visible' }}>
                        {monthLabelRow[wi] ?? ''}
                      </div>
                      {week.map((cell, di) => (
                        <div
                          key={cell.key}
                          title={cell.isFuture ? '' : `${cell.label}: ${cell.spend > 0 ? fmt(cell.spend) : 'no spend'}`}
                          style={{
                            width: 13, height: 13, borderRadius: 3,
                            background: cellColor(cell.spend, cell.isFuture),
                            border: cell.isFuture ? 'none' : `1px solid ${cell.spend > 0 ? 'transparent' : C.border}`,
                            cursor: cell.spend > 0 ? 'default' : 'default',
                            transition: 'transform 0.1s',
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Badges */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Achievements</p>
          <p style={{ fontSize: 12, color: C.muted }}>{badges.filter(b => b.earned).length} / {badges.length} earned</p>
        </div>
        <div className="profile-badges-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {badges.map(b => {
            const pct = b.total > 0 ? Math.round((b.progress / b.total) * 100) : 0;
            return (
              <div key={b.label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '14px 8px',
                borderRadius: 14,
                background: b.earned ? 'rgba(22,163,74,0.06)' : C.stripeBg,
                border: `1px solid ${b.earned ? 'rgba(22,163,74,0.2)' : C.border}`,
                transition: 'all 0.2s',
                position: 'relative',
              }}>
                {b.earned && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 14, height: 14, borderRadius: '50%',
                    background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, color: '#fff', fontWeight: 700,
                  }}>✓</div>
                )}
                <span style={{ fontSize: 26, filter: b.earned ? 'none' : 'grayscale(1)', opacity: b.earned ? 1 : 0.5 }}>{b.emoji}</span>
                <p style={{ fontSize: 11, fontWeight: 700, color: b.earned ? C.text : C.muted, textAlign: 'center', lineHeight: 1.3 }}>{b.label}</p>
                <p style={{ fontSize: 10, color: C.muted, textAlign: 'center', lineHeight: 1.4 }}>{b.desc}</p>
                {!b.earned && b.total > 1 && (
                  <div style={{ width: '100%', marginTop: 2 }}>
                    <div style={{ height: 3, background: C.border, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: C.accent, borderRadius: 4, transition: 'width 0.4s ease' }} />
                    </div>
                    <p style={{ fontSize: 9, color: C.muted, textAlign: 'center', marginTop: 3 }}>{b.progress} / {b.total}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Two-column: Money Story + Fun Stats */}
      <div className="profile-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Your Money Story */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 18 }}>📖</span>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Your Money Story</p>
          </div>
          {moneyStory ? (
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.9 }}>{moneyStory}</p>
          ) : (
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>Log some transactions this month and your story will appear here.</p>
          )}
          {arc.nextName && (
            <div style={{
              marginTop: 14,
              padding: '10px 14px',
              background: `${arc.color}10`,
              borderRadius: 10,
              borderLeft: `3px solid ${arc.color}`,
            }}>
              <p style={{ fontSize: 12, color: arc.color, fontWeight: 600 }}>
                Next chapter: evolve into {arc.nextName} {arc.next ? ARCHETYPES[arc.next]?.emoji : ''}
              </p>
            </div>
          )}
        </div>

        {/* Fun Stats */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Fun Stats</p>
          </div>
          {funStats.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {funStats.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px',
                  background: C.stripeBg,
                  borderRadius: 10,
                }}>
                  <span style={{ fontSize: 20 }}>{s.emoji}</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{s.stat}</p>
                    <p style={{ fontSize: 11, color: C.muted }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>Log transactions this month to see your fun stats.</p>
          )}
        </div>

      </div>

    </div>
  );
}

// ─── Share Archetype Card ─────────────────────────────────────────────────────

function ShareArchetypeCard({ arc, C }: { arc: typeof ARCHETYPES[string]; C: ReturnType<typeof makeC> }) {
  const [copied, setCopied] = useState(false);
  const text = `I'm ${arc.name} ${arc.emoji} on Spendrift — my spending personality tracker. What's yours?`;
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{
      background: `${arc.color}12`,
      borderTop: `1px solid ${arc.color}30`,
      borderRight: `1px solid ${arc.color}30`,
      borderBottom: `1px solid ${arc.color}30`,
      borderLeft: `3px solid ${arc.color}`,
      borderRadius: 14,
      padding: '14px',
      flex: 1,
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: arc.color, letterSpacing: 1, marginBottom: 8 }}>SHARE</p>
      <p style={{ fontSize: 22, marginBottom: 6 }}>{arc.emoji}</p>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 4, lineHeight: 1.3 }}>{arc.name}</p>
      <p style={{ fontSize: 10, color: C.muted, lineHeight: 1.5, marginBottom: 10 }}>Share your spending personality</p>
      <button
        onClick={handleCopy}
        style={{
          width: '100%', padding: '8px', borderRadius: 8, border: `1px solid ${arc.color}50`,
          background: copied ? `${arc.color}20` : 'transparent',
          color: arc.color, fontSize: 11, fontWeight: 700, cursor: 'pointer',
        }}
      >
        {copied ? '✓ Copied!' : '📋 Copy'}
      </button>
    </div>
  );
}

// ─── Next Badge Card ──────────────────────────────────────────────────────────

function NextBadgeCard({ badges, C }: { badges: { emoji: string; label: string; desc: string; earned: boolean }[]; C: ReturnType<typeof makeC> }) {
  const next = badges.find(b => !b.earned) ?? null;
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '14px',
      flex: 1,
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 8 }}>NEXT BADGE</p>
      {next ? (
        <>
          <p style={{ fontSize: 22, marginBottom: 6, filter: 'grayscale(1)', opacity: 0.5 }}>{next.emoji}</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 4, lineHeight: 1.3 }}>{next.label}</p>
          <p style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>{next.desc}</p>
        </>
      ) : (
        <>
          <p style={{ fontSize: 22, marginBottom: 6 }}>🏆</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 4 }}>All earned!</p>
          <p style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>You've unlocked every badge.</p>
        </>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'drift', label: 'Drift Report', icon: '〜' },
  { id: 'log', label: 'Log Expense', icon: '➕' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

function Sidebar({ activeTab, setActiveTab, userName, userEmail, C, toggle, isDark }: {
  activeTab: string;
  setActiveTab: (t: string) => void;
  userName: string;
  userEmail: string;
  C: ReturnType<typeof makeC>;
  toggle: () => void;
  isDark: boolean;
}) {
  return (
    <div className="sidebar" style={{
      width: 240,
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      background: C.sidebarBg,
      borderRight: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 8, paddingLeft: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
          <span style={{ color: C.text }}>Spen</span>
          <span style={{ color: '#16a34a' }}>Drift</span>
        </span>
      </div>

      <div style={{ height: 1, background: C.border, margin: '16px 0' }} />

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                background: isActive ? C.accent : 'transparent',
                color: isActive ? C.accentText : C.muted,
                fontWeight: isActive ? 700 : 500,
                fontSize: 14,
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* User + sign out at bottom */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
        <div style={{ marginBottom: 10, paddingLeft: 4 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</p>
          <p style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</p>
        </div>
        {/* Theme toggle button */}
        <button
          onClick={toggle}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '10px 14px',
            background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 10, cursor: 'pointer',
            color: C.muted, fontSize: 13, fontWeight: 600,
            marginBottom: 8,
          }}
        >
          {isDark ? '☀️ Light mode' : '🌙 Dark mode'}
        </button>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          style={{
            width: '100%',
            background: 'transparent',
            border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: 10,
            padding: '9px 14px',
            color: '#dc2626',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>↩</span> Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  const C = makeC(isDark);

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchData = useCallback(async () => {
    try {
      const [txRes, bRes, iRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/budgets'),
        fetch('/api/insights'),
      ]);
      if (txRes.ok) setTransactions(await txRes.json());
      if (bRes.ok) setBudgets(await bRes.json());
      if (iRes.ok) setInsights(await iRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') fetchData();
  }, [status, fetchData]);

  if (status === 'loading' || loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>
            <span style={{ color: C.text, fontWeight: 800 }}>Spen</span>
            <span style={{ color: '#16a34a', fontWeight: 800 }}>Drift</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading your financial data...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const userName = session.user?.name ?? 'User';
  const userEmail = session.user?.email ?? '';
  const userCreatedAt = (session.user as Record<string, unknown>)?.createdAt as string | null ?? null;

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Responsive styles */}
      <style>{`
        @media (max-width: 767px) {
          .sidebar { display: none !important; }
          .bottom-nav { display: flex !important; }
          .main-content { margin-left: 0 !important; padding: 16px 16px 80px !important; }
        }
        @media (min-width: 768px) {
          .bottom-nav { display: none !important; }
          .sidebar { display: flex !important; }
        }
        button:hover:not(:disabled) {
          opacity: 0.88;
        }
        .sidebar button:hover {
          background: ${C.hoverBg} !important;
          color: ${C.text} !important;
          opacity: 1 !important;
        }
        .sidebar button[style*="background: ${C.accent}"]:hover {
          opacity: 0.9 !important;
          color: ${C.accentText} !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fillBar {
          from { width: 0%; }
        }
      `}</style>

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userName={userName}
        userEmail={userEmail}
        C={C}
        toggle={toggle}
        isDark={isDark}
      />

      {/* Main content */}
      <div className="main-content" style={{ marginLeft: 240, padding: '32px 40px', minHeight: '100vh' }}>
        {activeTab === 'overview' && (
          <OverviewTab
            transactions={transactions}
            budgets={budgets}
            insights={insights}
            userName={userName}
            onRefresh={fetchData}
            onNavigate={setActiveTab}
            C={C}
          />
        )}
        {activeTab === 'drift' && <DriftTab insights={insights} C={C} />}
        {activeTab === 'log' && (
          <LogTab
            onLogged={fetchData}
            budgets={budgets}
            insights={insights}
            transactions={transactions}
            onNavigate={setActiveTab}
            C={C}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileTab
            userName={userName}
            userEmail={userEmail}
            userCreatedAt={userCreatedAt}
            transactions={transactions}
            insights={insights}
            budgets={budgets}
            onRefresh={fetchData}
            C={C}
          />
        )}
      </div>

      {/* Bottom nav (mobile only) */}
      <div className="bottom-nav" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: isDark ? 'rgba(17,17,17,0.97)' : 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${C.border}`,
        display: 'none',
        zIndex: 100,
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const isLog = tab.id === 'log';
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: isLog ? '8px 0 12px' : '12px 0 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                position: 'relative',
              }}
            >
              {isLog ? (
                <div style={{
                  width: 46, height: 46,
                  borderRadius: '50%',
                  background: isActive ? C.accent : C.hoverBg,
                  border: `2px solid ${C.accent}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 700,
                  color: isActive ? C.accentText : C.accent,
                  marginTop: -22,
                  boxShadow: isActive ? `0 4px 12px rgba(10,10,10,0.3)` : '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                }}>
                  +
                </div>
              ) : (
                <span style={{
                  fontSize: 18,
                  color: isActive ? C.text : '#94a3b8',
                  transition: 'color 0.2s',
                }}>
                  {tab.icon}
                </span>
              )}
              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? C.text : '#94a3b8',
                transition: 'color 0.2s',
              }}>
                {tab.id === 'drift' ? 'Drift' : tab.id === 'log' ? 'Log' : tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
