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

    const { data, error } = await supabase
        .from('review_audit_log')
        .select(`
            id,
            link,
            assigned_at,
            reassigned_at,
            requester_email,
            review_types(id, name),
            user_id,
            previous_user_id,
            users:users!user_id(id, name, email, teams(name)),
            previous_user:users!previous_user_id(id, name, email)
        `)
        .eq('requester_email', email)
        .order('assigned_at', { ascending: false })
        .limit(200);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
}
