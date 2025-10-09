// components/Header.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LogOut } from "lucide-react";
import styles from '/styles/Home.module.css';

export default function Header() {
  const router = useRouter();
  const [displayText, setDisplayText] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const fullText = "Northstar Automation Tool";
  const [isTyping, setIsTyping] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout');
      if (response.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const categories = [
    { name: 'Home', path: '/home' },
    {
      name: 'SSL',
      items: [
        { name: 'CSR Generator', path: '/files/CSRGenerator' },
        { name: 'SSL Installer', path: '/files/SSLInstaller' },
        { name: 'SSL Converter', path: '/files/SSLConverter' },
      ],
    },
    {
      name: 'Tools',
      items: [
        { name: 'License Renewal', path: '/files/LicenseRenewal' },
        { name: 'Disable Twilio', path: '/files/TwilioDisable' },
        { name: 'Sendgrid', path: '/files/Sendgrid' },
        { name: 'Server Migration', path: '/files/ServerMigration' },
      ],
    },
    {
      name: 'Templates & Sheets',
      items: [
        { name: 'Email Templates', path: '/files/EmailTemplates' },
        { name: 'SSL Renewal Sheet', path: 'https://docs.google.com/spreadsheets/d/1xOoiO96sFfYB8uFnOgn3xom-wzL7XntPiEJkRk5TOC4/edit' },
        { name: 'Tracking Data Sheet', path: 'https://docs.google.com/spreadsheets/d/1yVCinTBlCnvv1CYWFjSsfpLjvUcQONJAuBLRoBc4rfE/edit' },
      ],
    },
    {
      name: 'Links',
      items: [
        { name: 'The SSL Store', path: 'https://www.thesslstore.com/client/orders.aspx' },
        { name: 'CSR Certificate Matcher', path: 'https://www.sslshopper.com/certificate-key-matcher.html' },
        { name: 'SSL Labs', path: 'https://www.ssllabs.com/ssltest/' },
      ],
    },
    {
      name: 'Help',
      path: '/files/help',
    },
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
        }, 2000);
      }
    };

    typeText();

    return () => clearTimeout(typingTimeout);
  }, []);

  const isCategoryActive = (category) => {
    return category.items?.some(item => router.pathname === item.path) || 
           (category.path === router.pathname);
  };

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
        {categories.map((category) => (
          <div 
            key={category.name}
            className={styles.categoryContainer}
            onMouseEnter={() => category.items && setActiveCategory(category.name)}
            onMouseLeave={() => !isHovered && setActiveCategory(null)}
          >
            {category.items ? (
              <>
                <button
                  className={`${styles.navLink} ${
                    isCategoryActive(category) ? styles.activeNavLink : ''
                  } ${styles.hasDropdown}`}
                >
                  {category.name}
                </button>
                <div 
                  className={`${styles.dropdown} ${activeCategory === category.name ? styles.active : ''}`}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  {category.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.path}
                      className={`${styles.dropdownItem} ${
                        router.pathname === item.path ? styles.activeDropdownItem : ''
                      }`}
                      target={item.path.startsWith('http') ? '_blank' : undefined}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <Link
                href={category.path}
                className={`${styles.navLink} ${
                  router.pathname === category.path ? styles.activeNavLink : ''
                }`}
              >
                {category.name}
              </Link>
            )}
          </div>
        ))}
      </nav>

<div className={styles.logoutContainer}>
        <button 
          onClick={() => setShowLogoutModal(true)}
          className={styles.navLink}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <LogOut size={20} />
          Logout
        </button>

        {showLogoutModal && (
          <div className={styles.popupContainer}>
            <div className={styles.popupBox}>
              <p>Are you sure you want to logout?</p>
              <div className={styles.popupButtons}>
                <button 
                  onClick={handleLogout}
                  className={styles.yesButton}
                >
                  Logout
                </button>
                <button 
                  onClick={() => setShowLogoutModal(false)}
                  className={styles.noButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </header>
  );
}