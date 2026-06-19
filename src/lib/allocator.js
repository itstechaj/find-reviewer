/**
 * Reviewer Allocation Logic
 *
 * Strategy: Round-robin by lowest review count.
 * - Filters users by team (if provided)
 * - Filters users by reviewer_type (e.g. PRIMARY / SECONDARY)
 * - Always excludes the requester
 * - Picks the user with the lowest count for the given review type
 * - Ties broken at random
 */

export async function findReviewer(
    supabase,
    { teamId, reviewTypeId, reviewerTypeId, excludeEmail }
) {
    try {
        if (!reviewerTypeId) {
            return { user: null, error: 'reviewerTypeId is required' };
        }
        if (!excludeEmail) {
            // Hard guarantee: we never assign without knowing who asked.
            return { user: null, error: 'requester email is required' };
        }

        // Step 1: Find users with the requested reviewer type
        const { data: rtRows, error: rtError } = await supabase
            .from('user_reviewer_types')
            .select('user_id')
            .eq('reviewer_type_id', reviewerTypeId);

        if (rtError) {
            return { user: null, error: rtError.message };
        }

        const candidateIds = (rtRows || []).map((r) => r.user_id);
        if (candidateIds.length === 0) {
            return { user: null, error: 'No users available for the selected reviewer type' };
        }

        // Step 2: Fetch those users, optionally filtered by team
        let usersQuery = supabase
            .from('users')
            .select('id, name, email, team_id, teams(id, name)')
            .in('id', candidateIds);

        if (teamId) {
            usersQuery = usersQuery.eq('team_id', teamId);
        }

        const { data: users, error: usersError } = await usersQuery;
        if (usersError) {
            return { user: null, error: usersError.message };
        }

        let eligibleUsers = users || [];

        // Step 3: Always exclude the requester (case-insensitive)
        const normalizedRequester = excludeEmail.trim().toLowerCase();
        eligibleUsers = eligibleUsers.filter(
            (u) => (u.email || '').toLowerCase() !== normalizedRequester
        );

        if (eligibleUsers.length === 0) {
            return { user: null, error: 'No eligible reviewer found' };
        }

        // Step 4: Pull review counts for the chosen review type
        const userIds = eligibleUsers.map((u) => u.id);
        const { data: counts, error: countsError } = await supabase
            .from('review_counts')
            .select('user_id, count')
            .eq('review_type_id', reviewTypeId)
            .in('user_id', userIds);

        if (countsError) {
            return { user: null, error: countsError.message };
        }

        const countMap = new Map();
        for (const c of counts || []) {
            countMap.set(c.user_id, c.count);
        }

        // Step 5: Find minimum count and tie-break randomly
        let minCount = Infinity;
        for (const u of eligibleUsers) {
            const c = countMap.get(u.id) || 0;
            if (c < minCount) minCount = c;
        }

        const candidates = eligibleUsers.filter(
            (u) => (countMap.get(u.id) || 0) === minCount
        );

        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        return { user: chosen, error: null };
    } catch (err) {
        return { user: null, error: err.message };
    }
}

export async function recordAssignment(
    supabase,
    { userId, reviewTypeId, link, requesterEmail }
) {
    await bumpReviewCount(supabase, userId, reviewTypeId, +1);

    const { data: audit, error: auditError } = await supabase
        .from('review_audit_log')
        .insert({
            user_id: userId,
            review_type_id: reviewTypeId,
            link,
            requester_email: requesterEmail || null,
        })
        .select('id')
        .single();

    if (auditError) {
        return { assignmentId: null, error: auditError.message };
    }

    return { assignmentId: audit.id, error: null };
}

export async function bumpReviewCount(supabase, userId, reviewTypeId, delta) {
    const { data: existing } = await supabase
        .from('review_counts')
        .select('id, count')
        .eq('user_id', userId)
        .eq('review_type_id', reviewTypeId)
        .maybeSingle();

    if (existing) {
        const next = Math.max(0, (existing.count || 0) + delta);
        await supabase
            .from('review_counts')
            .update({ count: next })
            .eq('id', existing.id);
    } else if (delta > 0) {
        await supabase
            .from('review_counts')
            .insert({ user_id: userId, review_type_id: reviewTypeId, count: delta });
    }
}
