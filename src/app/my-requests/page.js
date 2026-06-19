'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRequester } from '@/components/RequesterContext';
import ReassignModal from '@/components/ReassignModal';
import Toast from '@/components/Toast';

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function MyRequestsPage() {
    const { email: requesterEmail, loaded } = useRequester();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reassignTarget, setReassignTarget] = useState(null);
    const [toast, setToast] = useState(null);

    const fetchRows = useCallback(async () => {
        if (!requesterEmail) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/me/requests?email=${encodeURIComponent(requesterEmail)}`);
            const data = await res.json();
            if (!res.ok) {
                setError(data?.error || 'Failed to load requests');
                setRows([]);
            } else {
                setRows(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            setError('Network error.');
        }
        setLoading(false);
    }, [requesterEmail]);

    useEffect(() => {
        if (loaded && requesterEmail) fetchRows();
    }, [loaded, requesterEmail, fetchRows]);

    if (!loaded) return null;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">📨 My Requests</h1>
                <p className="page-subtitle">
                    Reviews you have requested. Use Reassign to hand a review off to a different person.
                </p>
            </div>

            {error && <div className="error-card">{error}</div>}

            {loading ? (
                <div className="empty-state">Loading...</div>
            ) : rows.length === 0 ? (
                <div className="empty-state">You haven&apos;t requested any reviews yet.</div>
            ) : (
                <div className="card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Assigned To</th>
                                <th>Review Type</th>
                                <th>Link</th>
                                <th>Assigned At</th>
                                <th>Reassigned From</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{row.users?.name || '—'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {row.users?.email || '—'}
                                        </div>
                                        {row.users?.teams?.name && (
                                            <span className="badge badge-teal" style={{ marginTop: '0.25rem' }}>
                                                {row.users.teams.name}
                                            </span>
                                        )}
                                    </td>
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
                                            {row.link.length > 50 ? row.link.substring(0, 50) + '...' : row.link}
                                        </a>
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
                                    <td>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                                            onClick={() => setReassignTarget(row)}
                                        >
                                            Reassign
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {reassignTarget && (
                <ReassignModal
                    assignmentId={reassignTarget.id}
                    requesterEmail={requesterEmail}
                    currentReviewerEmail={reassignTarget.users?.email}
                    onClose={() => setReassignTarget(null)}
                    onSuccess={(data) => {
                        setReassignTarget(null);
                        setToast({ message: `Reassigned to ${data.reviewer.name}`, type: 'success' });
                        fetchRows();
                    }}
                />
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
