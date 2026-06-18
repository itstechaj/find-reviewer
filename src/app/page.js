'use client';

import { useState, useEffect, useCallback } from 'react';
import Toast from '@/components/Toast';

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

export default function HomePage() {
  const [teams, setTeams] = useState([]);
  const [reviewTypes, setReviewTypes] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedReviewType, setSelectedReviewType] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('0');
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
      fetch('/api/admin/designations').then((r) => r.json()),
    ]).then(([t, rt, d]) => {
      setTeams(t);
      setReviewTypes(rt);
      setDesignations(d);
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedTeam || !selectedReviewType || !link.trim()) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    // Show funny loader sentences
    let sentenceIndex = 0;
    const shuffled = [...FUNNY_SENTENCES].sort(() => Math.random() - 0.5);
    setLoaderText(shuffled[0]);

    const interval = setInterval(() => {
      sentenceIndex = (sentenceIndex + 1) % shuffled.length;
      setLoaderText(shuffled[sentenceIndex]);
    }, 1200);

    // Wait for at least 5 seconds for the fun effect
    const minDelay = new Promise((resolve) => setTimeout(resolve, 5000));

    const apiCall = fetch('/api/review/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: parseInt(selectedTeam),
        reviewTypeId: parseInt(selectedReviewType),
        minDesignationOrder: parseInt(selectedDesignation) || 0,
        link: link.trim(),
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
  }, [selectedTeam, selectedReviewType, selectedDesignation, link]);

  return (
    <div className="page-container">
      <div className="hero-section">
        <h1 className="hero-title">
          Find Your <span className="gradient-text">Perfect Reviewer</span>
        </h1>
        <p className="hero-subtitle">
          Intelligently assign reviewers based on team, designation, and workload.
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
            <label className="form-label" htmlFor="team">Team *</label>
            <select
              id="team"
              className="form-select"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value="">Select team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="designation">
              Minimum Designation
            </label>
            <select
              id="designation"
              className="form-select"
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
            >
              <option value="0">Any (No Preference)</option>
              {designations.map((d) => (
                <option key={d.id} value={d.order}>{d.name} & above</option>
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
            <span className="badge badge-purple">{result.designation}</span>
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
