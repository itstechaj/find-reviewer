'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRequester } from '@/components/RequesterContext';

function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function csvEscape(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function downloadCSV(filename, rows) {
    const header = [
        'Assignment ID',
        'Review Type',
        'Link',
        'Requested By',
        'Assigned At',
        'Reassigned At',
        'Reassigned From (name)',
        'Reassigned From (email)',
    ];
    const lines = [header.map(csvEscape).join(',')];
    for (const r of rows) {
        lines.push([
            r.id,
            r.review_types?.name || '',
            r.link,
            r.requester_email || '',
            r.assigned_at || '',
            r.reassigned_at || '',
            r.previous_user?.name || '',
            r.previous_user?.email || '',
        ].map(csvEscape).join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default function MyAssignmentsPage() {
    const { email, loaded } = useRequester();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRows = useCallback(async () => {
        if (!email) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/me/assignments?email=${encodeURIComponent(email)}`);
            const data = await res.json();
            if (!res.ok) {
                setError(data?.error || 'Failed to load assignments');
                setRows([]);
            } else {
                setRows(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            setError('Network error.');
        }
        setLoading(false);
    }, [email]);

    useEffect(() => {
        if (loaded && email) fetchRows();
    }, [loaded, email, fetchRows]);

    const handleExport = () => {
        if (rows.length === 0) return;
        const safe = (email || 'user').replace(/[^a-zA-Z0-9._-]/g, '_');
        downloadCSV(`reviews-assigned-to-${safe}.csv`, rows);
    };

    if (!loaded) return null;

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">📋 My Assignments</h1>
                    <p className="page-subtitle">Reviews currently assigned to you.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleExport}
                    disabled={rows.length === 0}
                >
                    ⬇️ Export CSV
                </button>
            </div>

            {error && <div className="error-card">{error}</div>}

            {loading ? (
                <div className="empty-state">Loading...</div>
            ) : rows.length === 0 ? (
                <div className="empty-state">You have no reviews assigned right now.</div>
            ) : (
                <div className="card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Review Type</th>
                                <th>Link</th>
                                <th>Requested By</th>
                                <th>Assigned At</th>
                                <th>Reassigned From</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <span className="badge badge-pink">
                                            {row.review_types?.name?.replace(/_/g, ' ') || '—'}
                                        </span>
                                    </td>
                                    <td>
                                        <a
                                            href={row.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: 'var(--accent-secondary)', textDecoration: 'none' }}
                                        >
                                            {row.link.length > 60 ? row.link.substring(0, 60) + '...' : row.link}
                                        </a>
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>
                                        {row.requester_email || '—'}
                                    </td>
                                    <td style={{ fontSize: '0.8rem' }}>
                                        <div>{formatDate(row.assigned_at)}</div>
                                        {row.reassigned_at && (
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                Reassigned: {formatDate(row.reassigned_at)}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ fontSize: '0.8rem' }}>
                                        {row.previous_user ? (
                                            <div>
                                                <div>{row.previous_user.name}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                    {row.previous_user.email}
                                                </div>
                                            </div>
                                        ) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
