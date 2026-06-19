'use client';

import { useState } from 'react';
import { useRequester } from './RequesterContext';

const EMAIL_REGEX = /^[^\s@]+@flipkart\.com$/;

export default function EmailGate({ children }) {
    const { email, loaded, setEmail } = useRequester();
    const [input, setInput] = useState('');
    const [error, setError] = useState(null);

    if (!loaded) return null;
    if (email) return children;

    const handleSubmit = (e) => {
        e.preventDefault();
        const value = input.trim().toLowerCase();
        if (!value) {
            setError('Please enter your email');
            return;
        }
        if (!EMAIL_REGEX.test(value)) {
            setError('Please use a valid @flipkart.com email');
            return;
        }
        setEmail(value);
    };

    return (
        <div className="email-gate-overlay">
            <form className="email-gate-card" onSubmit={handleSubmit}>
                <div className="email-gate-icon">👋</div>
                <h2 className="email-gate-title">Welcome to FindReviewer</h2>
                <p className="email-gate-subtitle">
                    Enter your Flipkart email to get started. We use it to make sure you
                    don&apos;t get assigned as your own reviewer.
                </p>
                <input
                    type="email"
                    className="form-input"
                    placeholder="you@flipkart.com"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        if (error) setError(null);
                    }}
                    autoFocus
                />
                {error && <div className="email-gate-error">{error}</div>}
                <button type="submit" className="btn btn-primary btn-large">
                    Continue
                </button>
            </form>
        </div>
    );
}
