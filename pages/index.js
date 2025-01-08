import Head from 'next/head';
import styles from '../styles/Home.module.css';
import Link from 'next/link';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>SSL Automation Tool</title>
        <link rel="icon" href="./ssl2white.svg" />
      </Head>

      <main>
        
      <h1 className={styles.titlenew}>
        <img src="./ssl2.svg" alt="SSL Icon" className={styles.icon} />
           SSL Automation Tool
        </h1>

        <div className={styles.grid}>
          <Link href="/files/CSRGenerator" className={styles.card} >
            <h3>CSR Generator &rarr;</h3>
            <p>Generate CSR & Keystore by adding the domain names.</p>
          </Link>

          <Link href="/files/SSLInstaller" className={styles.card} >
            <h3>SSL Installer &rarr;</h3>
            <p>Just update the certificates path and get the installed keystore</p>
          </Link>

          <Link href="/files/SSLConverter" className={styles.card} >
            <h3>SSL Converter &rarr;</h3>
            <p>Convert the file formats by just updating the paths and file names.</p>
          </Link>
          
          <Link href="https://docs.google.com/spreadsheets/d/1xOoiO96sFfYB8uFnOgn3xom-wzL7XntPiEJkRk5TOC4/edit?gid=1355153592#gid=1355153592" className={styles.card} target="_blank" rel="noopener noreferrer">
            <h3>SSL Renewal Sheet &rarr;</h3>
            <p>Go to the google sheet to check the yearly renewals.</p>
          </Link>

          <Link href="https://www.sslshopper.com/certificate-key-matcher.html" className={styles.card} target="_blank" rel="noopener noreferrer">
              <h3>CSR Certificate Matcher &rarr;</h3>
              <p>Go to the website and check if the CSR and the certificate matches.</p>
          </Link>

          <Link href="https://www.ssllabs.com/ssltest/" className={styles.card} target="_blank" rel="noopener noreferrer">
              <h3>SSL Server Test &rarr;</h3>
              <p>Go to the website and test the SSL and ciphers health.</p>
          </Link>
          
        </div>
      </main>

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
            href="https://github.com/mubi7070/SSLAutomationApp/tree/master"
            target="_blank"
            rel="noopener noreferrer"
          >
            By: Mubashir Ahmed (DevOps)
            <img src="/dev.svg" alt="DevOps" className={styles.logonew} />
          </a>
        </div>
      </footer>

      <style jsx>{`
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color:rgb(236, 236, 236);
        }
        
        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family:
            Menlo,
            Monaco,
            Lucida Console,
            Liberation Mono,
            DejaVu Sans Mono,
            Bitstream Vera Sans Mono,
            Courier New,
            monospace;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            Segoe UI,
            Roboto,
            Oxygen,
            Ubuntu,
            Cantarell,
            Fira Sans,
            Droid Sans,
            Helvetica Neue,
            sans-serif;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
