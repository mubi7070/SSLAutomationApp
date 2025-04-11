import React from 'react';
import Head from "next/head";
import Link from "next/link";
import styles from "/styles/Home.module.css";
import Layout from '/pages/components/Layout.js';
import { 
  Info, 
  FileText, 
  Key, 
  Shield, 
  RefreshCw, 
  Mail, 
  HelpCircle,
  BookOpen 
} from "lucide-react";
import Tooltip from "/pages/components/Tooltip.js";

const HelpPage = () => {
  const sections = [
    { icon: <Info size={24} />, title: "SSL/TLS Basics" },
    { icon: <FileText size={24} />, title: "Certificate Signing Request (CSR)" },
    { icon: <Key size={24} />, title: "Private Keys" },
    { icon: <Shield size={24} />, title: "Keystores & Truststores" },
    { icon: <RefreshCw size={24} />, title: "Certificate Conversion" },
    { icon: <Mail size={24} />, title: "Email Templates" },
    { icon: <HelpCircle size={24} />, title: "FAQ" }
  ];

  return (
    <main className={styles.body}>
      <Head>
        <title>Help</title>
        <link rel="icon" href="/ssl2white.svg" />
      </Head>
      <Layout>
        <div className={styles.CSRContainer}>
          <div className={styles.licenseContent}>
            <div className={styles.licenseHeader}>
              <h1 style={{ color: 'rgb(16, 31, 118)', fontWeight: 'bold', display: 'flex' }}>
                SSL Automation Tool - Help Center
              </h1>
              <Tooltip text="Explore comprehensive documentation and guides">
                <BookOpen size={24} color="#64748b" className={styles.tooltip} />
              </Tooltip>
            </div>

            <p className={styles.licenseDescription}>
              Welcome to the SSL Automation Help Center. Find detailed documentation, 
              step-by-step guides, and best practices for managing SSL/TLS certificates 
              and related operations.
            </p>

            <section className={styles.licenseDescription}>
              <div className={styles.sectionHeader}>
                <Info size={24} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>SSL/TLS Basics</h2>
              </div>
              <div className={styles.sectionContent}>
                <h3>What is SSL/TLS?</h3>
                <p>
                  SSL (Secure Sockets Layer) and its successor TLS (Transport Layer Security) are 
                  encryption protocols that provide secure communication over networks. They are 
                  commonly used to secure connections between web servers and browsers.
                </p>
                
                <div className={styles.infoCard}>
                  <h3>Why SSL is Important</h3>
                  <ul className={styles.bulletList}>
                    <li>Encrypts sensitive data in transit</li>
                    <li>Authenticates server identity</li>
                    <li>Builds customer trust with visible security indicators</li>
                    <li>Required for HTTPS implementation</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className={styles.licenseDescription}>
              <div className={styles.sectionHeader}>
                <FileText size={24} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Certificate Signing Request (CSR)</h2>
              </div>
              <div className={styles.sectionContent}>
                <p>
                  A CSR is a block of encoded text containing information about your organization 
                  and domain. It's required when applying for an SSL certificate.
                </p>
                
                <div className={styles.infoCard}>
                  <h3>CSR Components</h3>
                  <ul className={styles.bulletList}>
                    <li><strong>Common Name (CN)</strong>: Fully Qualified Domain Name</li>
                    <li><strong>Organization (O)</strong>: Legal company name</li>
                    <li><strong>Organizational Unit (OU)</strong>: Department name</li>
                    <li><strong>Locality (L)</strong>: City name</li>
                    <li><strong>Country (C)</strong>: Two-letter country code</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Add other sections following the same pattern */}

            <section className={`${styles.licenseDescription} ${styles.faqSection}`}>
              <div className={styles.sectionHeader}>
                <HelpCircle size={24} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.faqCard}>
                  <h3>What's the difference between keystore and truststore?</h3>
                  <p>
                    Keystore contains private keys and certificates, while truststore 
                    contains CA certificates to verify peers.
                  </p>
                </div>

                <div className={styles.faqCard}>
                  <h3>How often should I renew my SSL certificate?</h3>
                  <p>
                    Typically 1 year, but modern certificates can have shorter validity periods
                    (90 days recommended).
                  </p>
                </div>
              </div>
            </section>

          </div>

          <div className={styles.licenseVisual}>
            <img 
              src="/help.png" 
              alt="SSL Help Documentation"
              className={styles.licenseImage}
            />
            <div className={styles.quickLinks}>
              <h3 className={styles.quickLinksTitle}>Quick Links</h3>
              <ul className={styles.quickLinksList}>
                {sections.map((section, index) => (
                  <li key={index} className={styles.quickLinkItem}>
                    {section.icon}
                    <span>{section.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.Installerhomebtn}>
          <button><Link href="/home">Back to Home</Link></button>
        </div>
      </Layout>
    </main>
  );
};

export default HelpPage;