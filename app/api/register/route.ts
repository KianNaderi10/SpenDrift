import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function POST(request: Request) {
  const { name, email, password } = await request.json().catch(() => ({}));
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  try {
    await connectDB();
  } catch (err: any) {
    console.error('STEP:connect', err?.name, err?.code, err?.message);
    return NextResponse.json({ error: 'Server error', step: 'connect', detail: String(err?.message) }, { status: 500 });
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
  } catch (err: any) {
    console.error('STEP:findOne', err?.name, err?.code, err?.message);
    return NextResponse.json({ error: 'Server error', step: 'findOne', detail: String(err?.message) }, { status: 500 });
  }

  try {
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed });
    return NextResponse.json({ id: user._id.toString(), name: user.name, email: user.email }, { status: 201 });
  } catch (err: any) {
    console.error('STEP:create', err?.name, err?.code, err?.message);
    return NextResponse.json({ error: 'Server error', step: 'create', detail: String(err?.message) }, { status: 500 });
  }
}
