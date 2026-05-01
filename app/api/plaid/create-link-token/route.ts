import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { plaidClient } from '@/lib/plaid';
import { CountryCode, Products } from 'plaid';

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
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create link token' }, { status: 500 });
  }
}
