/**
 * Reviewer Allocation Logic
 * 
 * This module is intentionally separated so the allocation strategy
 * can be swapped without touching any other code.
 * 
 * Current strategy: Round-robin by lowest review count.
 * - Filters users by team
 * - Filters users by designation (>= minDesignationOrder if specified)
 * - Picks the user with the lowest review count for the given review type
 * - If multiple users tie, picks one randomly
 */

/**
 * Find the best reviewer based on the current allocation strategy.
 * 
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Object} params
 * @param {number} params.teamId - The team to search within
 * @param {number} params.reviewTypeId - The type of review
 * @param {number|null} params.minDesignationOrder - Minimum designation order (null = any)
 * @returns {Promise<{user: Object|null, error: string|null}>}
 */
export async function findReviewer(supabase, { teamId, reviewTypeId, minDesignationOrder }) {
    try {
        // Step 1: Get eligible users from the team
        let usersQuery = supabase
            .from('users')
            .select('id, name, email, designation_id, team_id, designations(name, order)')
            .eq('team_id', teamId);

        const { data: users, error: usersError } = await usersQuery;

        if (usersError) {
            return { user: null, error: usersError.message };
        }

        if (!users || users.length === 0) {
            return { user: null, error: 'No users found in this team' };
        }

        // Step 2: Filter by designation order if specified
        let eligibleUsers = users;
        if (minDesignationOrder && minDesignationOrder > 0) {
            eligibleUsers = users.filter(
                (u) => u.designations && u.designations.order >= minDesignationOrder
            );
        }

        if (eligibleUsers.length === 0) {
            return { user: null, error: 'No users match the designation criteria' };
        }

        // Step 3: Get review counts for eligible users
        const userIds = eligibleUsers.map((u) => u.id);
        const { data: counts, error: countsError } = await supabase
            .from('review_counts')
            .select('user_id, count')
            .eq('review_type_id', reviewTypeId)
            .in('user_id', userIds);

        if (countsError) {
            return { user: null, error: countsError.message };
        }

        // Step 4: Build a count map (users with no record have count = 0)
        const countMap = new Map();
        for (const c of (counts || [])) {
            countMap.set(c.user_id, c.count);
        }

        // Step 5: Find the minimum count
        let minCount = Infinity;
        for (const u of eligibleUsers) {
            const c = countMap.get(u.id) || 0;
            if (c < minCount) minCount = c;
        }

        // Step 6: Get all users with the minimum count
        const candidates = eligibleUsers.filter(
            (u) => (countMap.get(u.id) || 0) === minCount
        );

        // Step 7: Pick one randomly from candidates
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];

        return { user: chosen, error: null };
    } catch (err) {
        return { user: null, error: err.message };
    }
}

/**
 * Record a review assignment: update counts + insert audit log entry.
 * 
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Object} params
 * @param {number} params.userId
 * @param {number} params.reviewTypeId
 * @param {string} params.link
 */
export async function recordAssignment(supabase, { userId, reviewTypeId, link }) {
    // Upsert review count
    const { data: existing } = await supabase
        .from('review_counts')
        .select('id, count')
        .eq('user_id', userId)
        .eq('review_type_id', reviewTypeId)
        .single();

    if (existing) {
        await supabase
            .from('review_counts')
            .update({ count: existing.count + 1 })
            .eq('id', existing.id);
    } else {
        await supabase
            .from('review_counts')
            .insert({ user_id: userId, review_type_id: reviewTypeId, count: 1 });
    }

    // Insert audit log
    await supabase
        .from('review_audit_log')
        .insert({
            user_id: userId,
            review_type_id: reviewTypeId,
            link,
        });
}
