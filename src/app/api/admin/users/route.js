import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const USER_SELECT =
    '*, teams(id, name), user_reviewer_types(reviewer_type_id, reviewer_types(id, name))';

function flatten(user) {
    if (!user) return user;
    const reviewer_types = (user.user_reviewer_types || [])
        .map((urt) => urt.reviewer_types)
        .filter(Boolean);
    const { user_reviewer_types, ...rest } = user;
    return { ...rest, reviewer_types };
}

export async function GET() {
    const { data, error } = await supabase
        .from('users')
        .select(USER_SELECT)
        .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data || []).map(flatten));
}

export async function POST(request) {
    const body = await request.json();
    const { name, email, team_id } = body;
    let { reviewer_type_ids } = body;

    if (!name || !email || !team_id) {
        return NextResponse.json(
            { error: 'name, email, and team_id are required' },
            { status: 400 }
        );
    }

    // Default to PRIMARY_REVIEWER if nothing was selected
    if (!Array.isArray(reviewer_type_ids) || reviewer_type_ids.length === 0) {
        const { data: primary } = await supabase
            .from('reviewer_types')
            .select('id')
            .eq('name', 'PRIMARY_REVIEWER')
            .single();
        if (!primary) {
            return NextResponse.json(
                { error: 'PRIMARY_REVIEWER not configured in reviewer_types' },
                { status: 500 }
            );
        }
        reviewer_type_ids = [primary.id];
    }

    const { data: created, error: insertError } = await supabase
        .from('users')
        .insert({ name, email, team_id })
        .select('id')
        .single();

    if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const links = reviewer_type_ids.map((rtId) => ({
        user_id: created.id,
        reviewer_type_id: parseInt(rtId),
    }));

    const { error: linkError } = await supabase
        .from('user_reviewer_types')
        .insert(links);

    if (linkError) {
        // Roll back the user row if linking failed
        await supabase.from('users').delete().eq('id', created.id);
        return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    const { data: fresh } = await supabase
        .from('users')
        .select(USER_SELECT)
        .eq('id', created.id)
        .single();

    return NextResponse.json(flatten(fresh), { status: 201 });
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
