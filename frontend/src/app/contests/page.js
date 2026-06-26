"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../lib/api';
import styles from './Contests.module.css';

export default function ContestsPage() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // active, upcoming, past

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      const res = await api.get('/contests');
      setContests(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (contest) => {
    const now = new Date();
    const start = new Date(contest.start_time);
    const end = new Date(contest.end_time);

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'active';
    return 'past';
  };

  const filteredContests = contests.filter(c => getStatus(c) === activeTab);

  // Format date helper
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get duration helper
  const getDuration = (start, end) => {
    const diffMs = new Date(end) - new Date(start);
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHrs > 0 && diffMins > 0) return `${diffHrs}h ${diffMins}m`;
    if (diffHrs > 0) return `${diffHrs}h`;
    return `${diffMins}m`;
  };

  if (loading) return <div className={styles.container}>Loading contests...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Contests</h1>
          <p className={styles.subtitle}>Compete with others and test your algorithmic skills.</p>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'active' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'upcoming' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'past' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past
        </button>
      </div>

      {filteredContests.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No {activeTab} contests found.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredContests.map(contest => (
            <Link key={contest.id} href={`/contests/${contest.id}`}>
              <div className={`${styles.card} ${activeTab === 'active' ? styles.cardActive : ''}`}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.statusBadge} ${
                    activeTab === 'active' ? styles.statusActive : 
                    activeTab === 'upcoming' ? styles.statusUpcoming : styles.statusPast
                  }`}>
                    <span className={`${styles.dot} ${
                      activeTab === 'active' ? styles.dotActive : 
                      activeTab === 'upcoming' ? styles.dotUpcoming : styles.dotPast
                    }`}></span>
                    {activeTab === 'active' ? 'Running' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                  </div>
                  <span className={styles.formatBadge}>{contest.format}</span>
                </div>
                
                <h3 className={styles.contestTitle}>{contest.name}</h3>
                
                <div className={styles.timeInfo}>
                  <div className={styles.timeRow}>
                    <span>Start</span>
                    <span className={styles.timeValue}>{formatDate(contest.start_time)}</span>
                  </div>
                  <div className={styles.timeRow}>
                    <span>Duration</span>
                    <span className={styles.timeValue}>{getDuration(contest.start_time, contest.end_time)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
