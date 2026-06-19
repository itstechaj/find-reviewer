'use client';

import { useState, useEffect, useCallback } from 'react';
import Toast from '@/components/Toast';
import { useRequester } from '@/components/RequesterContext';

const FUNNY_SENTENCES = [
  '🔭 Searching the cosmos for the perfect reviewer...',
  '🌱 Doing photosynthesis to power our algorithms...',
  '🔮 Consulting the oracle of code reviews...',
  '🦆 Asking rubber ducks for their opinion...',
  '🔗 Reversing a linked list just for fun...',
  '☕ Brewing coffee for the reviewer...',
  '🧬 Analyzing DNA of available reviewers...',
  '🚀 Launching reviewer-finding satellites...',
  '🎯 Calibrating the reviewer-targeting system...',
  '🧠 Training neural networks on review patterns...',
  '🪐 Scanning parallel universes for reviewers...',
  '🎲 Rolling the dice of destiny...',
];

const ANY_TEAM = '__any__';

export default function HomePage() {
  const { email: requesterEmail } = useRequester();
  const [teams, setTeams] = useState([]);
  const [reviewTypes, setReviewTypes] = useState([]);
  const [reviewerTypes, setReviewerTypes] = useState([]);

  const [selectedTeam, setSelectedTeam] = useState(ANY_TEAM);
  const [selectedReviewType, setSelectedReviewType] = useState('');
  const [selectedReviewerType, setSelectedReviewerType] = useState('');
  const [link, setLink] = useState('');

  const [loading, setLoading] = useState(false);
  const [loaderText, setLoaderText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch dropdown data
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/teams').then((r) => r.json()),
      fetch('/api/admin/review-types').then((r) => r.json()),
      fetch('/api/admin/reviewer-types').then((r) => r.json()),
    ]).then(([t, rt, rrt]) => {
      setTeams(t);
      setReviewTypes(rt);
      setReviewerTypes(rrt);
      // Pre-select PRIMARY_REVIEWER so the user can see the default
      const primary = (rrt || []).find((x) => x.name === 'PRIMARY_REVIEWER');
      if (primary) setSelectedReviewerType(String(primary.id));
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedReviewType || !link.trim()) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    if (!requesterEmail) {
      setToast({ message: 'Please sign in with your Flipkart email first', type: 'error' });
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    let sentenceIndex = 0;
    const shuffled = [...FUNNY_SENTENCES].sort(() => Math.random() - 0.5);
    setLoaderText(shuffled[0]);

    const interval = setInterval(() => {
      sentenceIndex = (sentenceIndex + 1) % shuffled.length;
      setLoaderText(shuffled[sentenceIndex]);
    }, 1200);

    const minDelay = new Promise((resolve) => setTimeout(resolve, 5000));

    const apiCall = fetch('/api/review/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: selectedTeam === ANY_TEAM ? null : parseInt(selectedTeam),
        reviewTypeId: parseInt(selectedReviewType),
        reviewerTypeId: selectedReviewerType ? parseInt(selectedReviewerType) : null,
        link: link.trim(),
        requesterEmail,
      }),
    }).then((r) => r.json());

    try {
      const [response] = await Promise.all([apiCall, minDelay]);
      clearInterval(interval);

      if (response.error) {
        setError(response.error);
      } else {
        setResult(response.reviewer);
      }
    } catch (err) {
      clearInterval(interval);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedTeam, selectedReviewType, selectedReviewerType, link, requesterEmail]);

  return (
    <div className="page-container">
      <div className="hero-section">
        <h1 className="hero-title">
          Find Your <span className="gradient-text">Perfect Reviewer</span>
        </h1>
        <p className="hero-subtitle">
          Intelligently assign reviewers based on team, reviewer type, and workload.
          Fair distribution, zero hassle.
        </p>
      </div>

      <div className="review-form-card">
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="reviewType">Review Type *</label>
            <select
              id="reviewType"
              className="form-select"
              value={selectedReviewType}
              onChange={(e) => setSelectedReviewType(e.target.value)}
            >
              <option value="">Select review type</option>
              {reviewTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.name.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="team">Team</label>
            <select
              id="team"
              className="form-select"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value={ANY_TEAM}>I don&apos;t care (any team)</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reviewerType">Reviewer Type</label>
            <select
              id="reviewerType"
              className="form-select"
              value={selectedReviewerType}
              onChange={(e) => setSelectedReviewerType(e.target.value)}
            >
              {reviewerTypes.map((rrt) => (
                <option key={rrt.id} value={rrt.id}>{rrt.name.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            {/* Spacer for grid alignment */}
          </div>

          <div className="form-group full-width">
            <label className="form-label" htmlFor="link">Document / PR Link *</label>
            <input
              id="link"
              type="url"
              className="form-input"
              placeholder="https://github.com/... or https://confluence.com/..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>
        </div>

        <div className="submit-section">
          <button
            id="findReviewerBtn"
            className="btn btn-primary btn-large"
            onClick={handleSubmit}
            disabled={loading}
          >
            🔍 Find Reviewer
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="result-card">
          <div className="result-header">✅ Reviewer Assigned</div>
          <div className="reviewer-name">{result.name}</div>
          <div className="reviewer-email">{result.email}</div>
          <div className="reviewer-meta">
            <span className="badge badge-purple">{result.reviewerType?.replace(/_/g, ' ')}</span>
            <span className="badge badge-teal">{result.team}</span>
            <span className="badge badge-pink">{result.reviewType?.replace(/_/g, ' ')}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="error-card">
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>😔</div>
          <div>{error}</div>
        </div>
      )}

      {/* Loader Overlay */}
      {loading && (
        <div className="loader-overlay">
          <div className="loader-spinner"></div>
          <div className="loader-text">{loaderText}</div>
          <div className="loader-subtext">Finding the best reviewer for your request...</div>
        </div>
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
