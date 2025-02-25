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

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      localStorage.setItem('authenticated', 'true');
      router.push('/home');
    } else {
      setError('Invalid username or password');
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
        {/* Keep your existing footer content */}
      </footer>
    </div>
  );
}