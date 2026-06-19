import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();

    if (!normalized.endsWith('@flipkart.com')) {
        return NextResponse.json({ error: 'Only @flipkart.com emails are allowed' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('users')
        .select('name, email')
        .eq('email', normalized)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data) {
        return NextResponse.json({ email: data.email, name: data.name });
    }

    return NextResponse.json({ email: normalized, name: null });
}
