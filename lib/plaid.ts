import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

// Defaults to 'sandbox' so local dev works without real bank credentials.
// Set PLAID_ENV=production in Vercel env vars when going live.
const env = (process.env.PLAID_ENV ?? 'sandbox') as keyof typeof PlaidEnvironments;

export const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
        'PLAID-SECRET': process.env.PLAID_SECRET!,
      },
    },
  })
);
