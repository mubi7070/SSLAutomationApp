import Header from './Header';
import styles from '/styles/Home.module.css';

export default function Layout({ children }) {
  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.mainWithHeader}>{children}</main>
    </div>
  );
}