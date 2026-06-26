"use client";

import { useState, useEffect, use } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import styles from './ContestDashboard.module.css';

export default function ContestDashboard({ params }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [contest, setContest] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [problems, setProblems] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  
  const [activeTab, setActiveTab] = useState('problems');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [status, setStatus] = useState('upcoming'); // upcoming, active, past

  useEffect(() => {
    fetchContestData();
  }, [id, user]);

  useEffect(() => {
    if (!contest) return;

    const timer = setInterval(() => {
      updateTimer(contest);
    }, 1000);

    return () => clearInterval(timer);
  }, [contest]);

  const fetchContestData = async () => {
    try {
      setLoading(true);
      
      // Fetch Contest
      const res = await api.get(`/contests/${id}`);
      const contestData = res.data;
      setContest(contestData);
      updateTimer(contestData);

      // Fetch Registration Status
      if (user) {
        try {
          const regRes = await api.get(`/contests/${id}/registration-status`);
          setIsRegistered(regRes.data.isRegistered);

          // Fetch Problems (will fail if not started, we'll handle gracefully)
          const probRes = await api.get(`/contests/${id}/problems`);
          setProblems(probRes.data);

          // Fetch Submissions
          const subRes = await api.get(`/contests/${id}/submissions`);
          setSubmissions(subRes.data);
        } catch (ignoredError) {
          // Some routes might 403 or 404 depending on timing, that's expected
        }
      }

      // Fetch Leaderboard
      try {
        const leadRes = await api.get(`/contests/${id}/leaderboard`);
        setLeaderboard(leadRes.data);
      } catch (ignoredError) {
        // Just in case it fails
      }

    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTimer = (c) => {
    const now = new Date().getTime();
    const start = new Date(c.start_time).getTime();
    const end = new Date(c.end_time).getTime();

    if (now < start) {
      setStatus('upcoming');
      setTimeLeft(formatTimeDiff(start - now));
    } else if (now >= start && now <= end) {
      setStatus('active');
      setTimeLeft(formatTimeDiff(end - now));
    } else {
      setStatus('past');
      setTimeLeft('Ended');
    }
  };

  const formatTimeDiff = (diff) => {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRegister = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    try {
      await api.post(`/contests/${id}/register`);
      setIsRegistered(true);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  if (loading) return <div className={styles.container}>Loading contest...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;
  if (!contest) return <div className={styles.container}>Contest not found</div>;

  return (
    <div className={styles.container}>
      {/* Header section */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <h1>{contest.name}</h1>
            <span className={styles.formatBadge}>{contest.format}</span>
          </div>
          <div className={styles.timerArea}>
            <span className={styles.timerLabel}>
              {status === 'upcoming' ? 'Starts In' : status === 'active' ? 'Ends In' : 'Status'}
            </span>
            <div className={`${styles.timerValue} ${status === 'active' ? styles.timerActive : status === 'past' ? styles.timerEnded : ''}`}>
              {timeLeft}
            </div>
          </div>
        </div>
        
        <div className={styles.description}>
          {contest.description}
        </div>

        <div className={styles.actionArea}>
          {isRegistered ? (
            <div className={styles.registeredBadge}>✓ Registered</div>
          ) : status !== 'past' ? (
            <button className={styles.registerBtn} onClick={handleRegister}>
              Register for Contest
            </button>
          ) : null}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'problems' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('problems')}
        >
          Problems
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'leaderboard' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard
        </button>
        {user && isRegistered && (
          <button 
            className={`${styles.tab} ${activeTab === 'submissions' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('submissions')}
          >
            My Submissions
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'problems' && (
          <div>
            {!isRegistered ? (
              <div className={styles.messageBox}>
                <h2>Please register to view problems</h2>
                <p>Registration is required to participate in this contest.</p>
              </div>
            ) : status === 'upcoming' ? (
              <div className={styles.messageBox}>
                <h2>Contest hasn't started yet</h2>
                <p>Problems will appear here when the contest begins.</p>
              </div>
            ) : problems.length === 0 ? (
              <div className={styles.messageBox}>
                <h2>No problems added yet</h2>
              </div>
            ) : (
              <div>
                {problems.map((p, idx) => (
                  <div key={p.id} className={styles.problemRow}>
                    <div>
                      <div className={styles.problemTitle}>{idx + 1}. {p.title}</div>
                      <div className={styles.problemStats}>
                        <span>Points: {p.max_score}</span>
                      </div>
                    </div>
                    <Link href={`/contests/${id}/problems/${p.id}`}>
                      <button className={styles.solveBtn}>Solve Problem</button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div>
            {leaderboard.length === 0 ? (
              <div className={styles.messageBox}>
                <h2>No users on leaderboard yet</h2>
              </div>
            ) : (
              <table className={styles.leaderboardTable}>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>User</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => (
                    <tr key={entry.user_id}>
                      <td className={
                        idx === 0 ? styles.rank1 : 
                        idx === 1 ? styles.rank2 : 
                        idx === 2 ? styles.rank3 : ''
                      }>
                        #{idx + 1}
                      </td>
                      <td>{entry.username}</td>
                      <td>{entry.total_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'submissions' && user && isRegistered && (
          <div>
            {submissions.length === 0 ? (
              <div className={styles.messageBox}>
                <h2>No submissions yet</h2>
                <p>Your submissions for this contest will appear here.</p>
              </div>
            ) : (
              <table className={styles.leaderboardTable}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Problem</th>
                    <th>Language</th>
                    <th>Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(sub => (
                    <tr key={sub.id}>
                      <td>{new Date(sub.timestamp).toLocaleString()}</td>
                      <td>{sub.problem_title}</td>
                      <td>{sub.lang}</td>
                      <td style={{ 
                        color: sub.verdict === 'ACCEPTED' ? 'var(--status-accepted)' : 
                               sub.verdict === 'PENDING' ? 'var(--text-secondary)' : 'var(--status-wrong)',
                        fontWeight: 600
                      }}>
                        {sub.verdict}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
