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

        <p className={styles.description}>
          By: Mubashir Ahmed
        </p>

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
          
          <Link href="https://docs.google.com/spreadsheets/d/1xOoiO96sFfYB8uFnOgn3xom-wzL7XntPiEJkRk5TOC4/edit?gid=1355153592#gid=1355153592" className={styles.card} >
            <h3>SSL Renewal Sheet &rarr;</h3>
            <p>Go the the google sheet to check the yearly renewals.</p>
          </Link>
          
        </div>
      </main>

      <footer>
        <a
          href="https://www.globalnorthstar.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '} Northstar Technologies
          <img src="/northstar.jpg" alt="Northstar" className={styles.logo} />
        </a>
      </footer>

      <style jsx>{`
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        footer img {
          margin-left: 0.5rem;
        }
        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          color: inherit;
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
