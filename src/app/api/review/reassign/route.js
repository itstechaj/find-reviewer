import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { bumpReviewCount } from '@/lib/allocator';

const FLIPKART_EMAIL = /^[^\s@]+@flipkart\.com$/;

export async function POST(request) {
    const body = await request.json();
    const { assignmentId, newReviewerEmail, requesterEmail } = body;

    if (!assignmentId) {
        return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
    }

    const normalizedRequester = (requesterEmail || '').trim().toLowerCase();
    const normalizedNew = (newReviewerEmail || '').trim().toLowerCase();

    if (!normalizedRequester || !FLIPKART_EMAIL.test(normalizedRequester)) {
        return NextResponse.json(
            { error: 'A valid @flipkart.com requester email is required' },
            { status: 400 }
        );
    }

    if (!normalizedNew) {
        return NextResponse.json(
            { error: 'New reviewer email is required' },
            { status: 400 }
        );
    }

    if (!FLIPKART_EMAIL.test(normalizedNew)) {
        return NextResponse.json(
            { error: 'New reviewer email must be a @flipkart.com address' },
            { status: 400 }
        );
    }

    if (normalizedNew === normalizedRequester) {
        return NextResponse.json(
            { error: 'You cannot reassign the review to yourself' },
            { status: 400 }
        );
    }

    // Load the assignment and verify ownership
    const { data: assignment, error: loadError } = await supabase
        .from('review_audit_log')
        .select('id, user_id, review_type_id, requester_email')
        .eq('id', assignmentId)
        .maybeSingle();

    if (loadError) {
        return NextResponse.json({ error: loadError.message }, { status: 500 });
    }
    if (!assignment) {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if ((assignment.requester_email || '').toLowerCase() !== normalizedRequester) {
        return NextResponse.json(
            { error: 'Only the original requester can reassign this review' },
            { status: 403 }
        );
    }

    // Look up the new reviewer in users
    const { data: newReviewer, error: newReviewerError } = await supabase
        .from('users')
        .select('id, name, email, team_id, teams(name)')
        .eq('email', normalizedNew)
        .maybeSingle();

    if (newReviewerError) {
        return NextResponse.json({ error: newReviewerError.message }, { status: 500 });
    }
    if (!newReviewer) {
        return NextResponse.json(
            { error: `No user found with email ${normalizedNew}` },
            { status: 404 }
        );
    }

    if (newReviewer.id === assignment.user_id) {
        return NextResponse.json(
            { error: 'This review is already assigned to that reviewer' },
            { status: 400 }
        );
    }

    // Shift the count: -1 from previous, +1 to new
    await bumpReviewCount(supabase, assignment.user_id, assignment.review_type_id, -1);
    await bumpReviewCount(supabase, newReviewer.id, assignment.review_type_id, +1);

    // Update the audit row to reflect the reassignment
    const { data: updated, error: updateError } = await supabase
        .from('review_audit_log')
        .update({
            user_id: newReviewer.id,
            previous_user_id: assignment.user_id,
            reassigned_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
        .select('id, user_id, previous_user_id, reassigned_at')
        .single();

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
        assignmentId: updated.id,
        reviewer: {
            name: newReviewer.name,
            email: newReviewer.email,
            team: newReviewer.teams?.name || 'N/A',
        },
        previousUserId: updated.previous_user_id,
        reassignedAt: updated.reassigned_at,
    });
}
