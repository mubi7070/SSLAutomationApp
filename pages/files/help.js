import React from 'react';
import Head from "next/head";
import Link from "next/link";
import styles from "/styles/Home.module.css";

const HelpPage = () => {
  return (
    <main className={styles.body}>
      <Head>
        <title>Help</title>
        <link rel="icon" href="/ssl2white.svg" />
      </Head>
      
    <div>
    <div className={styles.helpcontainer}>
      <h1 style={{ color: 'rgb(16, 31, 118)', fontWeight: 'bold', display: 'flex', justifyContent: 'center'}}>SSL Automation Tool - Help / Documentation</h1>
      
      <section className={styles.section}>
        <h2 className={styles.sectiontitle}>SSL/TLS Basics</h2>
        <div className={styles.sectioncontent}>
          <h3>What is SSL/TLS?</h3>
          <p>
            SSL (Secure Sockets Layer) and its successor TLS (Transport Layer Security) are 
            encryption protocols that provide secure communication over networks. They are 
            commonly used to secure connections between web servers and browsers.
          </p>
          
          <h3>Why SSL is Important</h3>
          <ul>
            <li>Encrypts sensitive data in transit</li>
            <li>Authenticates server identity</li>
            <li>Builds customer trust with visible security indicators</li>
            <li>Required for HTTPS implementation</li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectiontitle}>Certificate Signing Request (CSR)</h2>
        <div className={styles.sectioncontent}>
          <p>
            A CSR is a block of encoded text containing information about your organization 
            and domain. It's required when applying for an SSL certificate.
          </p>
          
          <h3>CSR Components</h3>
          <ul>
            <li><strong>Common Name (CN)</strong>: Fully Qualified Domain Name (e.g., example.com)</li>
            <li><strong>Organization (O)</strong>: Legal company name</li>
            <li><strong>Organizational Unit (OU)</strong>: Department name</li>
            <li><strong>Locality (L)</strong>: City name</li>
            <li><strong>Country (C)</strong>: Two-letter country code</li>
            <li><strong>Public Key</strong>: Automatically generated with private key</li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectiontitle}>Private Keys</h2>
        <div className={styles.sectioncontent}>
          <p>
            A cryptographic key used for encrypting/decrypting sensitive data. 
            <span className={styles.highlight}>Never share your private key!</span>
          </p>
          <ul>
            <li>Generated with CSR</li>
            <li>Typically 2048 or 4096-bit RSA keys</li>
            <li>Must be kept secure</li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectiontitle}>Keystores & Truststores</h2>
        <div className={styles.sectioncontent}>
          <h3>Keystore Types</h3>
          <ul>
            <li><strong>JKS (Java KeyStore)</strong>: Java-specific format</li>
            <li><strong>PKCS12 (.p12/.pfx)</strong>: Industry-standard format</li>
          </ul>
          
          <h3>Common Operations</h3>
          <ul>
            <li>Store private keys and certificates</li>
            <li>Manage trust chains</li>
            <li>Import/export certificates</li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectiontitle}>Certificate Conversion</h2>
        <div className={styles.sectioncontent}>
          <p>Our tool supports conversion between formats:</p>
          <div className={styles.conversiondiagram}>
            JKS ↔ PKCS12 ↔ PEM
          </div>
          <p>There is no difference between <b>P12 & PFX</b>. Both are same. Just different extension.</p>
          <h3>Common Formats</h3>
          <ul>
            <li><strong>.pem</strong>: Base64 encoded certificate</li>
            <li><strong>.ca-bundle</strong>: Includes the intermediate and root certificates</li>
            <li><strong>.p12</strong>: PKCS12 archive format</li>
            <li><strong>.crt</strong>: Certificate file</li>
            <li><strong>.key</strong>: Private key file</li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectiontitle}>Email Templates</h2>
        <div className={styles.sectioncontent}>
          <p>Pre-configured templates for common SSL-related communications:</p>
          <ul>
            <li>SSL Certificate expiration reminders</li>
            <li>CSR submission confirmations</li>
            <li>Google sheet updatation</li>
          </ul>
        </div>
      </section>

      <section className={`${styles.section} ${styles.faq}`}>
        <h2 className={styles.sectiontitle}>FAQ</h2>
        <div className={styles.sectioncontent}>
          <h3>What's the difference between keystore and truststore?</h3>
          <p>
            Keystore contains private keys and certificates, while truststore 
            contains CA certificates to verify peers.
          </p>

          <h3>How often should I renew my SSL certificate?</h3>
          <p>
            Typically 1 year, but modern certificates can have shorter validity periods
            (90 days recommended).
          </p>
        </div>
      </section>

      </div>

      <div className={styles.Installerhomebtn}>
        <button><Link href="/">Back to Home</Link></button>
      </div>

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
    </main>
  );
};

export default HelpPage;