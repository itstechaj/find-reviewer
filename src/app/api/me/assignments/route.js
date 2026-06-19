import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const FLIPKART_EMAIL = /^[^\s@]+@flipkart\.com$/;

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get('email') || '').trim().toLowerCase();

    if (!email || !FLIPKART_EMAIL.test(email)) {
        return NextResponse.json(
            { error: 'A valid @flipkart.com email is required' },
            { status: 400 }
        );
    }

    // Resolve current user
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('email', email)
        .maybeSingle();

    if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    if (!user) {
        return NextResponse.json([]);
    }

    const { data, error } = await supabase
        .from('review_audit_log')
        .select(`
            id,
            link,
            assigned_at,
            reassigned_at,
            requester_email,
            review_types(id, name),
            previous_user:users!previous_user_id(id, name, email)
        `)
        .eq('user_id', user.id)
        .order('assigned_at', { ascending: false })
        .limit(500);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
}
