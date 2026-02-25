import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LogOut } from "lucide-react";
import styles from '/styles/Home.module.css';
import { FiUser } from 'react-icons/fi';

export default function Header() {
  const router = useRouter();
  const [displayText, setDisplayText] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  
  const fullText = "Northstar Automation Tool";
  const [isTyping, setIsTyping] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Profile State
  const [userName, setUserName] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileTimeoutRef = useRef(null); // Reference for the 2-second delay timer

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAdmin(localStorage.getItem('is_admin') === 'true');
      setUserName(localStorage.getItem('name') || localStorage.getItem('username') || 'User');
    }
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout');
      if (response.ok) {
        localStorage.clear();
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

  // Helper to extract Name Initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // --- Profile Hover Handlers ---
  const handleProfileMouseEnter = () => {
    if (profileTimeoutRef.current) {
      clearTimeout(profileTimeoutRef.current);
    }
    setShowProfileMenu(true);
  };

  const handleProfileMouseLeave = () => {
    profileTimeoutRef.current = setTimeout(() => {
      setShowProfileMenu(false);
    }, 1000); // 1000 milliseconds = 1 second delay
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
            onMouseLeave={() => setActiveCategory(null)}
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
      {isAdmin && (
        <Link
          href="/admin"
          className={`${styles.navLink} ${
            router.pathname.startsWith('/admin') ? styles.activeNavLink : ''
          }`}
        >
          Admin
        </Link>
      )}
      </nav>

      {/* User Profile Section */}
      <div 
        style={{ position: 'relative', marginLeft: '1rem' }} 
        onMouseEnter={handleProfileMouseEnter}
        onMouseLeave={handleProfileMouseLeave}
      >
        {/* Rounded Rectangle Profile Button */}
        <div 
          style={{
            height: '40px', 
            padding: '0 14px',
            backgroundColor: '#1e3a8a', 
            borderRadius: '15px', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 'bold', 
            fontSize: '1rem', 
            cursor: 'pointer', 
            userSelect: 'none',
            border: '1px solid #e2e8f0', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'background-color 0.2s'
          }}
          title={userName}
        >
          <FiUser size={18} />
          {getInitials(userName)}
        </div>
        
        {/* Dropdown Menu */}
        {showProfileMenu && (
           <div style={{ 
              position: 'absolute', top: '50px', right: '0', background: 'white', 
              border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 12px 12px', 
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 1000, minWidth: '180px' 
           }}>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                
                {/* User Icon inside a circle */}
                <div style={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '50%', 
                  width: '48px', 
                  height: '48px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '8px' 
                }}>
                  <FiUser size={24} color="#64748b" />
                </div>

                {/* USER label in bold */}
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>
                  User
                </span>

                {/* Name of the user in dark blue */}
                <span style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '1.05rem', textAlign: 'center' }}>
                  {userName}
                </span>

              </div>
              <button 
                onClick={() => setShowLogoutModal(true)} 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '5px 0', fontSize: '0.95rem', fontWeight: '500' }}
              >
                <LogOut size={18} /> Logout
              </button>
           </div>
        )}

        {/* Existing Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className={styles.popupContainer}>
            <div className={styles.popupBox}>
              <p>Are you sure you want to logout?</p>
              <div className={styles.popupButtons}>
                <button onClick={handleLogout} className={styles.yesButton}>Logout</button>
                <button onClick={() => setShowLogoutModal(false)} className={styles.noButton}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>

    </header>
  );
}