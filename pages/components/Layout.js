// components/Layout.js
import { useRouter } from 'next/router';
import Header from './Header';
import styles from '/styles/Home.module.css';

export default function Layout({ children }) {
  const router = useRouter();
  
  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.mainWithHeader}>
        {children}
      </main>
    </div>
  );
}