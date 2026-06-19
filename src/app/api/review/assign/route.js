import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { findReviewer, recordAssignment } from '@/lib/allocator';

const FLIPKART_EMAIL = /^[^\s@]+@flipkart\.com$/;

export async function POST(request) {
    const body = await request.json();
    const { teamId, reviewTypeId, minDesignationOrder, link, requesterEmail } = body;

    if (!teamId || !reviewTypeId || !link) {
        return NextResponse.json(
            { error: 'teamId, reviewTypeId, and link are required' },
            { status: 400 }
        );
    }

    const normalizedRequester = (requesterEmail || '').trim().toLowerCase();
    if (!normalizedRequester || !FLIPKART_EMAIL.test(normalizedRequester)) {
        return NextResponse.json(
            { error: 'A valid @flipkart.com requester email is required' },
            { status: 400 }
        );
    }

    // Find the best reviewer using the allocation strategy
    const { user, error } = await findReviewer(supabase, {
        teamId,
        reviewTypeId,
        minDesignationOrder: minDesignationOrder || null,
        excludeEmail: normalizedRequester,
    });

    if (error) {
        return NextResponse.json({ error }, { status: 404 });
    }

    if (!user) {
        return NextResponse.json(
            { error: 'No eligible reviewer found' },
            { status: 404 }
        );
    }

    // Record the assignment
    await recordAssignment(supabase, {
        userId: user.id,
        reviewTypeId,
        link,
    });

    // Fetch team and designation names for the response
    const { data: team } = await supabase
        .from('teams')
        .select('name')
        .eq('id', teamId)
        .single();

    const { data: reviewType } = await supabase
        .from('review_types')
        .select('name')
        .eq('id', reviewTypeId)
        .single();

    return NextResponse.json({
        reviewer: {
            name: user.name,
            email: user.email,
            designation: user.designations?.name || 'N/A',
            team: team?.name || 'N/A',
            reviewType: reviewType?.name || 'N/A',
        },
    });
}
