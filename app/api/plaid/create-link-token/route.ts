import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { plaidClient } from '@/lib/plaid';
import { CountryCode, Products } from 'plaid';

// Step 1 of the Plaid Link flow: create a short-lived link token that the frontend
// uses to open the Plaid modal. The token is user-scoped so Plaid can associate
// the resulting access token with the correct SpenDrift account.
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: session.user.id },
      client_name: 'SpenDrift',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (err: unknown) {
    // Plaid wraps its errors in response.data — log both for easier debugging.
    const plaidErr = (err as { response?: { data?: unknown } })?.response?.data;
    console.error('Plaid create-link-token error:', plaidErr ?? err);
    return NextResponse.json({ error: 'Failed to create link token', detail: plaidErr ?? null }, { status: 500 });
  }
}
