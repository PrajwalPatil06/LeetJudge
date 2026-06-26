"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  const navLinks = [
    { name: 'Problems', path: '/' },
    { name: 'Contests', path: '/contests' },
    { name: 'Submissions', path: '/submissions' },
  ];

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/">LeetJudge</Link>
      </div>
      <div className={styles.navLinks}>
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.path}
            className={`${styles.link} ${pathname === link.path ? styles.active : ''}`}
          >
            {link.name}
          </Link>
        ))}
        {user?.role === 'ADMIN' && (
          <Link
            href="/admin"
            className={`${styles.link} ${pathname === '/admin' ? styles.active : ''}`}
          >
            Admin Panel
          </Link>
        )}
      </div>
      <div className={styles.authLinks}>
        {loading ? null : user ? (
          <>
            <span className={styles.username}>{user.username || user.email}</span>
            <button onClick={logout} className={styles.link} style={{ cursor: 'pointer' }}>
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className={styles.link}>Log In</Link>
            <Link href="/signup" className={styles.primaryBtn}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
