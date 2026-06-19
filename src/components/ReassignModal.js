'use client';

import { useState } from 'react';

const EMAIL_REGEX = /^[^\s@]+@flipkart\.com$/;

export default function ReassignModal({
    assignmentId,
    requesterEmail,
    currentReviewerEmail,
    onClose,
    onSuccess,
}) {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const value = email.trim().toLowerCase();
        if (!value) {
            setError('New reviewer email is required');
            return;
        }
        if (!EMAIL_REGEX.test(value)) {
            setError('Please enter a valid @flipkart.com email');
            return;
        }
        if (value === (requesterEmail || '').toLowerCase()) {
            setError('You cannot reassign the review to yourself');
            return;
        }
        if (currentReviewerEmail && value === currentReviewerEmail.toLowerCase()) {
            setError('This review is already assigned to that reviewer');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/review/reassign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignmentId,
                    newReviewerEmail: value,
                    requesterEmail,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data?.error || 'Failed to reassign');
                setSubmitting(false);
                return;
            }
            onSuccess?.(data);
        } catch (err) {
            setError('Network error. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>🔄 Reassign Review</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Enter the Flipkart email of the person you want to reassign this review to.
                        Counts and the ledger will be updated.
                    </p>
                    <div className="form-group">
                        <label className="form-label" htmlFor="newReviewerEmail">
                            New reviewer email *
                        </label>
                        <input
                            id="newReviewerEmail"
                            type="email"
                            className="form-input"
                            placeholder="reviewer@flipkart.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (error) setError(null);
                            }}
                            autoFocus
                            disabled={submitting}
                        />
                    </div>
                    {error && (
                        <div className="email-gate-error" style={{ marginBottom: '0.75rem' }}>
                            {error}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? 'Reassigning...' : 'Reassign'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
