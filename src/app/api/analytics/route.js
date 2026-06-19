import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const USER_TYPES_SELECT = 'user_reviewer_types(reviewer_types(id, name))';

function flattenReviewerTypes(user) {
    return (user?.user_reviewer_types || [])
        .map((urt) => urt.reviewer_types)
        .filter(Boolean);
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'team';
    const email = searchParams.get('email');
    const teamId = searchParams.get('teamId');

    try {
        if (type === 'team') {
            const { data, error } = await supabase
                .from('review_counts')
                .select(`
                    count,
                    review_type_id,
                    review_types(name),
                    user_id,
                    users(name, email, team_id, teams(name))
                `);

            if (error) throw error;

            const teamStats = {};
            for (const row of (data || [])) {
                const teamName = row.users?.teams?.name || 'Unknown';
                const reviewType = row.review_types?.name || 'Unknown';
                const key = `${teamName}__${reviewType}`;
                if (!teamStats[key]) {
                    teamStats[key] = { team: teamName, reviewType, totalCount: 0 };
                }
                teamStats[key].totalCount += row.count;
            }

            return NextResponse.json(Object.values(teamStats));
        }

        if (type === 'person' && email) {
            const { data: user } = await supabase
                .from('users')
                .select(`id, name, email, teams(name), ${USER_TYPES_SELECT}`)
                .eq('email', email)
                .single();

            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            const { data: counts } = await supabase
                .from('review_counts')
                .select('count, review_types(name)')
                .eq('user_id', user.id);

            const { data: history } = await supabase
                .from('review_audit_log')
                .select('link, assigned_at, review_types(name)')
                .eq('user_id', user.id)
                .order('assigned_at', { ascending: false })
                .limit(10);

            return NextResponse.json({
                user: {
                    name: user.name,
                    email: user.email,
                    team: user.teams?.name,
                    reviewerTypes: flattenReviewerTypes(user),
                },
                counts: counts || [],
                history: history || [],
            });
        }

        if (type === 'person') {
            const { data, error } = await supabase
                .from('review_counts')
                .select(`
                    count,
                    review_types(name),
                    users(id, name, email, team_id, teams(name), ${USER_TYPES_SELECT})
                `);
            if (error) throw error;

            const personStats = {};
            for (const row of (data || [])) {
                const userId = row.users?.id;
                if (!userId) continue;
                if (teamId && row.users?.team_id !== parseInt(teamId)) continue;

                if (!personStats[userId]) {
                    personStats[userId] = {
                        name: row.users.name,
                        email: row.users.email,
                        team: row.users.teams?.name || 'Unknown',
                        reviewerTypes: flattenReviewerTypes(row.users),
                        reviews: {},
                        totalCount: 0,
                    };
                }
                const reviewType = row.review_types?.name || 'Unknown';
                personStats[userId].reviews[reviewType] = row.count;
                personStats[userId].totalCount += row.count;
            }

            return NextResponse.json(Object.values(personStats));
        }

        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
