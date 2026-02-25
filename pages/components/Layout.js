import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from './Header';
import styles from '/styles/Home.module.css';

export default function Layout({ children }) {
  const router = useRouter();

  // 30-Minute Idle Timeout Logic
  useEffect(() => {
    let timeoutId;

    const logoutUser = async () => {
      await fetch('/api/logout');
      localStorage.clear();
      router.push('/');
    };

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      // Set timeout for 30 minutes (30 * 60 * 1000 milliseconds)
      timeoutId = setTimeout(logoutUser, 30 * 60 * 1000);
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimeout));
    
    // Initialize the timer on mount
    resetTimeout();

    return () => {
      events.forEach(event => document.removeEventListener(event, resetTimeout));
      clearTimeout(timeoutId);
    };
  }, []);
  
  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.mainWithHeader}>
        {children}
      </main>
    </div>
  );
}