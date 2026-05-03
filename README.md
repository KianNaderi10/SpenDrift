# SpenDrift

**Know where your money goes. Before it's gone.**

SpenDrift is a spending personality tracker that reveals your financial archetype — a profile built from your real spending habits. Connect your bank, log transactions, and watch your archetype evolve over time as your habits shift.

---

## Features

- **20 Spending Archetypes** — From The Homebody to The Wealth Builder, your spending patterns map to a personality that changes as you do.
- **Bank Integration** — Connect your bank account via Plaid to automatically sync and categorize transactions.
- **Manual Transactions** — Log purchases manually across 15+ categories (dining, travel, shopping, health, etc.).
- **Budget Tracking** — Set monthly limits per category and track your progress in real time.
- **Spending Insights** — Visualize your habits with breakdowns by category, trend data, and drift over time.
- **Dark / Light Theme** — Full theme support across all pages.
- **Private by Design** — No ads, no data selling. Your financial data stays yours.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | MongoDB via [Mongoose](https://mongoosejs.com) |
| Auth | [NextAuth.js](https://next-auth.js.org) (credentials) |
| Bank Sync | [Plaid](https://plaid.com) |
| Password Hashing | bcryptjs |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB connection string (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Plaid](https://plaid.com) developer account (for bank sync — optional)

### 1. Clone the repo

```bash
git clone https://github.com/KianNaderi10/SpenDrift.git
cd SpenDrift
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/spendrift

# NextAuth
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3003

# Plaid (optional — only required for bank account linking)
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-sandbox-secret
PLAID_ENV=sandbox
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3003](http://localhost:3003) in your browser.

---

## Project Structure

```
SpenDrift/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   ├── dashboard/            # Main app dashboard
│   ├── login/                # Sign-in page
│   ├── register/             # Sign-up page
│   ├── profile/              # User profile & archetype display
│   ├── settings/             # App settings
│   ├── about/                # About page
│   ├── contact/              # Contact page
│   ├── privacy/              # Privacy policy
│   ├── terms/                # Terms of service
│   └── api/
│       ├── auth/             # NextAuth endpoints
│       ├── transactions/     # CRUD for transactions
│       ├── budgets/          # Budget management
│       ├── insights/         # Spending analytics
│       ├── plaid/            # Plaid link & sync
│       ├── register/         # User registration
│       └── user/             # User profile endpoints
├── models/
│   ├── User.ts               # Mongoose user schema
│   ├── Transaction.ts        # Mongoose transaction schema
│   └── Budget.ts             # Mongoose budget schema
├── lib/
│   ├── archetype.ts          # Archetype definitions & scoring logic
│   ├── auth.ts               # NextAuth config
│   ├── db.ts                 # MongoDB connection
│   └── plaid.ts              # Plaid client setup
└── types/                    # Shared TypeScript types
```

---

## Spending Archetypes

SpenDrift maps your spending to one of 20 personalities:

| Archetype | Dominant Spending |
|---|---|
| 🏠 The Homebody | Bills, groceries, home comfort |
| 🍜 The Foodie | Dining out, restaurants |
| 🛍️ The Shopaholic | Retail, fashion, online shopping |
| 🌎 The Explorer | Travel, experiences, entertainment |
| ⚡ The Minimalist | Low spend, intentional purchases |
| 💎 The Wealth Builder | Savings-first lifestyle |
| 🎮 The Gamer | Gaming, subscriptions, tech gear |
| 🎨 The Creative | Art supplies, events, creative tools |
| 📚 The Learner | Books, courses, education |
| 🏋️ The Fitness Buff | Gym, supplements, sports |
| 🚗 The Commuter | Transport, fuel, transit |
| 🐾 The Pet Parent | Pet care, vet, accessories |
| 🍷 The Socialite | Bars, events, social dining |
| 💊 The Health Nut | Wellness, healthcare, self-care |
| 🎵 The Music Lover | Concerts, streaming, instruments |
| 📱 The Tech Enthusiast | Gadgets, apps, hardware |
| 🏡 The Nester | Home decor, furnishings |
| ✈️ The Jet-Setter | Flights, hotels, international travel |
| ☕ The Café Dweller | Coffee shops, remote work spots |
| 🎭 The Experience Seeker | Events, activities, unique experiences |

Archetypes evolve — as your spending patterns shift month over month, your archetype updates to reflect who you are now.

---

## Scripts

```bash
npm run dev      # Start dev server on port 3003
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## License

MIT
