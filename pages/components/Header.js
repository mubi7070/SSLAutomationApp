import Link from 'next/link';
import styles from '/styles/Home.module.css';

export default function Header() {
  const navLinks = [
    { name: 'Home', path: '/home' },
    { name: 'CSR Generator', path: '/files/CSRGenerator' },
    { name: 'SSL Installer', path: '/files/SSLInstaller' },
    { name: 'SSL Converter', path: '/files/SSLConverter' },
    { name: 'Email Templates', path: '/files/EmailTemplates' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <img src="/ssl2.svg" alt="SSL Icon" className={styles.headerIcon} />
        <span className={styles.logoText}>Northstar SSL Automation Tool</span>
      </div>
      <nav className={styles.nav}>
        {navLinks.map((link) => (
          <Link key={link.name} href={link.path} className={styles.navLink}>
            {link.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}