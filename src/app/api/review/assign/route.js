import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { findReviewer, recordAssignment } from '@/lib/allocator';

const FLIPKART_EMAIL = /^[^\s@]+@flipkart\.com$/;

export async function POST(request) {
    const body = await request.json();
    const { teamId, reviewTypeId, reviewerTypeId, link, requesterEmail } = body;

    if (!reviewTypeId || !link) {
        return NextResponse.json(
            { error: 'reviewTypeId and link are required' },
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

    // Resolve reviewer type: default to PRIMARY_REVIEWER when not specified.
    let resolvedReviewerTypeId = reviewerTypeId ? parseInt(reviewerTypeId) : null;
    if (!resolvedReviewerTypeId) {
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
        resolvedReviewerTypeId = primary.id;
    }

    // teamId is optional: omitted / 0 / null means "I don't care, any team".
    const resolvedTeamId = teamId ? parseInt(teamId) : null;

    const { user, error } = await findReviewer(supabase, {
        teamId: resolvedTeamId,
        reviewTypeId,
        reviewerTypeId: resolvedReviewerTypeId,
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

    await recordAssignment(supabase, {
        userId: user.id,
        reviewTypeId,
        link,
    });

    const [{ data: reviewType }, { data: reviewerType }, { data: userTeam }] = await Promise.all([
        supabase.from('review_types').select('name').eq('id', reviewTypeId).single(),
        supabase.from('reviewer_types').select('name').eq('id', resolvedReviewerTypeId).single(),
        user.team_id
            ? supabase.from('teams').select('name').eq('id', user.team_id).single()
            : Promise.resolve({ data: null }),
    ]);

    return NextResponse.json({
        reviewer: {
            name: user.name,
            email: user.email,
            reviewerType: reviewerType?.name || 'N/A',
            team: user.teams?.name || userTeam?.name || 'N/A',
            reviewType: reviewType?.name || 'N/A',
        },
    });
}
