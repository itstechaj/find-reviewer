'use client';

import { useState, useEffect, useCallback } from 'react';
import Toast from '@/components/Toast';

export default function AdminPage() {
    const [teams, setTeams] = useState([]);
    const [reviewTypes, setReviewTypes] = useState([]);
    const [reviewerTypes, setReviewerTypes] = useState([]);
    const [users, setUsers] = useState([]);
    const [toast, setToast] = useState(null);

    // Form states
    const [newTeam, setNewTeam] = useState('');
    const [newReviewType, setNewReviewType] = useState('');
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        team_id: '',
        isPrimary: true,    // default ON
        isSecondary: false,
    });

    const fetchAll = useCallback(async () => {
        const [t, rt, rrt, u] = await Promise.all([
            fetch('/api/admin/teams').then((r) => r.json()),
            fetch('/api/admin/review-types').then((r) => r.json()),
            fetch('/api/admin/reviewer-types').then((r) => r.json()),
            fetch('/api/admin/users').then((r) => r.json()),
        ]);
        setTeams(t);
        setReviewTypes(rt);
        setReviewerTypes(rrt);
        setUsers(u);
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    // Look up reviewer-type IDs by name
    const idForReviewerType = (name) => {
        const found = reviewerTypes.find((r) => r.name === name);
        return found ? found.id : null;
    };

    // Add Team
    const handleAddTeam = async (e) => {
        e.preventDefault();
        if (!newTeam.trim()) return;
        const res = await fetch('/api/admin/teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newTeam.trim() }),
        });
        const data = await res.json();
        if (res.ok) {
            setTeams([...teams, data]);
            setNewTeam('');
            showToast(`Team "${data.name}" added!`);
        } else {
            showToast(data.error, 'error');
        }
    };

    // Add Review Type
    const handleAddReviewType = async (e) => {
        e.preventDefault();
        if (!newReviewType.trim()) return;
        const res = await fetch('/api/admin/review-types', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newReviewType.trim() }),
        });
        const data = await res.json();
        if (res.ok) {
            setReviewTypes([...reviewTypes, data]);
            setNewReviewType('');
            showToast(`Review type "${data.name}" added!`);
        } else {
            showToast(data.error, 'error');
        }
    };

    // Add User
    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!newUser.name || !newUser.email || !newUser.team_id) {
            showToast('Name, email, and team are required', 'error');
            return;
        }

        // Build reviewer_type_ids from checkbox state.
        // If nothing is checked, the server falls back to PRIMARY_REVIEWER.
        const reviewer_type_ids = [];
        if (newUser.isPrimary) {
            const id = idForReviewerType('PRIMARY_REVIEWER');
            if (id) reviewer_type_ids.push(id);
        }
        if (newUser.isSecondary) {
            const id = idForReviewerType('SECONDARY_REVIEWER');
            if (id) reviewer_type_ids.push(id);
        }

        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newUser.name,
                email: newUser.email,
                team_id: parseInt(newUser.team_id),
                reviewer_type_ids,
            }),
        });
        const data = await res.json();
        if (res.ok) {
            setUsers([...users, data]);
            setNewUser({
                name: '',
                email: '',
                team_id: '',
                isPrimary: true,
                isSecondary: false,
            });
            showToast(`User "${data.name}" added!`);
        } else {
            showToast(data.error, 'error');
        }
    };

    // Delete User
    const handleDeleteUser = async (id, name) => {
        if (!confirm(`Delete user "${name}"?`)) return;
        const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
            setUsers(users.filter((u) => u.id !== id));
            showToast(`User "${name}" deleted`);
        } else {
            showToast('Failed to delete user', 'error');
        }
    };

    const renderReviewerTypeBadges = (types) => {
        if (!types || types.length === 0) {
            return <span className="badge badge-purple">PRIMARY</span>;
        }
        return types.map((t) => (
            <span key={t.id} className="badge badge-purple" style={{ marginRight: '0.25rem' }}>
                {t.name.replace('_REVIEWER', '')}
            </span>
        ));
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">⚙️ Admin Console</h1>
                <p className="page-subtitle">Manage teams, reviewer types, review types, and users</p>
            </div>

            <div className="admin-grid">
                {/* Teams Card */}
                <div className="card">
                    <div className="card-title">
                        <span className="icon">🏷️</span> Teams
                    </div>
                    <form onSubmit={handleAddTeam}>
                        <div className="form-group">
                            <input
                                id="newTeamInput"
                                className="form-input"
                                placeholder="Enter team name"
                                value={newTeam}
                                onChange={(e) => setNewTeam(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            Add Team
                        </button>
                    </form>
                    <hr className="section-divider mt-2" />
                    {teams.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr><th>Name</th></tr>
                            </thead>
                            <tbody>
                                {teams.map((t) => (
                                    <tr key={t.id}><td><span className="badge badge-teal">{t.name}</span></td></tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <div className="empty-state">No teams yet</div>}
                </div>

                {/* Reviewer Types Card (read-only — there are only 2) */}
                <div className="card">
                    <div className="card-title">
                        <span className="icon">🎚️</span> Reviewer Types
                    </div>
                    <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                        Users can be assigned one or both of these when created.
                    </p>
                    {reviewerTypes.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr><th>Name</th></tr>
                            </thead>
                            <tbody>
                                {reviewerTypes.map((r) => (
                                    <tr key={r.id}>
                                        <td><span className="badge badge-purple">{r.name.replace(/_/g, ' ')}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <div className="empty-state">No reviewer types configured</div>}
                </div>

                {/* Review Types Card */}
                <div className="card">
                    <div className="card-title">
                        <span className="icon">📝</span> Review Types
                    </div>
                    <form onSubmit={handleAddReviewType}>
                        <div className="form-group">
                            <input
                                id="newReviewTypeInput"
                                className="form-input"
                                placeholder="e.g. DESIGN_REVIEW"
                                value={newReviewType}
                                onChange={(e) => setNewReviewType(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            Add Review Type
                        </button>
                    </form>
                    <hr className="section-divider mt-2" />
                    {reviewTypes.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr><th>Name</th></tr>
                            </thead>
                            <tbody>
                                {reviewTypes.map((rt) => (
                                    <tr key={rt.id}>
                                        <td><span className="badge badge-pink">{rt.name.replace(/_/g, ' ')}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <div className="empty-state">No review types yet</div>}
                </div>

                {/* Users Card - Full width */}
                <div className="card full-width">
                    <div className="card-title">
                        <span className="icon">👥</span> Users
                    </div>
                    <form onSubmit={handleAddUser}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="userName">Name</label>
                                <input
                                    id="userName"
                                    className="form-input"
                                    placeholder="John Doe"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="userEmail">Email</label>
                                <input
                                    id="userEmail"
                                    type="email"
                                    className="form-input"
                                    placeholder="john@flipkart.com"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="userTeam">Team</label>
                                <select
                                    id="userTeam"
                                    className="form-select"
                                    value={newUser.team_id}
                                    onChange={(e) => setNewUser({ ...newUser, team_id: e.target.value })}
                                >
                                    <option value="">Select team</option>
                                    {teams.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reviewer Type</label>
                                <div className="checkbox-row">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={newUser.isPrimary}
                                            onChange={(e) => setNewUser({ ...newUser, isPrimary: e.target.checked })}
                                        />
                                        <span>Primary Reviewer</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={newUser.isSecondary}
                                            onChange={(e) => setNewUser({ ...newUser, isSecondary: e.target.checked })}
                                        />
                                        <span>Secondary Reviewer</span>
                                    </label>
                                </div>
                                <p className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                    If nothing is checked, the user defaults to Primary Reviewer.
                                </p>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary mt-1" style={{ width: '100%' }}>
                            Add User
                        </button>
                    </form>

                    <hr className="section-divider mt-2" />

                    {users.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Team</th>
                                    <th>Reviewer Type</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id}>
                                        <td>{u.name}</td>
                                        <td>{u.email}</td>
                                        <td><span className="badge badge-teal">{u.teams?.name || '—'}</span></td>
                                        <td>{renderReviewerTypeBadges(u.reviewer_types)}</td>
                                        <td>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleDeleteUser(u.id, u.name)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <div className="empty-state">No users yet. Add teams first, then add users.</div>}
                </div>
            </div>

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
