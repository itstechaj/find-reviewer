'use client';

import { useState, useEffect, useCallback } from 'react';
import Toast from '@/components/Toast';

export default function AdminPage() {
    const [teams, setTeams] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [reviewTypes, setReviewTypes] = useState([]);
    const [users, setUsers] = useState([]);
    const [toast, setToast] = useState(null);

    // Form states
    const [newTeam, setNewTeam] = useState('');
    const [newDesignation, setNewDesignation] = useState({ name: '', order: '' });
    const [newReviewType, setNewReviewType] = useState('');
    const [newUser, setNewUser] = useState({
        name: '', email: '', designation_id: '', team_id: '',
    });

    const fetchAll = useCallback(async () => {
        const [t, d, rt, u] = await Promise.all([
            fetch('/api/admin/teams').then((r) => r.json()),
            fetch('/api/admin/designations').then((r) => r.json()),
            fetch('/api/admin/review-types').then((r) => r.json()),
            fetch('/api/admin/users').then((r) => r.json()),
        ]);
        setTeams(t);
        setDesignations(d);
        setReviewTypes(rt);
        setUsers(u);
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
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

    // Add Designation
    const handleAddDesignation = async (e) => {
        e.preventDefault();
        if (!newDesignation.name.trim() || !newDesignation.order) return;
        const res = await fetch('/api/admin/designations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDesignation),
        });
        const data = await res.json();
        if (res.ok) {
            setDesignations([...designations, data].sort((a, b) => a.order - b.order));
            setNewDesignation({ name: '', order: '' });
            showToast(`Designation "${data.name}" added!`);
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
        if (!newUser.name || !newUser.email || !newUser.designation_id || !newUser.team_id) {
            showToast('All user fields are required', 'error');
            return;
        }
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser),
        });
        const data = await res.json();
        if (res.ok) {
            setUsers([...users, data]);
            setNewUser({ name: '', email: '', designation_id: '', team_id: '' });
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

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">⚙️ Admin Console</h1>
                <p className="page-subtitle">Manage teams, designations, review types, and users</p>
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

                {/* Designations Card */}
                <div className="card">
                    <div className="card-title">
                        <span className="icon">📊</span> Designations
                    </div>
                    <form onSubmit={handleAddDesignation}>
                        <div className="form-row">
                            <div className="form-group">
                                <input
                                    id="newDesigNameInput"
                                    className="form-input"
                                    placeholder="e.g. SDE4"
                                    value={newDesignation.name}
                                    onChange={(e) => setNewDesignation({ ...newDesignation, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    id="newDesigOrderInput"
                                    className="form-input"
                                    type="number"
                                    placeholder="Order (e.g. 4)"
                                    value={newDesignation.order}
                                    onChange={(e) => setNewDesignation({ ...newDesignation, order: e.target.value })}
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            Add Designation
                        </button>
                    </form>
                    <hr className="section-divider mt-2" />
                    {designations.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr><th>Name</th><th>Order</th></tr>
                            </thead>
                            <tbody>
                                {designations.map((d) => (
                                    <tr key={d.id}>
                                        <td><span className="badge badge-purple">{d.name}</span></td>
                                        <td>{d.order}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <div className="empty-state">No designations yet</div>}
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
                                    placeholder="john@company.com"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="userDesignation">Designation</label>
                                <select
                                    id="userDesignation"
                                    className="form-select"
                                    value={newUser.designation_id}
                                    onChange={(e) => setNewUser({ ...newUser, designation_id: e.target.value })}
                                >
                                    <option value="">Select designation</option>
                                    {designations.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
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
                                    <th>Designation</th>
                                    <th>Team</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id}>
                                        <td>{u.name}</td>
                                        <td>{u.email}</td>
                                        <td><span className="badge badge-purple">{u.designations?.name || '—'}</span></td>
                                        <td><span className="badge badge-teal">{u.teams?.name || '—'}</span></td>
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
                    ) : <div className="empty-state">No users yet. Add teams and designations first, then add users.</div>}
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
