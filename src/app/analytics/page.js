'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    RadialLinearScale,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, PolarArea } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    RadialLinearScale,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const CHART_COLORS = [
    'rgba(108, 92, 231, 0.8)',
    'rgba(0, 206, 201, 0.8)',
    'rgba(253, 121, 168, 0.8)',
    'rgba(253, 203, 110, 0.8)',
    'rgba(0, 184, 148, 0.8)',
    'rgba(162, 155, 254, 0.8)',
    'rgba(85, 239, 196, 0.8)',
    'rgba(255, 118, 117, 0.8)',
];

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: { color: '#8889a0', font: { family: 'Inter' } },
        },
        title: { display: false },
    },
    scales: {
        x: {
            ticks: { color: '#8889a0', font: { family: 'Inter' } },
            grid: { color: 'rgba(108, 92, 231, 0.05)' },
        },
        y: {
            ticks: { color: '#8889a0', font: { family: 'Inter' }, stepSize: 1 },
            grid: { color: 'rgba(108, 92, 231, 0.08)' },
        },
    },
};

const polarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'right',
            labels: { color: '#8889a0', font: { family: 'Inter', size: 11 } },
        },
        title: { display: false },
    },
    scales: {
        r: {
            ticks: {
                color: '#8889a0',
                font: { family: 'Inter', size: 10 },
                backdropColor: 'transparent',
                stepSize: 1,
            },
            grid: { color: 'rgba(108, 92, 231, 0.1)' },
            angleLines: { color: 'rgba(108, 92, 231, 0.1)' },
        },
    },
};

