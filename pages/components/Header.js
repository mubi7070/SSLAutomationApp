// components/Header.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '/styles/Home.module.css';

export default function Header() {
  const router = useRouter();
  const [displayText, setDisplayText] = useState('');
  const fullText = "Northstar SSL Automation Tool";
  const [isTyping, setIsTyping] = useState(true);

  const navLinks = [
    { name: 'Home', path: '/home' },
    { name: 'CSR Generator', path: '/files/CSRGenerator' },
    { name: 'SSL Installer', path: '/files/SSLInstaller' },
    { name: 'SSL Converter', path: '/files/SSLConverter' },
    { name: 'Email Templates', path: '/files/EmailTemplates' },
  ];

  useEffect(() => {
    let currentIndex = 0;
    let typingTimeout;

    const typeText = () => {
      if (currentIndex < fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
        typingTimeout = setTimeout(typeText, 100);
      } else {
        setIsTyping(false);
        setTimeout(() => {
          setDisplayText('');
          setIsTyping(true);
          currentIndex = 0;
          typeText();
        }, 3000);
      }
    };

    typeText();

    return () => clearTimeout(typingTimeout);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <img src="/ssl2.svg" alt="SSL Icon" className={styles.headerIcon} />
        <span className={styles.logoText}>
          {displayText}
          <span className={isTyping ? styles.cursor : ''}>&nbsp;</span>
        </span>
      </div>
      <nav className={styles.nav}>
        {navLinks.map((link) => (
          <Link 
            key={link.name} 
            href={link.path}
            className={`${styles.navLink} ${router.pathname === link.path ? styles.activeNavLink : ''}`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}