import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'team';
    const email = searchParams.get('email');
    const teamId = searchParams.get('teamId');

    try {
        if (type === 'team') {
            // Per-team review counts
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

            // Aggregate by team and review type
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
            // Specific person's review history
            const { data: user } = await supabase
                .from('users')
                .select('id, name, email, teams(name), designations(name)')
                .eq('email', email)
                .single();

            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            // Get review counts
            const { data: counts } = await supabase
                .from('review_counts')
                .select('count, review_types(name)')
                .eq('user_id', user.id);

            // Get last 10 reviews from audit log
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
                    designation: user.designations?.name,
                },
                counts: counts || [],
                history: history || [],
            });
        }

        if (type === 'person') {
            // Per-person review counts (all people)
            let query = supabase
                .from('review_counts')
                .select(`
          count,
          review_types(name),
          users(id, name, email, team_id, teams(name), designations(name))
        `);

            const { data, error } = await query;
            if (error) throw error;

            // Aggregate by person
            const personStats = {};
            for (const row of (data || [])) {
                const userId = row.users?.id;
                if (!userId) continue;

                // Filter by team if specified
                if (teamId && row.users?.team_id !== parseInt(teamId)) continue;

                if (!personStats[userId]) {
                    personStats[userId] = {
                        name: row.users.name,
                        email: row.users.email,
                        team: row.users.teams?.name || 'Unknown',
                        designation: row.users.designations?.name || 'Unknown',
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
