import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '/pages/components/Layout.js';
import { FiArrowRight, FiShield, FiLock, FiCode, FiMail, FiRefreshCw, FiSliders, FiFileText, FiShoppingCart, FiTool, FiHelpCircle, FiZap } from 'react-icons/fi';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();

  const [sliderIndex, setSliderIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const sliderContent = [
    {
      icon: <FiZap size={40} />,
      title: "Quick Actions",
      text: "Get started with our most used tools",
      color: "#3B82F6"
    },
    {
      icon: <FiShield size={40} />,
      title: "Security First",
      text: "Enterprise-grade security for all operations",
      color: "#10B981"
    },
    {
      icon: <FiLock size={40} />,
      title: "SSL Management",
      text: "Manage certificates with ease",
      color: "#8B5CF6"
    }
  ];

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('authenticated')) {
      router.push('/');
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSliderIndex(prev => (prev + 1) % sliderContent.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isMounted) return null;


  return (
    <div className={styles.body}>
      <Head>
        <title>Northstar Automation Tool</title>
        <link rel="icon" href="/ssl2white.svg" />
      </Head>
      <Layout>

      <main className={styles.mainContainer}>
          <div className={styles.heroSection}>
            <h1 className={styles.heroTitle}>
              <img src="/ssl2.svg" alt="SSL Icon" className={styles.icon} />
              Northstar Automation Tool
              <span className={styles.heroBadge}>Live</span>
            </h1>
            <p className={styles.heroSubtitle}>DevOps Automation Solution</p>
          </div>

        <div className={styles.contentWrapper}>
          <div className={styles.gridContainer}>
            <div className={styles.cardGrid}>
              <Link href="/files/CSRGenerator" className={`${styles.card} ${styles.cardCsr}`}>
                <FiCode className={styles.cardIcon} />
                <div>
                  <h3>CSR Generator</h3>
                  <p>Generate CSR & Keystore with domain names</p>
                </div>
                <FiArrowRight className={styles.cardArrow} />
              </Link>

              <Link href="/files/SSLInstaller" className={`${styles.card} ${styles.cardSsl}`}>
                <FiLock className={styles.cardIcon} />
                <div>
                  <h3>SSL Installer</h3>
                  <p>Update certificates path for keystore installation</p>
                </div>
                <FiArrowRight className={styles.cardArrow} />
              </Link>

              <Link href="/files/SSLConverter" className={`${styles.card} ${styles.cardConverter}`}>
                <FiRefreshCw className={styles.cardIcon} />
                <div>
                  <h3>SSL Converter</h3>
                  <p>Convert file formats with path updates</p>
                </div>
                <FiArrowRight className={styles.cardArrow} />
              </Link>

              <Link href="/files/EmailTemplates" className={`${styles.card} ${styles.cardEmail}`}>
                <FiMail className={styles.cardIcon} />
                <div>
                  <h3>Email Templates</h3>
                  <p>SSL renewal & Cloudflare templates</p>
                </div>
                <FiArrowRight className={styles.cardArrow} />
              </Link>

              <Link href="/files/LicenseRenewal" className={`${styles.card} ${styles.cardLicense}`}>
                <FiFileText className={styles.cardIcon} />
                <div>
                  <h3>License Renewal</h3>
                  <p>Track upcoming license expiries</p>
                </div>
                <FiArrowRight className={styles.cardArrow} />
              </Link>

              <Link href="/files/TwilioDisable" className={`${styles.card} ${styles.cardTwilio}`}>
                <FiSliders className={styles.cardIcon} />
                <div>
                  <h3>Disable Twilio</h3>
                  <p>Manage Twilio Sub-Accounts</p>
                </div>
                <FiArrowRight className={styles.cardArrow} />
              </Link>

              <Link href="/files/TwilioDisable" className={`${styles.card} ${styles.cardHelp}`}>
                <FiSliders className={styles.cardIcon} />
                <div>
                  <h3>Help</h3>
                  <p>Include the necessary information</p>
                </div>
                <FiArrowRight className={styles.cardArrow} />
              </Link>
            </div>
          </div>
          <div className={styles.rightColumn}>
          <div className={styles.sliderContainer}>
          
            <div className={styles.sliderTrack} style={{ transform: `translateX(-${sliderIndex * 100}%)` }}>
              {sliderContent.map((item, index) => (
                <div 
                  key={index}
                  className={styles.slide}
                  style={{ backgroundColor: item.color }}
                >
                  <div className={styles.slideContent}>
                    <div className={styles.slideIcon}>{item.icon}</div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </div>
                
              ))}
            </div>
            
            <div className={styles.sliderDots}>
                {sliderContent.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.dot} ${index === sliderIndex ? styles.activeDot : ''}`}
                    onClick={() => setSliderIndex(index)}
                  />
                ))}
              </div>
              
          </div>

          <div className={styles.postSliderImage}>
                <img 
                  src="/dashboardpart2.gif" 
                  alt="Feature highlight"
                  className={styles.postSliderImg}
                />
          </div>

          </div>
          
        </div>
        

        <div className={styles.externalLinks}>
          <h2 className={styles.linksTitle}>Quick External Links</h2>
          <div className={styles.linkGrid}>
            {[
              { href: 'https://docs.google.com/spreadsheets/d/1xOoiO96sFfYB8uFnOgn3xom-wzL7XntPiEJkRk5TOC4/edit', title: 'SSL Renewal Sheet', icon: <FiFileText /> },
              { href: 'https://www.thesslstore.com/client/orders.aspx', title: 'SSL Store', icon: <FiShoppingCart /> },
              { href: 'https://www.sslshopper.com/certificate-key-matcher.html', title: 'CSR Matcher', icon: <FiTool /> },
              { href: 'https://www.ssllabs.com/ssltest/', title: 'SSL Labs Test', icon: <FiShield /> },
              { href: 'https://docs.google.com/spreadsheets/d/1yVCinTBlCnvv1CYWFjSsfpLjvUcQONJAuBLRoBc4rfE/edit', title: 'Tracking Data', icon: <FiFileText /> },
              
            ].map((link, index) => (
              <a
                key={index}
                href={link.href}
                className={styles.externalLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.icon}
                <span>{link.title}</span>
              </a>
            ))}
          </div>
        </div>
      </main>
      </Layout>

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
