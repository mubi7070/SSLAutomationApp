import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';
import Link from 'next/link';
import Head from 'next/head';

const users = [
  { username: 'devops', password: 'sibisoft2025' },
  { username: 'admin', password: 'PasswordTemp5' },
  { username: 'nssupport', password: 'nssupport2025' },
];

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
  e.preventDefault();

  const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (result.success) {
      localStorage.setItem('authenticated', 'true');
      localStorage.setItem('username', result.user.username);
      localStorage.setItem('name', result.user.name);
      router.push('/home');
    } else {
      setError(result.message || 'Login failed');
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Northstar SSL Automation Tool - Login</title>
        <link rel="icon" href="/ssl2white.svg" />
      </Head>

      <main>
        <h1 className={styles.titlenew}>
          <img src="/ssl2.svg" alt="SSL Icon" className={styles.icon} />
          Northstar SSL Automation Tool
        </h1>

        <div className={styles.grid}>
          <div className={styles.card} style={{ padding: '2rem', maxWidth: '400px' }}>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem' }}>Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={styles.styledinput}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.styledinput}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

              <button
                type="submit"
                className={styles.btndescription}
                style={{ width: '100%', fontSize: '1.1rem' }}
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerRow}>
          <a
            href="https://www.globalnorthstar.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Powered by{' '} Northstar Technologies
            <img src="/northstar.jpg" alt="Northstar" className={styles.logonew} />
          </a>
          
        </div>
        <div className={styles.footerRow}>
        <a
            href="https://www.globalnorthstar.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            |
          </a>
        </div>
        <div className={styles.footerRow}>
          <a
            href="https://github.com/mubi7070/SSLAutomationApp/tree/master"
            target="_blank"
            rel="noopener noreferrer"
          >
            By: Mubashir Ahmed (DevOps)
            <img src="/dev.svg" alt="DevOps" className={styles.logonew} />
          </a>
        </div>
      </footer>
    </div>
  );
}