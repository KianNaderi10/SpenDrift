export const ARCHETYPES: Record<string, {
  emoji: string;
  name: string;
  color: string;
  description: string;
  next: string | null;
  nextName: string | null;
  tip: string;
}> = {
  homebody: {
    emoji: '🏠',
    name: 'The Homebody',
    color: '#60a5fa',
    description: 'Home is your sanctuary. Bills, groceries, and comfort spending define you.',
    next: 'foodie',
    nextName: 'The Foodie',
    tip: 'Explore more experiences outside the home.',
  },
  foodie: {
    emoji: '🍜',
    name: 'The Foodie',
    color: '#fbbf24',
    description: 'You live to eat — dining dominates your spending. You value experiences over things.',
    next: 'explorer',
    nextName: 'The Explorer',
    tip: 'Cut dining out by 30% and redirect to travel/experiences to evolve.',
  },
  shopaholic: {
    emoji: '🛍️',
    name: 'The Shopaholic',
    color: '#f472b6',
    description: 'Retail therapy is real for you. Shopping is your primary spending outlet.',
    next: 'explorer',
    nextName: 'The Explorer',
    tip: 'Redirect shopping budget toward experiences.',
  },
  explorer: {
    emoji: '🌎',
    name: 'The Explorer',
    color: '#34d399',
    description: 'You invest in experiences — travel, entertainment, and new adventures.',
    next: 'minimalist',
    nextName: 'The Minimalist',
    tip: 'Balance experiences with intentional saving to evolve.',
  },
  minimalist: {
    emoji: '⚡',
    name: 'The Minimalist',
    color: '#2dd4bf',
    description: 'You spend with intention. Every purchase is deliberate.',
    next: 'wealthbuilder',
    nextName: 'The Wealth Builder',
    tip: 'Start investing to evolve to the next level.',
  },
  wealthbuilder: {
    emoji: '💎',
    name: 'The Wealth Builder',
    color: '#a78bfa',
    description: "You've mastered spending. Income > expenses, savings growing.",
    next: null,
    nextName: null,
    tip: "You're at the top. Keep it up.",
  },
  gamer: {
    emoji: '🎮',
    name: 'The Gamer',
    color: '#22d3ee',
    description: 'Gaming, subscriptions, and tech gear eat up your budget. The grind never stops.',
    next: 'techjunkie',
    nextName: 'The Tech Junkie',
    tip: 'Set a monthly gaming budget and redirect the rest to savings.',
  },
  wellness: {
    emoji: '💪',
    name: 'The Wellness Seeker',
    color: '#f43f5e',
    description: 'Gym, supplements, self-care, and health dominate your spend. Your body is your investment.',
    next: 'minimalist',
    nextName: 'The Minimalist',
    tip: 'Audit which wellness expenses actually move the needle.',
  },
  socialite: {
    emoji: '🍺',
    name: 'The Socialite',
    color: '#fb923c',
    description: 'Bars, events, and going out are your love language. Life is meant to be shared.',
    next: 'explorer',
    nextName: 'The Explorer',
    tip: 'Host more at home to cut costs without cutting the fun.',
  },
  techjunkie: {
    emoji: '📱',
    name: 'The Tech Junkie',
    color: '#0ea5e9',
    description: 'Gadgets, apps, and the latest devices are always calling your name.',
    next: 'wealthbuilder',
    nextName: 'The Wealth Builder',
    tip: 'Do a subscription audit — you probably have 3 you forgot about.',
  },
  petparent: {
    emoji: '🐾',
    name: 'The Pet Parent',
    color: '#b45309',
    description: 'Your pet lives better than most people. No regrets.',
    next: 'homebody',
    nextName: 'The Homebody',
    tip: 'Look into pet insurance to reduce unpredictable vet costs.',
  },
  creative: {
    emoji: '🎨',
    name: 'The Creative',
    color: '#c026d3',
    description: 'Hobbies, art supplies, music, and craft spending fuel your passion.',
    next: 'explorer',
    nextName: 'The Explorer',
    tip: 'Monetize one hobby to offset creative spending.',
  },
  roadwarrior: {
    emoji: '🚗',
    name: 'The Road Warrior',
    color: '#64748b',
    description: 'Gas, car payments, and transport are your biggest drain. You\'re always on the move.',
    next: 'minimalist',
    nextName: 'The Minimalist',
    tip: 'Combine errands and explore transit options to cut transport costs.',
  },
  scholar: {
    emoji: '🎓',
    name: 'The Scholar',
    color: '#eab308',
    description: 'Books, courses, and education are your investment. Knowledge is your currency.',
    next: 'wealthbuilder',
    nextName: 'The Wealth Builder',
    tip: 'Look for free/open-source alternatives to paid courses.',
  },
  impulsebuyer: {
    emoji: '🛒',
    name: 'The Impulse Buyer',
    color: '#ef4444',
    description: 'FOMO purchases, unplanned splurges, and "I\'ll deal with it later" energy define your spending.',
    next: 'minimalist',
    nextName: 'The Minimalist',
    tip: 'Add a 24-hour rule before any unplanned purchase.',
  },
  familyfirst: {
    emoji: '👨‍👩‍👧',
    name: 'The Family First',
    color: '#84cc16',
    description: 'Kids, family dining, and household needs come before everything else.',
    next: 'wealthbuilder',
    nextName: 'The Wealth Builder',
    tip: 'Automate a small family savings fund to build a buffer.',
  },
  gambler: {
    emoji: '🎰',
    name: 'The Gambler',
    color: '#dc2626',
    description: 'Betting, casino runs, and high-risk spending define your habits. The thrill is the point.',
    next: 'minimalist',
    nextName: 'The Minimalist',
    tip: 'Set a hard monthly limit for gambling — treat it like an entertainment budget.',
  },
  statusseeker: {
    emoji: '👑',
    name: 'The Status Seeker',
    color: '#d4af37',
    description: 'Designer brands, luxury goods, and premium everything. You spend to be seen.',
    next: 'wealthbuilder',
    nextName: 'The Wealth Builder',
    tip: 'Ask yourself: does this purchase bring joy or just signal status?',
  },
  philanthropist: {
    emoji: '💝',
    name: 'The Philanthropist',
    color: '#fb7185',
    description: 'Donations, charity, and giving dominate your budget. Your spending makes the world better.',
    next: 'wealthbuilder',
    nextName: 'The Wealth Builder',
    tip: 'Automate giving so it doesn\'t compete with your savings goals.',
  },
  speculator: {
    emoji: '📈',
    name: 'The Speculator',
    color: '#7c3aed',
    description: 'Crypto, stocks, and high-risk investments are your playground. Big risk, big reward.',
    next: 'wealthbuilder',
    nextName: 'The Wealth Builder',
    tip: 'Keep speculative bets under 10% of your portfolio.',
  },
};

