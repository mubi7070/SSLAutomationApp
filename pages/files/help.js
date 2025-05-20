import React from 'react';
import Head from "next/head";
import Link from "next/link";
import styles from "/styles/Home.module.css";
import Layout from '/pages/components/Layout.js';
import { 
  Info, FileText, Key, Shield, RefreshCw, Mail, HelpCircle,
  BookOpen, Link as LinkIcon, ShoppingCart, Settings, Calendar,
  Lock, Code, Database, Cloud, Clipboard, AlertOctagon, Server
} from "lucide-react";
import Tooltip from "/pages/components/Tooltip.js";

const HelpPage = () => {
  const sections = [
    { id: 'ssl-basics', icon: <Info size={20} />, title: "SSL/TLS Basics" },
    { id: 'csr-gen', icon: <FileText size={20} />, title: "CSR & Key Generation" },
    { id: 'cert-install', icon: <Key size={20} />, title: "Certificate Installation" },
    { id: 'conversion', icon: <RefreshCw size={20} />, title: "Certificate Conversion" },
    { id: 'email-templates', icon: <Mail size={20} />, title: "Email Templates" },
    { id: 'license', icon: <Calendar size={20} />, title: "License Renewal" },
    { id: 'twilio', icon: <AlertOctagon size={20} />, title: "Twilio Management" },
    { id: 'renewal-sheet', icon: <Database size={20} />, title: "Renewal Tracking" },
    { id: 'ssl-store', icon: <ShoppingCart size={20} />, title: "SSL Store" },
    { id: 'ssl-labs', icon: <Cloud size={20} />, title: "SSL Health Check" },
    { id: 'tracking', icon: <Clipboard size={20} />, title: "Data Tracking" },
    { id: 'faq', icon: <HelpCircle size={20} />, title: "FAQs" }
  ];

  return (
    <main className={styles.body}>
      <Head>
        <title>Help Center</title>
        <link rel="icon" href="/ssl2white.svg" />
      </Head>
      <Layout>
        <div className={styles.CSRContainer2}>
          <div className={styles.licenseContent2}>
            <div className={styles.licenseHeader}>
              <h1 style={{ color: 'rgb(16, 31, 118)', fontWeight: 'bold' }}>
                SSL Automation Tool - Help Center
              </h1>
              <Tooltip text="Explore comprehensive documentation and guides">
                <BookOpen size={24} color="#64748b" className={styles.tooltip} />
              </Tooltip>
            </div>

            <p className={styles.licenseDescription}>
              Comprehensive guide to managing SSL/TLS certificates, License Renewals, Twilio Account Disable and related operations. Also it includes the details regarding the features of the application.
            </p>

            {/* SSL Basics Section */}
            <section id="ssl-basics" className={styles.licenseDescription}>
              <div className={styles.sectionHeader}>
                <Info size={24} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>SSL/TLS Fundamentals</h2>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.infoCard}>
                  <img src="/handshake2.png" alt="SSL Handshake" 
                  className={styles.infoImage} 
                  style={{width: '250px'}}
                  />

                  <h3>Secure Communication Workflow</h3>
                  <ul className={styles.bulletList}>
                    <li>2048-bit minimum RSA key encryption</li>
                    <li>SHA-256 hashing algorithm</li>
                    <li>SSL Handshake Checking</li>
                    <li>SSL Cipher Suite</li>
                    <li>Perfect Forward Secrecy (PFS) support</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* CSR Generation Section */}
            <section id="csr-gen" className={styles.licenseDescription}>
              <div className={styles.sectionHeader}>
                <FileText size={24} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>CSR & Key / Keystore Management</h2>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.grid3Col}>
                  <div className={styles.featureCard}>
                    <h4><Key size={18} /> Key Generation</h4>
                    <p>Generate RSA 2048/4096-bit private keys with .KEY or .PEM formatting</p>
                  </div>
                  <div className={styles.featureCard}>
                    <h4><Code size={18} /> CSR Components</h4>
                    <p>Subject Alternative Names (SAN), OU, O, L, C, and CN fields</p>
                  </div>
                  <div className={styles.featureCard}>
                    <h4><Shield size={18} /> Keystore Types</h4>
                    <p>JKS, PKCS12, and PEM formats supported</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Certificate Installation Section */}
            <section id="cert-install" className={styles.licenseDescription}>
              <div className={styles.sectionHeader}>
                <Server size={24} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Certificate Installation</h2>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.infoCard}>
                  <h3>Supported Servers</h3>
                  <ul className={styles.bulletList}>
                    <li>Apache HTTP Server</li>
                    <li>Tomcat</li>
                    <li>Node.js</li>
                  </ul>
                </div>
                <p className={styles.licenseDescription}>
                  Chain certificate bundling (root + intermediate) with SHA-256 fingerprint verification
                </p>
              </div>
            </section>

            {/* Conversion Tools Section */}
            <section id="conversion" className={styles.licenseDescription}>
              <div className={styles.sectionHeader}>
                <RefreshCw size={24} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Certificate Conversion</h2>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.grid3Col}>
                  <div className={styles.featureCard}>
                    <h4>KEY to PKCS12</h4>
                    <code>Converts the key, certificate, and bundle to the PKCS12 format.</code>
                  </div>
                  <div className={styles.featureCard}>
                    <h4>KEYSTORE to PEM</h4>
                    <code>Converts the installed keystore to the PEM format.</code>
                  </div>
                  <div className={styles.featureCard}>
                    <h4>KEYSTORE to PKCS12</h4>
                    <code>Converts the installed keystore to the PKCS12 format.</code>
                  </div>
                </div>
              </div>
            </section>

            {/* Email Templates Section */}
            <section id="email-templates" className={styles.licenseDescription}>
              <div className={styles.sectionHeader}>
                <Mail size={24} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Email Templates</h2>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.grid3Col}>
                  <div className={styles.featureCard}>
                    <h4>SSL Managed By NS</h4>
                    <p>For SSL Managed By NS, we need to share the CNAME record for SSL validation.</p>
                  </div>
                  <div className={styles.featureCard}>
                    <h4>SSL Managed By Club</h4>
                    <p>For SSL Managed By Club, we need to share the CSR with the club for SSL Certificates.</p>
                  </div>
                  <div className={styles.featureCard}>
                    <h4>SAN SSL Managed By Club</h4>
                    <p>For SAN SSL Managed By Club, we need to share the CSR and SAN domains with the club.</p>
                  </div>
                  <div className={styles.featureCard}>
                    <h4>Print Server SSL</h4>
                    <p>For Print Server SSL Managed By NS, we need to share the CNAME record for SSL validation.</p>
                  </div>
                  <div className={styles.featureCard}>
                    <h4>Cloudflare Implementation</h4>
                    <p>For Cloudflare On BackOffice, We need to share the instructions and schedule the activity.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* License Renewal Section */}
            <section id="license" className={styles.licenseDescription}>
              <div className={styles.sectionHeader}>
                <Calendar size={24} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>License Renewal System</h2>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.infoCard}>
                  <h3>Google Sheets Integration</h3>
                  <ul className={styles.bulletList}>
                    <li>Automated month-over-month license generation</li>
                    <li>Historical tracking of issued licenses</li>
                    <li>Proper heading for each month with the relevant data</li>
                    <li>CSV export functionality</li>
                    <li>Remove Duplication via App script</li>

                  </ul>
                </div>
              </div>
            </section>

            {/* Twilio Management Section */}
            <section id="twilio" className={styles.licenseDescription}>
              <div className={styles.sectionHeader}>
                <AlertOctagon size={24} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Twilio Account Management</h2>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.infoCard}>
                  <h3>Disable Functionality</h3>
                  <ul className={styles.bulletList}>
                    <li>Immediate suspension of services</li>
                    <li>API key revocation</li>
                    <li>SMS/call routing termination</li>
                    <li>Usage data preservation</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Renewal Tracking Section */}
            <section id="renewal-sheet" className={styles.licenseDescription}>
              <div className={styles.sectionHeader}>
                <Database size={24} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>SSL Renewal Tracking</h2>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.grid3Col}>
                  <div className={styles.featureCard}>
                    <h4>Expiration Details</h4>
                    <p>90/60/30-day list for the upcoming renewals</p>
                  </div>
                  <div className={styles.featureCard}>
                    <h4>Domain Inventory</h4>
                    <p>Centralized list of all SSL-protected domains</p>
                  </div>
                  <div className={styles.featureCard}>
                    <h4>Email Tracking</h4>
                    <p>Centralized list of all Emails sent to support regarding SSL Renewals</p>
                  </div>
                </div>
              </div>
            </section>

            {/* SSL Store Section */}
            <section id="ssl-store" className={styles.licenseDescription}>
              <div className={styles.sectionHeader}>
                <ShoppingCart size={24} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>SSL Certificate Marketplace (thesslstore.com)</h2>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.infoCard}>
                  <h3>Supported Certificate Types</h3>
                  <ul className={styles.bulletList}>
                    <li>Domain Validated (DV)</li>
                    <li>Wildcard Certificates</li>
                    <li>Multi-Domain SAN Certificates</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* SSL Labs Section */}
            <section id="ssl-labs" className={styles.licenseDescription}>
              <div className={styles.sectionHeader}>
                <Cloud size={24} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>SSL Configuration Analysis</h2>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.infoCard}>
                  <h3>Tested Parameters</h3>
                  <ul className={styles.bulletList}>
                    <li>Protocol support (TLS 1.2/1.3)</li>
                    <li>Cipher suite strength</li>
                    <li>Certificate transparency</li>
                    <li>Certificate stapling status</li>
                    <li>SSL Health Check</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Tracking Data Section */}
            <section id="tracking" className={styles.licenseDescription}>
              <div className={styles.sectionHeader}>
                <Clipboard size={24} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Activity Tracking</h2>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.grid3Col}>
                  <div className={styles.featureCard}>
                    <h4>Email Logs</h4>
                    <p>Timestamp, recipient, and template used for email</p>
                  </div>
                  <div className={styles.featureCard}>
                    <h4>License History</h4>
                    <p>Generated licenses with expiration dates</p>
                  </div>
                  <div className={styles.featureCard}>
                    <h4>User Actions</h4>
                    <p>Certificate generations and modifications</p>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className={`${styles.licenseDescription} ${styles.faqSection}`}>
              <div className={styles.sectionHeader}>
                <HelpCircle size={24} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.faqCard}>
                  <h3>How do I verify certificate-chain completeness?</h3>
                  <p>Use the Chain Analyzer tool or run: <code>openssl verify -untrusted chain.pem cert.pem</code></p>
                </div>
                <div className={styles.faqCard}>
                  <h3>What's the difference between PEM and PKCS#12?</h3>
                  <p>PEM is ASCII-armored for text-based systems, while PKCS#12 is binary format for Java ecosystems.</p>
                </div>
                
                <div className={styles.faqCard}>
                  <h3>Can I recover disabled Twilio accounts?</h3>
                  <p>Yes, you can enable that account within 30 days because Twilio permanently deletes accounts after 30 days.</p>
                </div>
                <div className={styles.faqCard}>
                  <h3>What validation methods are supported?</h3>
                  <p>DNS (CNAME/TXT), Email, and File-based validation for all certificate types and Cloudflare.</p>
                </div>
              </div>
            </section>
          </div>

          {/* Fixed Sidebar */}
          <div className={styles.licenseVisual2}>
            <img 
              src="/help.png" 
              alt="SSL Security Diagram" 
              className={styles.licenseImage2}
              //style={{ borderRadius: '8px', marginBottom: '20px' }}
            />
            <div className={styles.quickLinks2}>
              <h3 className={styles.quickLinksTitle2}><LinkIcon size={20} /> Navigation</h3>
              <ul className={styles.quickLinksList2}>
                {sections.map((section, index) => (
                  <a 
                    key={index} 
                    href={`#${section.id}`}
                    className={styles.quickLinkItem2}
                    onClick={(e) => {
                      e.preventDefault();
                      document.querySelector(`#${section.id}`).scrollIntoView({
                        behavior: 'smooth'
                      });
                    }}
                  >
                    {section.icon}
                    <span>{section.title}</span>
                  </a>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.Installerhomebtn}>
          <button className={styles.primaryButton}>
            <Link href="/home">Back to Home</Link>
          </button>
        </div>
      </Layout>
    </main>
  );
};

export default HelpPage;