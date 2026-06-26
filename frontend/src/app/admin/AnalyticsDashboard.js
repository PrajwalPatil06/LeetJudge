"use client";

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import api from '../lib/api';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const LANG_MAP = {
  54: 'C++',
  62: 'Java',
  71: 'Python 3',
  93: 'Node.js',
};

// Professional SVG Icons
const UsersIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const ProblemsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
    <polyline points="2 17 12 22 22 17"></polyline>
    <polyline points="2 12 12 17 22 12"></polyline>
  </svg>
);

const ContestsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7"></circle>
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
  </svg>
);

const SubmissionsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const LANG_COLORS = {
  'C++': '#2563eb', // Blue
  'Java': '#ea580c', // Orange
  'Python 3': '#eab308', // Yellow
  'Node.js': '#16a34a', // Green
};

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics');
      setData(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Dashboard...</div>;
  }

  if (!data) return null;

  // Format Submissions by Language
  const languageData = data.submissionsByLanguage?.map(item => ({
    name: LANG_MAP[item.lang] || `Unknown (${item.lang})`,
    count: item.count
  })) || [];

  return (
    <div style={{ marginBottom: '2rem' }}>
      
      {/* Top Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <MetricCard title="Total Users" value={data.totalUsers} icon={<UsersIcon />} gradient="linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" color="#1e3a8a" />
        <MetricCard title="Total Problems" value={data.totalProblems} icon={<ProblemsIcon />} gradient="linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" color="#14532d" />
        <MetricCard title="Total Contests" value={data.totalContests} icon={<ContestsIcon />} gradient="linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)" color="#78350f" />
        <MetricCard title="Total Submissions" value={data.totalSubmissions} icon={<SubmissionsIcon />} gradient="linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)" color="#701a75" />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        
        {/* Submissions Over Time */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Submission Trends (Last 7 Days)</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.recentSubmissions} style={{ outline: 'none' }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} 
                  itemStyle={{ color: 'var(--text-main)', fontWeight: 600 }}
                  cursor={{ stroke: 'var(--border-color)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Line type="monotone" dataKey="count" name="Submissions" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Submissions by Verdict (Solid Circle) */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Submissions by Verdict</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart style={{ outline: 'none' }}>
                <Pie
                  data={data.submissionsByVerdict}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="count"
                  nameKey="verdict"
                  stroke="var(--surface)"
                  strokeWidth={2}
                >
                  {data.submissionsByVerdict?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} 
                  itemStyle={{ fontWeight: 600 }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem',
      }}>
        
        {/* Problems by Difficulty */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Problems by Difficulty</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.problemsByDifficulty} style={{ outline: 'none' }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="difficulty" stroke="var(--text-secondary)" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} 
                  cursor={{fill: 'rgba(156, 163, 175, 0.1)'}} 
                />
                <Bar dataKey="count" name="Problems" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Submissions by Language */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Language Popularity</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={languageData} layout="vertical" margin={{ left: 20 }} style={{ outline: 'none' }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-secondary)" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} 
                  cursor={{fill: 'rgba(156, 163, 175, 0.1)'}} 
                />
                <Bar dataKey="count" name="Submissions" radius={[0, 4, 4, 0]} maxBarSize={40}>
                  {languageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={LANG_COLORS[entry.name] || '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent Contests Feed */}
      <div style={{ ...cardStyle, marginTop: '1.5rem' }}>
        <h3 style={cardTitleStyle}>Recent Contests</h3>
        {data.recentContests?.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 0', fontWeight: 600 }}>Name</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 600 }}>Start Time</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 600 }}>End Time</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 600, textAlign: 'right' }}>Participants</th>
                </tr>
              </thead>
              <tbody>
                {data.recentContests.map(contest => {
                  const now = new Date();
                  const start = new Date(contest.startTime);
                  const end = new Date(contest.endTime);
                  
                  let status = 'UPCOMING';
                  let statusColor = '#2563eb';
                  let statusBg = '#dbeafe';
                  
                  if (now >= start && now <= end) {
                    status = 'ONGOING';
                    statusColor = '#16a34a';
                    statusBg = '#dcfce7';
                  } else if (now > end) {
                    status = 'ENDED';
                    statusColor = '#4b5563';
                    statusBg = '#f3f4f6';
                  }

                  return (
                    <tr key={contest.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--text-main)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {contest.name}
                          <span style={{ 
                            padding: '0.15rem 0.4rem', 
                            borderRadius: '9999px', 
                            fontSize: '0.65rem', 
                            fontWeight: 700,
                            backgroundColor: statusBg,
                            color: statusColor
                          }}>
                            {status}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>
                        {start.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>
                        {end.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>
                        {contest.participants}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No recent contests
          </div>
        )}
      </div>

    </div>
  );
}

function MetricCard({ title, value, icon, gradient, color }) {
  return (
    <div style={{
      background: gradient,
      borderRadius: 'var(--radius)',
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      border: '1px solid rgba(0,0,0,0.05)'
    }}>
      <div>
        <h4 style={{ margin: '0 0 0.25rem 0', color: color, opacity: 0.8, fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </h4>
        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: color }}>
          {value}
        </p>
      </div>
      <div style={{ color: color, opacity: 0.8, display: 'flex' }}>
        {icon}
      </div>
    </div>
  );
}

const cardStyle = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
};

const cardTitleStyle = {
  fontSize: '1.125rem',
  marginTop: 0,
  marginBottom: '1.5rem',
  color: 'var(--text-main)',
  fontWeight: 600,
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '0.75rem'
};