// Determines the user's spending archetype from this month's category totals (in cents).
// Income is excluded — archetypes are about expense patterns only.
// Rules are evaluated in priority order; the first match wins.
export function computeArchetype(categoryTotals: Record<string, number>): string {
  const expenses = Object.entries(categoryTotals).filter(([k]) => k !== 'income');
  if (!expenses.length) return 'homebody';
  const total = expenses.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return 'homebody';

  // Convert absolute amounts to fractions so thresholds are percentage-based, not dollar-based.
  const pcts: Record<string, number> = {};
  for (const [cat, amt] of expenses) pcts[cat] = amt / total;

  if ((pcts.dining ?? 0) >= 0.30) return 'foodie';
  if ((pcts.shopping ?? 0) >= 0.30) return 'shopaholic';
  if (((pcts.travel ?? 0) + (pcts.entertainment ?? 0)) >= 0.35) return 'explorer';
  if (((pcts.gaming ?? 0) + (pcts.subscriptions ?? 0)) >= 0.25) return 'gamer';
  if (((pcts.health ?? 0) + (pcts.fitness ?? 0)) >= 0.25) return 'wellness';
  if (((pcts.bars ?? 0) + (pcts.nightlife ?? 0)) >= 0.20) return 'socialite';
  if ((pcts.tech ?? 0) >= 0.25) return 'techjunkie';
  if ((pcts.pets ?? 0) >= 0.20) return 'petparent';
  if (((pcts.hobbies ?? 0) + (pcts.art ?? 0)) >= 0.20) return 'creative';
  if ((pcts.transport ?? 0) >= 0.30) return 'roadwarrior';
  if (((pcts.education ?? 0) + (pcts.books ?? 0)) >= 0.20) return 'scholar';
  if (((pcts.kids ?? 0) + (pcts.childcare ?? 0) + (pcts.family ?? 0)) >= 0.20) return 'familyfirst';
  if (((pcts.gambling ?? 0) + (pcts.betting ?? 0)) >= 0.15) return 'gambler';
  if (((pcts.luxury ?? 0) + (pcts.designer ?? 0)) >= 0.20) return 'statusseeker';
  if ((pcts.donations ?? 0) >= 0.15) return 'philanthropist';
  if (((pcts.crypto ?? 0) + (pcts.investments ?? 0)) >= 0.20) return 'speculator';
  // Bills + groceries dominating = home-focused lifestyle
  if (((pcts.bills ?? 0) + (pcts.groceries ?? 0)) >= 0.60) return 'homebody';
  // Under $500 total spend — intentional low-consumption lifestyle
  if (total < 50000) return 'minimalist';
  // High spending that doesn't fit a clear pattern = impulse buyer
  return 'impulsebuyer';
}
