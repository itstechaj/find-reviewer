import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    const { data, error } = await supabase
        .from('designations')
        .select('*')
        .order('order');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(request) {
    const body = await request.json();
    const { name, order } = body;

    if (!name || order === undefined) {
        return NextResponse.json({ error: 'Name and order are required' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('designations')
        .insert({ name: name.toUpperCase(), order: parseInt(order) })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
}
