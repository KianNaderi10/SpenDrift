import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    await connectDB();
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed });
    return NextResponse.json({ id: user._id.toString(), name: user.name, email: user.email }, { status: 201 });
  } catch (err: any) {
    console.error('REG_NAME:' + err?.name);
    console.error('REG_CODE:' + err?.code);
    console.error('REG_CODENAME:' + err?.codeName);
    console.error('REG_MSG:' + String(err?.message).slice(0, 300));
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