export default function AnalyticsPage() {
    const [teams, setTeams] = useState([]);
    const [teamStats, setTeamStats] = useState([]);
    const [personStats, setPersonStats] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [personDetail, setPersonDetail] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [t, ts, ps] = await Promise.all([
                fetch('/api/admin/teams').then((r) => r.json()),
                fetch('/api/analytics?type=team').then((r) => r.json()),
                fetch(`/api/analytics?type=person${selectedTeam ? `&teamId=${selectedTeam}` : ''}`).then((r) => r.json()),
            ]);
            setTeams(t);
            setTeamStats(ts);
            setPersonStats(ps);
        } catch { }
        setLoading(false);
    }, [selectedTeam]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Fetch person detail
    const handlePersonClick = async (email) => {
        setSelectedPerson(email);
        try {
            const res = await fetch(`/api/analytics?type=person&email=${encodeURIComponent(email)}`);
            const data = await res.json();
            setPersonDetail(data);
        } catch {
            setPersonDetail(null);
        }
    };

    // Build team chart data
    const buildTeamChartData = () => {
        const teamNames = [...new Set(teamStats.map((s) => s.team))];
        const reviewTypes = [...new Set(teamStats.map((s) => s.reviewType))];

        return {
            labels: teamNames,
            datasets: reviewTypes.map((rt, i) => ({
                label: rt.replace(/_/g, ' '),
                data: teamNames.map((tn) => {
                    const stat = teamStats.find((s) => s.team === tn && s.reviewType === rt);
                    return stat ? stat.totalCount : 0;
                }),
                backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                borderRadius: 6,
            })),
        };
    };

    // Build person chart data
    const buildPersonChartData = () => {
        const sorted = [...personStats].sort((a, b) => b.totalCount - a.totalCount);
        return {
            labels: sorted.map((p) => p.name),
            datasets: [{
                label: 'Total Reviews',
                data: sorted.map((p) => p.totalCount),
                backgroundColor: sorted.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                borderColor: '#1a1a2e',
                borderWidth: 2,
            }],
        };
    };

    // Stats summary
    const totalReviews = personStats.reduce((sum, p) => sum + p.totalCount, 0);
    const totalReviewers = personStats.length;
    const avgReviews = totalReviewers > 0 ? (totalReviews / totalReviewers).toFixed(1) : 0;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">📊 Analytics Dashboard</h1>
                <p className="page-subtitle">Review distribution insights across teams and individuals</p>
            </div>

            {/* Summary Stats */}
            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-number">{totalReviews}</div>
                    <div className="stat-label">Total Reviews</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{totalReviewers}</div>
                    <div className="stat-label">Active Reviewers</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{avgReviews}</div>
                    <div className="stat-label">Avg Reviews/Person</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{teams.length}</div>
                    <div className="stat-label">Teams</div>
                </div>
            </div>

            {/* Filter */}
            <div className="filter-bar">
                <label className="form-label" style={{ marginBottom: 0 }}>Filter by Team:</label>
                <select
                    id="analyticsTeamFilter"
                    className="form-select"
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                >
                    <option value="">All Teams</option>
                    {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
            </div>

            {/* Charts */}
            <div className="analytics-grid">
                <div className="card">
                    <div className="card-title">
                        <span className="icon">🏢</span> Reviews by Team
                    </div>
                    <div className="chart-container">
                        {teamStats.length > 0 ? (
                            <Bar data={buildTeamChartData()} options={chartOptions} />
                        ) : (
                            <div className="empty-state">No review data yet. Assign some reviews first!</div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-title">
                        <span className="icon">👤</span> Reviews by Person
                    </div>
                    <div className="chart-container">
                        {personStats.length > 0 ? (
                            <PolarArea data={buildPersonChartData()} options={polarChartOptions} />
                        ) : (
                            <div className="empty-state">No review data yet</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Person Table */}
            <div className="card mt-3">
                <div className="card-title">
                    <span className="icon">📋</span> Individual Breakdown
                </div>
                {personStats.length > 0 ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Team</th>
                                <th>Designation</th>
                                <th>Total Reviews</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {personStats.map((p, i) => (
                                <tr key={i}>
                                    <td>{p.name}</td>
                                    <td>{p.email}</td>
                                    <td><span className="badge badge-teal">{p.team}</span></td>
                                    <td><span className="badge badge-purple">{p.designation}</span></td>
                                    <td><strong>{p.totalCount}</strong></td>
                                    <td>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => handlePersonClick(p.email)}
                                            style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">No review data available</div>
                )}
            </div>

            {/* Person Detail Modal */}
            {selectedPerson && personDetail && (
                <div className="modal-overlay" onClick={() => setSelectedPerson(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                {personDetail.user?.name || selectedPerson}
                            </h2>
                            <button className="modal-close" onClick={() => setSelectedPerson(null)}>×</button>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <span className="badge badge-teal" style={{ marginRight: '0.5rem' }}>
                                {personDetail.user?.team || '—'}
                            </span>
                            <span className="badge badge-purple">
                                {personDetail.user?.designation || '—'}
                            </span>
                        </div>

                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                            Review Counts
                        </h3>
                        {personDetail.counts?.length > 0 ? (
                            <table className="data-table">
                                <thead>
                                    <tr><th>Review Type</th><th>Count</th></tr>
                                </thead>
                                <tbody>
                                    {personDetail.counts.map((c, i) => (
                                        <tr key={i}>
                                            <td><span className="badge badge-pink">{c.review_types?.name?.replace(/_/g, ' ')}</span></td>
                                            <td><strong>{c.count}</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <div className="empty-state">No reviews yet</div>}

                        <h3 style={{
                            fontSize: '0.9rem', color: 'var(--text-secondary)',
                            marginTop: '1.5rem', marginBottom: '0.75rem'
                        }}>
                            Recent Reviews (Last 10)
                        </h3>
                        {personDetail.history?.length > 0 ? (
                            <table className="data-table">
                                <thead>
                                    <tr><th>Type</th><th>Link</th><th>Date</th></tr>
                                </thead>
                                <tbody>
                                    {personDetail.history.map((h, i) => (
                                        <tr key={i}>
                                            <td><span className="badge badge-pink">{h.review_types?.name?.replace(/_/g, ' ')}</span></td>
                                            <td>
                                                <a
                                                    href={h.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: 'var(--accent-secondary)', textDecoration: 'none' }}
                                                >
                                                    {h.link.length > 40 ? h.link.substring(0, 40) + '...' : h.link}
                                                </a>
                                            </td>
                                            <td style={{ fontSize: '0.8rem' }}>
                                                {new Date(h.assigned_at).toLocaleDateString('en-IN', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit',
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <div className="empty-state">No review history</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
